from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Request, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import HTMLResponse, Response, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from typing import List, Optional
from starlette.datastructures import UploadFile as StarletteUploadFile
import sqlite3
import os
import logging, logging.config

from . import crud, models, schemas, auth, db
from .db import SessionLocal, engine
from .core.config import get_settings
from .routers import auth_routes, supervisores_routes, estagios_routes, catalogos_routes, web_routes

# Criar tabelas
models.Base.metadata.create_all(bind=engine)

# Ajuste de caminhos: usar diretório da própria app para localizar templates e static
APP_DIR = os.path.dirname(__file__)
TEMPLATES_DIR = os.path.join(APP_DIR, 'templates')
STATIC_DIR = os.path.join(APP_DIR, 'static')

settings = get_settings()
LOGGING_CONF = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'logging.conf')
if os.path.exists(LOGGING_CONF):
    logging.config.fileConfig(LOGGING_CONF, disable_existing_loggers=False)
logger = logging.getLogger(__name__)

app = FastAPI(title=settings.APP_NAME, version=settings.VERSION)

# Flag interna para detectar execução direta (python app/main.py)
RUN_DIRECT = __name__ == "__main__"

# Templates / Static
templates = Jinja2Templates(directory=TEMPLATES_DIR)
app.state.templates = templates
from datetime import datetime

@app.middleware("http")
async def add_common_context(request: Request, call_next):
    response = await call_next(request)
    # Apenas adiciona cabeçalho com ano para possível uso futuro; templates recebem 'year' manualmente.
    response.headers["X-App-Year"] = str(datetime.utcnow().year)
    return response
if not os.path.isdir(STATIC_DIR):
    os.makedirs(STATIC_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

COOKIE_TOKEN_NAME = "token"

# Dependency para obter sessão do banco
def get_db():
    db_session = SessionLocal()
    try:
        yield db_session
    finally:
        db_session.close()

# Middleware para verificar colunas do banco na inicialização
@app.on_event("startup")
async def startup_event():
    """Verifica e adiciona colunas necessárias ao banco se não existirem"""
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'estagios.db')
    
    try:
        with sqlite3.connect(db_path) as conn:
            cursor = conn.cursor()
            
            # Verificar se as colunas novas existem na tabela estagios
            cursor.execute("PRAGMA table_info(estagios)")
            columns = [column[1] for column in cursor.fetchall()]
            
            # Adicionar colunas se não existirem
            new_columns = [
                ("disciplina", "TEXT"),
                ("nivel", "TEXT"), 
                ("num_estagiarios", "INTEGER"),
                ("observacoes", "TEXT"),
                ("instituicao_id", "INTEGER"),
                ("curso_id", "INTEGER"),
                ("unidade_id", "INTEGER")
            ]
            
            for col_name, col_type in new_columns:
                if col_name not in columns:
                    cursor.execute(f"ALTER TABLE estagios ADD COLUMN {col_name} {col_type}")
                    print(f"✅ Coluna {col_name} adicionada à tabela estagios")
            
            conn.commit()
    except Exception as e:
        logger.warning(f"Erro na verificação do banco: {e}")

# Rotas principais
@app.get("/")
async def root():
    return {"name": "Sistema de Estágios", "status": "online"}

@app.get("/health", response_class=JSONResponse)
async def health_check():
    return {"status": "ok"}

# ----------------------
# Helpers de autenticação via Cookie (para páginas HTML)
# ----------------------
def get_current_user_from_cookie(request: Request, db: Session):
    token = request.cookies.get(COOKIE_TOKEN_NAME)
    if not token:
        return None
    try:
        return auth.get_current_user(db, token)
    except Exception:
        return None

def require_user(request: Request, db: Session):
    user = get_current_user_from_cookie(request, db)
    if not user:
        raise HTTPException(status_code=303, detail="Redirect", headers={"Location": "/web/login"})
    return user

