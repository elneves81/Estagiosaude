from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import HTMLResponse, Response
from sqlalchemy.orm import Session
from typing import List, Optional
import sqlite3
import os

from . import crud, models, schemas, auth, db
from .db import SessionLocal, engine

# Criar tabelas
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Sistema de Estágios", version="1.0.0")

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

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
        print(f"⚠️ Erro na verificação do banco: {e}")

# Rotas principais
@app.get("/")
async def root():
    return {"name": "Sistema de Estágios", "status": "online"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "API funcionando"}

# Autenticação
@app.post("/auth/login", response_model=schemas.Token)
async def login(user_credentials: schemas.UsuarioLogin, db: Session = Depends(get_db)):
    user = auth.authenticate_user(db, user_credentials.email.lower().strip(), user_credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(data={"sub": user.email, "tipo": user.tipo})
    return {"access_token": access_token, "token_type": "bearer", "user_type": user.tipo}

@app.get("/auth/me", response_model=schemas.Usuario)
async def get_current_user_info(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    user = auth.get_current_user(db, credentials.credentials)
    return user

@app.post("/auth/register", response_model=schemas.Usuario)
async def register_user(user: schemas.UsuarioCreate, credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    current_user = auth.get_current_user(db, credentials.credentials)
    if current_user.tipo != "admin":
        raise HTTPException(status_code=403, detail="Apenas administradores podem criar usuários")
    
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="E-mail já cadastrado")
    return crud.create_user(db=db, user=user)

# Supervisores
@app.get("/supervisores", response_model=List[schemas.Supervisor])
async def list_supervisors(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    auth.get_current_user(db, credentials.credentials)
    return crud.get_supervisores(db)

@app.post("/supervisores", response_model=schemas.Supervisor)
async def create_supervisor(supervisor: schemas.SupervisorCreate, credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    current_user = auth.get_current_user(db, credentials.credentials)
    if current_user.tipo not in ["admin", "supervisor"]:
        raise HTTPException(status_code=403, detail="Sem permissão")
    return crud.create_supervisor(db=db, supervisor=supervisor)

@app.delete("/supervisores/{supervisor_id}")
async def delete_supervisor(supervisor_id: int, credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    current_user = auth.get_current_user(db, credentials.credentials)
    if current_user.tipo not in ["admin", "supervisor"]:
        raise HTTPException(status_code=403, detail="Sem permissão")
    
    success = crud.delete_supervisor(db, supervisor_id)
    if not success:
        raise HTTPException(status_code=404, detail="Supervisor não encontrado")
    return {"message": "Supervisor removido com sucesso"}

# Estágios
@app.get("/estagios", response_model=List[schemas.Estagio])
async def list_estagios(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    current_user = auth.get_current_user(db, credentials.credentials)
    return crud.get_estagios(db, user_type=current_user.tipo, user_id=current_user.id)

@app.post("/estagios", response_model=schemas.Estagio)
async def create_estagio(estagio: schemas.EstagioCreate, credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    current_user = auth.get_current_user(db, credentials.credentials)
    return crud.create_estagio(db=db, estagio=estagio)

@app.delete("/estagios/{estagio_id}")
async def delete_estagio(estagio_id: int, credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    current_user = auth.get_current_user(db, credentials.credentials)
    success = crud.delete_estagio(db, estagio_id)
    if not success:
        raise HTTPException(status_code=404, detail="Estágio não encontrado")
    return {"message": "Estágio removido com sucesso"}

# Catálogos
@app.get("/instituicoes", response_model=List[schemas.Instituicao])
async def list_instituicoes(db: Session = Depends(get_db)):
    return crud.get_instituicoes(db)

@app.post("/instituicoes", response_model=schemas.Instituicao)
async def create_instituicao(instituicao: schemas.InstituicaoCreate, credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    auth.get_current_user(db, credentials.credentials)
    return crud.create_instituicao(db=db, instituicao=instituicao)

@app.delete("/instituicoes/{instituicao_id}")
async def delete_instituicao(instituicao_id: int, credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    auth.get_current_user(db, credentials.credentials)
    success = crud.delete_instituicao(db, instituicao_id)
    if not success:
        raise HTTPException(status_code=404, detail="Instituição não encontrada")
    return {"message": "Instituição removida"}

@app.get("/cursos", response_model=List[schemas.Curso])
async def list_cursos(db: Session = Depends(get_db)):
    return crud.get_cursos(db)

@app.post("/cursos", response_model=schemas.Curso)
async def create_curso(curso: schemas.CursoCreate, credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    auth.get_current_user(db, credentials.credentials)
    return crud.create_curso(db=db, curso=curso)

@app.delete("/cursos/{curso_id}")
async def delete_curso(curso_id: int, credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    auth.get_current_user(db, credentials.credentials)
    success = crud.delete_curso(db, curso_id)
    if not success:
        raise HTTPException(status_code=404, detail="Curso não encontrado")
    return {"message": "Curso removido"}

@app.get("/unidades", response_model=List[schemas.Unidade])
async def list_unidades(db: Session = Depends(get_db)):
    return crud.get_unidades(db)

@app.post("/unidades", response_model=schemas.Unidade)
async def create_unidade(unidade: schemas.UnidadeCreate, credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    auth.get_current_user(db, credentials.credentials)
    return crud.create_unidade(db=db, unidade=unidade)

@app.delete("/unidades/{unidade_id}")
async def delete_unidade(unidade_id: int, credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    auth.get_current_user(db, credentials.credentials)
    success = crud.delete_unidade(db, unidade_id)
    if not success:
        raise HTTPException(status_code=404, detail="Unidade não encontrada")
    return {"message": "Unidade removida"}

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