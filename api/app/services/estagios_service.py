from sqlalchemy.orm import Session
from typing import Optional
from .. import schemas, crud, models

class EstagiosService:
    """Camada de orquestração para regras de negócio relacionadas a Estágios."""

    @staticmethod
    def criar_estagio(db: Session, dados: schemas.EstagioCreate) -> models.Estagio:
        # Regras futuras: validar limites, supervisor ativo, etc.
        return crud.create_estagio(db, dados)

    @staticmethod
    def listar_estagios(db: Session, user_type: str, user_id: int):
        return crud.get_estagios(db, user_type=user_type, user_id=user_id)

    @staticmethod
    def remover_estagio(db: Session, estagio_id: int) -> bool:
        return crud.delete_estagio(db, estagio_id)
