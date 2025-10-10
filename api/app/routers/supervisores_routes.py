from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import List
from .. import schemas, crud, auth
from ..db import SessionLocal

router = APIRouter(prefix="/supervisores", tags=["supervisores"])
security = HTTPBearer()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("", response_model=List[schemas.Supervisor])
def list_supervisors(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    auth.get_current_user(db, credentials.credentials)
    return crud.get_supervisores(db)

@router.post("", response_model=schemas.Supervisor)
def create_supervisor(supervisor: schemas.SupervisorCreate, credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    current_user = auth.get_current_user(db, credentials.credentials)
    if current_user.tipo not in ["admin", "supervisor"]:
        raise HTTPException(status_code=403, detail="Sem permissão")
    return crud.create_supervisor(db=db, supervisor=supervisor)

@router.delete("/{supervisor_id}")
def delete_supervisor(supervisor_id: int, credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    current_user = auth.get_current_user(db, credentials.credentials)
    if current_user.tipo not in ["admin", "supervisor"]:
        raise HTTPException(status_code=403, detail="Sem permissão")
    success = crud.delete_supervisor(db, supervisor_id)
    if not success:
        raise HTTPException(status_code=404, detail="Supervisor não encontrado")
    return {"message": "Supervisor removido com sucesso"}
