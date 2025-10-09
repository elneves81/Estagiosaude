from sqlalchemy.orm import Session
from . import models, schemas
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Usuários
def get_user_by_email(db: Session, email: str):
    return db.query(models.Usuario).filter(models.Usuario.email == email).first()

def create_user(db: Session, user: schemas.UsuarioCreate):
    hashed_password = pwd_context.hash(user.password)
    db_user = models.Usuario(
        email=user.email,
        nome=user.nome,
        hashed_password=hashed_password,
        tipo=user.tipo
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# Supervisores
def get_supervisores(db: Session):
    return db.query(models.Supervisor).all()

def create_supervisor(db: Session, supervisor: schemas.SupervisorCreate):
    db_supervisor = models.Supervisor(**supervisor.dict())
    db.add(db_supervisor)
    db.commit()
    db.refresh(db_supervisor)
    return db_supervisor

def delete_supervisor(db: Session, supervisor_id: int):
    supervisor = db.query(models.Supervisor).filter(models.Supervisor.id == supervisor_id).first()
    if supervisor:
        db.delete(supervisor)
        db.commit()
        return True
    return False

# Estágios
def get_estagios(db: Session, user_type: str = None, user_id: int = None):
    query = db.query(models.Estagio)
    
    # Filtros baseados no tipo de usuário
    if user_type == "supervisor":
        # Supervisores veem apenas seus estágios
        supervisor = db.query(models.Supervisor).filter(models.Supervisor.usuario_id == user_id).first()
        if supervisor:
            query = query.filter(models.Estagio.supervisor_id == supervisor.id)
    # Admins e escolas veem todos
    
    return query.all()

def get_estagio_by_id(db: Session, estagio_id: int):
    return db.query(models.Estagio).filter(models.Estagio.id == estagio_id).first()

def create_estagio(db: Session, estagio: schemas.EstagioCreate):
    db_estagio = models.Estagio(**estagio.dict())
    db.add(db_estagio)
    db.commit()
    db.refresh(db_estagio)
    return db_estagio

def delete_estagio(db: Session, estagio_id: int):
    estagio = db.query(models.Estagio).filter(models.Estagio.id == estagio_id).first()
    if estagio:
        db.delete(estagio)
        db.commit()
        return True
    return False

# Instituições
def get_instituicoes(db: Session):
    return db.query(models.Instituicao).all()

def create_instituicao(db: Session, instituicao: schemas.InstituicaoCreate):
    db_instituicao = models.Instituicao(**instituicao.dict())
    db.add(db_instituicao)
    db.commit()
    db.refresh(db_instituicao)
    return db_instituicao

def delete_instituicao(db: Session, instituicao_id: int):
    instituicao = db.query(models.Instituicao).filter(models.Instituicao.id == instituicao_id).first()
    if instituicao:
        db.delete(instituicao)
        db.commit()
        return True
    return False

# Cursos
def get_cursos(db: Session):
    return db.query(models.Curso).all()

def create_curso(db: Session, curso: schemas.CursoCreate):
    db_curso = models.Curso(**curso.dict())
    db.add(db_curso)
    db.commit()
    db.refresh(db_curso)
    return db_curso

def delete_curso(db: Session, curso_id: int):
    curso = db.query(models.Curso).filter(models.Curso.id == curso_id).first()
    if curso:
        db.delete(curso)
        db.commit()
        return True
    return False

# Unidades
def get_unidades(db: Session):
    return db.query(models.Unidade).all()

def create_unidade(db: Session, unidade: schemas.UnidadeCreate):
    db_unidade = models.Unidade(**unidade.dict())
    db.add(db_unidade)
    db.commit()
    db.refresh(db_unidade)
    return db_unidade

def delete_unidade(db: Session, unidade_id: int):
    unidade = db.query(models.Unidade).filter(models.Unidade.id == unidade_id).first()
    if unidade:
        db.delete(unidade)
        db.commit()
        return True
    return False