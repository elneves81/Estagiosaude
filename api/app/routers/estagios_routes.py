from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import List
from .. import schemas, crud, auth
from ..db import SessionLocal

router = APIRouter(prefix="/estagios", tags=["estagios"])
security = HTTPBearer()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("", response_model=List[schemas.Estagio])
def list_estagios(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    current_user = auth.get_current_user(db, credentials.credentials)
    return crud.get_estagios(db, user_type=current_user.tipo, user_id=current_user.id)

@router.post("", response_model=schemas.Estagio)
def create_estagio(estagio: schemas.EstagioCreate, credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    current_user = auth.get_current_user(db, credentials.credentials)
    return crud.create_estagio(db=db, estagio=estagio)

@router.delete("/{estagio_id}")
def delete_estagio(estagio_id: int, credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    current_user = auth.get_current_user(db, credentials.credentials)
    success = crud.delete_estagio(db, estagio_id)
    if not success:
        raise HTTPException(status_code=404, detail="Estágio não encontrado")
    return {"message": "Estágio removido com sucesso"}