# ----------------------
# Páginas Web (Jinja2)
# ----------------------
@app.get("/web/login", response_class=HTMLResponse)
async def web_login(request: Request):
    from datetime import datetime as _dt
    return templates.TemplateResponse("login.html", {"request": request, "error": None, "year": _dt.utcnow().year})

@app.post("/web/login")
async def web_login_post(request: Request, email: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    user = auth.authenticate_user(db, email.lower().strip(), password)
    if not user:
        from datetime import datetime as _dt
        return templates.TemplateResponse(
            "login.html",
            {"request": request, "error": "Credenciais inválidas", "year": _dt.utcnow().year},
            status_code=401
        )
    token = auth.create_access_token({"sub": user.email, "tipo": user.tipo})
    resp = RedirectResponse(url="/web/dashboard", status_code=302)
    resp.set_cookie(COOKIE_TOKEN_NAME, token, httponly=True, samesite="lax")
    return resp

@app.get("/web/logout")
async def web_logout():
    resp = RedirectResponse(url="/web/login", status_code=302)
    resp.delete_cookie(COOKIE_TOKEN_NAME)
    return resp

if RUN_DIRECT:
    # Permite iniciar com: python app/main.py  (modo desenvolvimento simplificado)
    import uvicorn, os
    reload_flag = os.environ.get("ESTAGIOS_RELOAD", "1") == "1"
    kwargs = {"host": "127.0.0.1", "port": 8001}
    if reload_flag:
        # Força implementação 'stat' para contornar possíveis problemas no Python 3.13 + watchfiles
        os.environ.setdefault("UVICORN_RELOAD_IMPLEMENTATION", "stat")
        kwargs["reload"] = True
    print("[DEV] Iniciando via execução direta (main.py) -> http://127.0.0.1:8001  reload=", reload_flag)
    uvicorn.run("app.main:app", **kwargs)

@app.get("/web/dashboard", response_class=HTMLResponse)
async def web_dashboard(request: Request, db: Session = Depends(get_db)):
    user = get_current_user_from_cookie(request, db)
    if not user:
        return RedirectResponse("/web/login")
    return templates.TemplateResponse(
        "dashboard.html",
        {"request": request, "user": user, "year": datetime.utcnow().year}
    )

@app.get("/web/supervisores", response_class=HTMLResponse)
async def web_supervisores(request: Request, db: Session = Depends(get_db)):
    user = get_current_user_from_cookie(request, db)
    if not user:
        return RedirectResponse("/web/login")
    supervisores = crud.get_supervisores(db)
    return templates.TemplateResponse(
        "supervisores.html",
        {"request": request, "user": user, "supervisores": supervisores, "error": None, "year": datetime.utcnow().year}
    )

@app.post("/web/supervisores", response_class=HTMLResponse)
async def web_supervisores_create(request: Request, nome: str = Form(...), email: str = Form(...), telefone: str = Form(""), especialidade: str = Form(""), db: Session = Depends(get_db)):
    user = get_current_user_from_cookie(request, db)
    if not user:
        return RedirectResponse("/web/login")
    if user.tipo not in ["admin", "supervisor"]:
        supervisores = crud.get_supervisores(db)
        return templates.TemplateResponse("supervisores.html", {"request": request, "user": user, "supervisores": supervisores, "error": "Sem permissão"}, status_code=403)
    try:
        crud.create_supervisor(db, schemas.SupervisorCreate(nome=nome, email=email, telefone=telefone, especialidade=especialidade))
    except Exception as e:
        supervisores = crud.get_supervisores(db)
        return templates.TemplateResponse("supervisores.html", {"request": request, "user": user, "supervisores": supervisores, "error": str(e)}, status_code=400)
    return RedirectResponse("/web/supervisores", status_code=302)

@app.post("/web/supervisores/delete/{supervisor_id}")
async def web_delete_supervisor(request: Request, supervisor_id: int, db: Session = Depends(get_db)):
    user = get_current_user_from_cookie(request, db)
    if not user:
        return RedirectResponse("/web/login")
    if user.tipo not in ["admin", "supervisor"]:
        return RedirectResponse("/web/supervisores")
    crud.delete_supervisor(db, supervisor_id)
    return RedirectResponse("/web/supervisores", status_code=302)

@app.get("/web/estagios", response_class=HTMLResponse)
async def web_estagios(request: Request, db: Session = Depends(get_db)):
    user = get_current_user_from_cookie(request, db)
    if not user:
        return RedirectResponse("/web/login")
    estagios = crud.get_estagios(db, user_type=user.tipo, user_id=user.id)
    supervisores = crud.get_supervisores(db)
    instituicoes = crud.get_instituicoes(db)
    cursos = crud.get_cursos(db)
    unidades = crud.get_unidades(db)
    return templates.TemplateResponse("estagios.html", {"request": request, "user": user, "estagios": estagios, "supervisores": supervisores, "instituicoes": instituicoes, "cursos": cursos, "unidades": unidades, "error": None, "year": datetime.utcnow().year})

@app.post("/web/estagios", response_class=HTMLResponse)
async def web_estagios_create(request: Request,
                              nome: str = Form(...),
                              email: str = Form(...),
                              telefone: str = Form(""),
                              periodo: str = Form(""),
                              supervisor_id: Optional[int] = Form(None),
                              instituicao_id: Optional[int] = Form(None),
                              curso_id: Optional[int] = Form(None),
                              unidade_id: Optional[int] = Form(None),
                              disciplina: str = Form(""),
                              nivel: str = Form(""),
                              num_estagiarios: Optional[int] = Form(None),
                              observacoes: str = Form(""),
                              db: Session = Depends(get_db)):
    user = get_current_user_from_cookie(request, db)
    if not user:
        return RedirectResponse("/web/login")
    try:
        estagio_obj = schemas.EstagioCreate(
            nome=nome, email=email, telefone=telefone, periodo=periodo,
            supervisor_id=supervisor_id if supervisor_id else None,
            instituicao_id=instituicao_id if instituicao_id else None,
            curso_id=curso_id if curso_id else None,
            unidade_id=unidade_id if unidade_id else None,
            disciplina=disciplina, nivel=nivel,
            num_estagiarios=num_estagiarios if num_estagiarios else None,
            observacoes=observacoes
        )
        crud.create_estagio(db, estagio_obj)
        return RedirectResponse("/web/estagios", status_code=302)
    except Exception as e:
        estagios = crud.get_estagios(db, user_type=user.tipo, user_id=user.id)
        supervisores = crud.get_supervisores(db)
        instituicoes = crud.get_instituicoes(db)
        cursos = crud.get_cursos(db)
        unidades = crud.get_unidades(db)
    return templates.TemplateResponse("estagios.html", {"request": request, "user": user, "estagios": estagios, "supervisores": supervisores, "instituicoes": instituicoes, "cursos": cursos, "unidades": unidades, "error": str(e), "year": datetime.utcnow().year}, status_code=400)

@app.post("/web/estagios/delete/{estagio_id}")
async def web_delete_estagio(request: Request, estagio_id: int, db: Session = Depends(get_db)):
    user = get_current_user_from_cookie(request, db)
    if not user:
        return RedirectResponse("/web/login")
    crud.delete_estagio(db, estagio_id)
    return RedirectResponse("/web/estagios", status_code=302)

@app.post("/web/estagios/import")
async def web_import_estagios(request: Request, file: UploadFile = File(...), db: Session = Depends(get_db)):
    user = get_current_user_from_cookie(request, db)
    if not user:
        return RedirectResponse("/web/login")
    if not file.filename.endswith((".csv", ".xlsx")):
        return RedirectResponse("/web/estagios")
    # Reutiliza lógica simplificada (somente csv aqui; para xlsx poderia replicar)
    try:
        content = await file.read()
        imported = 0
        if file.filename.endswith('.csv'):
            import csv, io
            csvfile = io.StringIO(content.decode('utf-8'))
            reader = csv.DictReader(csvfile)
            for row in reader:
                if row.get('nome') and row.get('email'):
                    estagio_data = schemas.EstagioCreate(
                        nome=row['nome'],
                        email=row['email'],
                        telefone=row.get('telefone',''),
                        periodo=row.get('periodo',''),
                        supervisor_id=int(row['supervisor_id']) if row.get('supervisor_id') else None
                    )
                    crud.create_estagio(db, estagio_data)
                    imported += 1
        elif file.filename.endswith('.xlsx'):
            try:
                import openpyxl, io
                wb = openpyxl.load_workbook(io.BytesIO(content))
                sheet = wb.active
                headers = [cell.value for cell in sheet[1]]
                for row in sheet.iter_rows(min_row=2, values_only=True):
                    if row and row[0] and row[1]:
                        row_data = dict(zip(headers, row))
                        estagio_data = schemas.EstagioCreate(
                            nome=row_data.get('nome'),
                            email=row_data.get('email'),
                            telefone=row_data.get('telefone',''),
                            periodo=row_data.get('periodo',''),
                            supervisor_id=int(row_data['supervisor_id']) if row_data.get('supervisor_id') else None
                        )
                        crud.create_estagio(db, estagio_data)
                        imported += 1
            except ImportError:
                pass
    except Exception:
        pass
    return RedirectResponse("/web/estagios", status_code=302)

@app.get("/web/catalogos", response_class=HTMLResponse)
async def web_catalogos(request: Request, db: Session = Depends(get_db)):
    user = get_current_user_from_cookie(request, db)
    if not user:
        return RedirectResponse("/web/login")
    return templates.TemplateResponse("catalogos.html", {
        "request": request,
        "user": user,
        "instituicoes": crud.get_instituicoes(db),
        "cursos": crud.get_cursos(db),
        "unidades": crud.get_unidades(db),
        "error": None,
        "year": datetime.utcnow().year
    })

@app.post("/web/catalogos/instituicoes")
async def web_add_instituicao(request: Request, nome: str = Form(...), db: Session = Depends(get_db)):
    user = get_current_user_from_cookie(request, db)
    if not user:
        return RedirectResponse("/web/login")
    crud.create_instituicao(db, schemas.InstituicaoCreate(nome=nome))
    return RedirectResponse("/web/catalogos", status_code=302)

@app.post("/web/catalogos/instituicoes/delete/{instituicao_id}")
async def web_delete_instituicao(request: Request, instituicao_id: int, db: Session = Depends(get_db)):
    user = get_current_user_from_cookie(request, db)
    if not user:
        return RedirectResponse("/web/login")
    crud.delete_instituicao(db, instituicao_id)
    return RedirectResponse("/web/catalogos", status_code=302)

@app.post("/web/catalogos/cursos")
async def web_add_curso(request: Request, nome: str = Form(...), db: Session = Depends(get_db)):
    user = get_current_user_from_cookie(request, db)
    if not user:
        return RedirectResponse("/web/login")
    crud.create_curso(db, schemas.CursoCreate(nome=nome))
    return RedirectResponse("/web/catalogos", status_code=302)

@app.post("/web/catalogos/cursos/delete/{curso_id}")
async def web_delete_curso(request: Request, curso_id: int, db: Session = Depends(get_db)):
    user = get_current_user_from_cookie(request, db)
    if not user:
        return RedirectResponse("/web/login")
    crud.delete_curso(db, curso_id)
    return RedirectResponse("/web/catalogos", status_code=302)

@app.post("/web/catalogos/unidades")
async def web_add_unidade(request: Request, nome: str = Form(...), db: Session = Depends(get_db)):
    user = get_current_user_from_cookie(request, db)
    if not user:
        return RedirectResponse("/web/login")
    crud.create_unidade(db, schemas.UnidadeCreate(nome=nome))
    return RedirectResponse("/web/catalogos", status_code=302)

@app.post("/web/catalogos/unidades/delete/{unidade_id}")
async def web_delete_unidade(request: Request, unidade_id: int, db: Session = Depends(get_db)):
    user = get_current_user_from_cookie(request, db)
    if not user:
        return RedirectResponse("/web/login")
    crud.delete_unidade(db, unidade_id)
    return RedirectResponse("/web/catalogos", status_code=302)

@app.post("/auth/register", response_model=schemas.Usuario)
async def register_user(user: schemas.UsuarioCreate, credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    current_user = auth.get_current_user(db, credentials.credentials)
    if current_user.tipo != "admin":
        raise HTTPException(status_code=403, detail="Apenas administradores podem criar usuários")
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="E-mail já cadastrado")
    return crud.create_user(db=db, user=user)

## Rotas API modulares (prefixos separados)
api_prefix = "/api/v1"
app.include_router(auth_routes.router, prefix=api_prefix)
app.include_router(supervisores_routes.router, prefix=api_prefix)
app.include_router(estagios_routes.router, prefix=api_prefix)
app.include_router(catalogos_routes.router, prefix=api_prefix)
app.include_router(web_routes.router)



# Importação
@app.post("/importar")
async def importar_planilha(file: UploadFile = File(...), credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    current_user = auth.get_current_user(db, credentials.credentials)
    
    if not file.filename.endswith(('.csv', '.xlsx')):
        raise HTTPException(status_code=400, detail="Arquivo deve ser CSV ou XLSX")
    
    try:
        content = await file.read()
        
        # Importar CSV
        if file.filename.endswith('.csv'):
            import csv
            import io
            
            csvfile = io.StringIO(content.decode('utf-8'))
            reader = csv.DictReader(csvfile)
            
            imported = 0
            for row in reader:
                if all(k in row for k in ['nome', 'email']):
                    estagio_data = schemas.EstagioCreate(
                        nome=row['nome'],
                        email=row['email'],
                        telefone=row.get('telefone', ''),
                        periodo=row.get('periodo', ''),
                        supervisor_id=int(row['supervisor_id']) if row.get('supervisor_id') else None
                    )
                    crud.create_estagio(db=db, estagio=estagio_data)
                    imported += 1
        
        # Importar XLSX
        elif file.filename.endswith('.xlsx'):
            try:
                import openpyxl
                import io
                
                workbook = openpyxl.load_workbook(io.BytesIO(content))
                sheet = workbook.active
                
                headers = [cell.value for cell in sheet[1]]
                imported = 0
                
                for row in sheet.iter_rows(min_row=2, values_only=True):
                    if row[0] and row[1]:  # nome e email obrigatórios
                        row_data = dict(zip(headers, row))
                        estagio_data = schemas.EstagioCreate(
                            nome=row_data.get('nome'),
                            email=row_data.get('email'),
                            telefone=row_data.get('telefone', ''),
                            periodo=row_data.get('periodo', ''),
                            supervisor_id=int(row_data['supervisor_id']) if row_data.get('supervisor_id') else None
                        )
                        crud.create_estagio(db=db, estagio=estagio_data)
                        imported += 1
                        
            except ImportError:
                raise HTTPException(
                    status_code=500, 
                    detail="openpyxl não instalado. Execute: pip install openpyxl"
                )
        
        return {"message": f"{imported} registros importados com sucesso"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro na importação: {str(e)}")

# Relatórios
@app.get("/relatorios/anexo2/{estagio_id}")
async def gerar_anexo2(estagio_id: int, format: str = "html", credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    auth.get_current_user(db, credentials.credentials)
    
    estagio = crud.get_estagio_by_id(db, estagio_id)
    if not estagio:
        raise HTTPException(status_code=404, detail="Estágio não encontrado")
    
    try:
        from .utils_pdf import render_anexo2_html, render_anexo2
        
        if format.lower() == "pdf":
            try:
                pdf_content = render_anexo2(estagio)
                return Response(content=pdf_content, media_type="application/pdf")
            except ImportError:
                # Fallback para HTML se WeasyPrint não estiver disponível
                html_content = render_anexo2_html(estagio)
                return HTMLResponse(content=html_content)
        else:
            html_content = render_anexo2_html(estagio)
            return HTMLResponse(content=html_content)
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar relatório: {str(e)}")