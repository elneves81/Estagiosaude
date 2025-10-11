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
                ("quantidade_grupos", "INTEGER"),
                ("dias_semana", "TEXT"),
                ("observacoes", "TEXT"),
                ("instituicao_id", "INTEGER"),
                ("curso_id", "INTEGER"),
                ("unidade_id", "INTEGER")
            ]
            for col_name, col_type in new_columns:
                if col_name not in columns:
                    cursor.execute(f"ALTER TABLE estagios ADD COLUMN {col_name} {col_type}")
                    print(f"✅ Coluna {col_name} adicionada à tabela estagios")
            # Verificar coluna em supervisores
            cursor.execute("PRAGMA table_info(supervisores)")
            sup_cols = [column[1] for column in cursor.fetchall()]
            if "numero_conselho" not in sup_cols:
                cursor.execute("ALTER TABLE supervisores ADD COLUMN numero_conselho TEXT")
                print("✅ Coluna numero_conselho adicionada à tabela supervisores")
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

## Rotas Web estão em app.routers.web_routes

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
api_prefix = settings.API_V1_PREFIX
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