from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import List
from .. import schemas, crud, auth, models
from ..db import SessionLocal

router = APIRouter(tags=["catalogos"])
security = HTTPBearer()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get('/instituicoes', response_model=List[schemas.Instituicao])
async def list_instituicoes(db: Session = Depends(get_db)):
    return crud.get_instituicoes(db)

@router.post('/instituicoes', response_model=schemas.Instituicao)
async def create_instituicao(instituicao: schemas.InstituicaoCreate, credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    auth.get_current_user(db, credentials.credentials)
    return crud.create_instituicao(db=db, instituicao=instituicao)

@router.delete('/instituicoes/{instituicao_id}')
async def delete_instituicao(instituicao_id: int, credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    auth.get_current_user(db, credentials.credentials)
    success = crud.delete_instituicao(db, instituicao_id)
    if not success:
        raise HTTPException(status_code=404, detail="Instituição não encontrada")
    return {"message": "Instituição removida"}

@router.get('/cursos', response_model=List[schemas.Curso])
async def list_cursos(db: Session = Depends(get_db)):
    return crud.get_cursos(db)

@router.post('/cursos', response_model=schemas.Curso)
async def create_curso(curso: schemas.CursoCreate, credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    auth.get_current_user(db, credentials.credentials)
    return crud.create_curso(db=db, curso=curso)

@router.delete('/cursos/{curso_id}')
async def delete_curso(curso_id: int, credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    auth.get_current_user(db, credentials.credentials)
    success = crud.delete_curso(db, curso_id)
    if not success:
        raise HTTPException(status_code=404, detail="Curso não encontrado")
    return {"message": "Curso removido"}

@router.get('/unidades', response_model=List[schemas.Unidade])
async def list_unidades(db: Session = Depends(get_db)):
    return crud.get_unidades(db)

@router.post('/unidades', response_model=schemas.Unidade)
async def create_unidade(unidade: schemas.UnidadeCreate, credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    auth.get_current_user(db, credentials.credentials)
    return crud.create_unidade(db=db, unidade=unidade)

@router.delete('/unidades/{unidade_id}')
async def delete_unidade(unidade_id: int, credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    auth.get_current_user(db, credentials.credentials)
    success = crud.delete_unidade(db, unidade_id)
    if not success:
        raise HTTPException(status_code=404, detail="Unidade não encontrada")
    return {"message": "Unidade removida"}

@router.get('/territorios', response_model=List[schemas.Territorio])
async def list_territorios(db: Session = Depends(get_db)):
    return db.query(models.Territorio).all()

@router.post('/territorios', response_model=schemas.Territorio)
async def create_territorio(territorio: schemas.TerritorioCreate, credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    auth.get_current_user(db, credentials.credentials)
    db_territorio = models.Territorio(**territorio.dict())
    db.add(db_territorio)
    db.commit()
    db.refresh(db_territorio)
    return db_territorio

@router.delete('/territorios/{territorio_id}')
async def delete_territorio(territorio_id: int, credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    auth.get_current_user(db, credentials.credentials)
    territorio = db.query(models.Territorio).filter(models.Territorio.id == territorio_id).first()
    if not territorio:
        raise HTTPException(status_code=404, detail="Território não encontrado")
    db.delete(territorio)
    db.commit()
    return {"message": "Território removido"}
