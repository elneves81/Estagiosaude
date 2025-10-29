from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from . import models, schemas
from passlib.context import CryptContext
import hashlib

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Helper: compute ETag
def compute_etag(data: list) -> str:
    s = ''.join(str(x) for x in data)
    return hashlib.md5(s.encode()).hexdigest()

# Usuários
def get_user_by_email(db: Session, email: str):
    return db.query(models.Usuario).filter(models.Usuario.email == email).first()

def get_users(db: Session):
    return db.query(models.Usuario).all()

def create_user(db: Session, user: schemas.UsuarioCreate):
    hashed_password = pwd_context.hash(user.password)
    db_user = models.Usuario(
        email=user.email,
        nome=user.nome,
        hashed_password=hashed_password,
        tipo=user.tipo,
        instituicao_id=user.instituicao_id if hasattr(user, 'instituicao_id') else None
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user(db: Session, user_id: int, payload: schemas.UsuarioUpdate):
    user = db.query(models.Usuario).filter(models.Usuario.id == user_id).first()
    if not user:
        return None
    if payload.nome is not None:
        user.nome = payload.nome
    if payload.email is not None:
        user.email = payload.email
    if payload.password is not None:
        user.hashed_password = pwd_context.hash(payload.password)
    if payload.tipo is not None:
        user.tipo = payload.tipo
    if payload.instituicao_id is not None:
        user.instituicao_id = payload.instituicao_id
    db.commit()
    db.refresh(user)
    return user

def delete_user(db: Session, user_id: int):
    user = db.query(models.Usuario).filter(models.Usuario.id == user_id).first()
    if not user:
        return False, "Usuário não encontrado"
    db.delete(user)
    db.commit()
    return True, None

def set_user_active(db: Session, user_id: int, ativo: bool):
    user = db.query(models.Usuario).filter(models.Usuario.id == user_id).first()
    if not user:
        return None, "Usuário não encontrado"
    user.ativo = ativo
    db.commit()
    db.refresh(user)
    return user, None

# Supervisores
def get_supervisores(db: Session):
    return db.query(models.Supervisor).all()

def search_supervisores(db: Session, q: str = None, limit: int = 20, offset: int = 0, sort_field: str = None, sort_dir: str = 'asc'):
    query = db.query(models.Supervisor)
    if q:
        like = f"%{q}%"
        query = query.filter(
            or_(
                models.Supervisor.nome.ilike(like),
                models.Supervisor.email.ilike(like),
                models.Supervisor.especialidade.ilike(like)
            )
        )
    total = query.count()
    
    # Ordenação
    if sort_field:
        col = getattr(models.Supervisor, sort_field, None)
        if col:
            query = query.order_by(col.desc() if sort_dir == 'desc' else col.asc())
    
    items = query.offset(offset).limit(limit).all()
    return items, total

def get_supervisores_paginated(db: Session, q: str = None, limit: int = 20, offset: int = 0):
    query = db.query(models.Supervisor)
    if q:
        like = f"%{q}%"
        query = query.filter(
            or_(
                models.Supervisor.nome.ilike(like),
                models.Supervisor.email.ilike(like)
            )
        )
    total = query.count()
    items = query.offset(offset).limit(limit).all()
    return items, total

def create_supervisor(db: Session, supervisor: schemas.SupervisorCreate):
    db_supervisor = models.Supervisor(**supervisor.dict())
    db.add(db_supervisor)
    db.commit()
    db.refresh(db_supervisor)
    return db_supervisor

def update_supervisor(db: Session, supervisor_id: int, payload: schemas.SupervisorUpdate):
    sup = db.query(models.Supervisor).filter(models.Supervisor.id == supervisor_id).first()
    if not sup:
        return None
    for k, v in payload.dict(exclude_unset=True).items():
        setattr(sup, k, v)
    db.commit()
    db.refresh(sup)
    return sup

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

def search_estagios(db: Session, user_type: str = None, user_id: int = None, q: str = None, 
                   curso_id: int = None, instituicao_id: int = None, unidade_id: int = None,
                   supervisor_id: int = None, limit: int = 20, offset: int = 0,
                   sort_field: str = None, sort_dir: str = 'desc'):
    query = db.query(models.Estagio)
    
    # RBAC
    if user_type == "supervisor":
        supervisor = db.query(models.Supervisor).filter(models.Supervisor.usuario_id == user_id).first()
        if supervisor:
            query = query.filter(models.Estagio.supervisor_id == supervisor.id)
    
    # Filtros
    if q:
        like = f"%{q}%"
        query = query.filter(
            or_(
                models.Estagio.nome.ilike(like),
                models.Estagio.email.ilike(like),
                models.Estagio.disciplina.ilike(like)
            )
        )
    if curso_id:
        query = query.filter(models.Estagio.curso_id == curso_id)
    if instituicao_id:
        query = query.filter(models.Estagio.instituicao_id == instituicao_id)
    if unidade_id:
        query = query.filter(models.Estagio.unidade_id == unidade_id)
    if supervisor_id:
        query = query.filter(models.Estagio.supervisor_id == supervisor_id)
    
    total = query.count()
    
    # Ordenação
    if sort_field:
        col = getattr(models.Estagio, sort_field, None)
        if col:
            query = query.order_by(col.desc() if sort_dir == 'desc' else col.asc())
    
    items = query.offset(offset).limit(limit).all()
    return items, total

def get_estagios_paginated(db: Session, user_type: str = None, user_id: int = None, q: str = None,
                          instituicao_id: int = None, curso_id: int = None, unidade_id: int = None,
                          supervisor_id: int = None, limit: int = 20, offset: int = 0):
    query = db.query(models.Estagio)
    
    if user_type == "supervisor":
        supervisor = db.query(models.Supervisor).filter(models.Supervisor.usuario_id == user_id).first()
        if supervisor:
            query = query.filter(models.Estagio.supervisor_id == supervisor.id)
    
    if q:
        like = f"%{q}%"
        query = query.filter(or_(models.Estagio.nome.ilike(like), models.Estagio.email.ilike(like)))
    if instituicao_id:
        query = query.filter(models.Estagio.instituicao_id == instituicao_id)
    if curso_id:
        query = query.filter(models.Estagio.curso_id == curso_id)
    if unidade_id:
        query = query.filter(models.Estagio.unidade_id == unidade_id)
    if supervisor_id:
        query = query.filter(models.Estagio.supervisor_id == supervisor_id)
    
    total = query.count()
    items = query.offset(offset).limit(limit).all()
    return items, total

def get_estagio_by_id(db: Session, estagio_id: int):
    return db.query(models.Estagio).filter(models.Estagio.id == estagio_id).first()

def create_estagio(db: Session, estagio: schemas.EstagioCreate):
    db_estagio = models.Estagio(**estagio.dict())
    db.add(db_estagio)
    db.commit()
    db.refresh(db_estagio)
    return db_estagio

def update_estagio(db: Session, estagio_id: int, estagio: schemas.EstagioCreate):
    item = db.query(models.Estagio).filter(models.Estagio.id == estagio_id).first()
    if not item:
        return None
    for k, v in estagio.dict().items():
        setattr(item, k, v)
    db.commit()
    db.refresh(item)
    return item

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

def search_instituicoes(db: Session, q: str = None, limit: int = 20, offset: int = 0):
    query = db.query(models.Instituicao)
    if q:
        like = f"%{q}%"
        query = query.filter(models.Instituicao.nome.ilike(like))
    total = query.count()
    items = query.offset(offset).limit(limit).all()
    return items, total

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

def search_cursos(db: Session, q: str = None, limit: int = 20, offset: int = 0):
    query = db.query(models.Curso)
    if q:
        like = f"%{q}%"
        query = query.filter(models.Curso.nome.ilike(like))
    total = query.count()
    items = query.offset(offset).limit(limit).all()
    return items, total

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

def search_unidades(db: Session, q: str = None, limit: int = 20, offset: int = 0):
    query = db.query(models.Unidade)
    if q:
        like = f"%{q}%"
        query = query.filter(models.Unidade.nome.ilike(like))
    total = query.count()
    items = query.offset(offset).limit(limit).all()
    return items, total

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

# Planos Anexo2
def search_planos_anexo2(db: Session, curso: str = None, exercicio: str = None, instituicao: str = None, skip: int = 0, limit: int = 10):
    """Busca planos de Anexo II com filtros opcionais.

    Retorna dict no formato {"items": [...], "total": N} como esperado pelo endpoint.
    """
    query = db.query(models.Anexo2)
    if curso:
        query = query.filter(models.Anexo2.curso.ilike(f"%{curso}%"))
    if exercicio:
        query = query.filter(models.Anexo2.exercicio.ilike(f"%{exercicio}%"))
    if instituicao:
        query = query.filter(models.Anexo2.instituicao_ensino.ilike(f"%{instituicao}%"))

    total = query.count()
    items = query.order_by(models.Anexo2.id.desc()).offset(skip).limit(limit).all()
    return {"items": items, "total": total}

def list_planos_for_supervisor(db: Session, supervisor_id: int, curso: str = None, exercicio: str = None, instituicao: str = None, skip: int = 0, limit: int = 10):
    """Lista planos vinculados a estágios de um supervisor específico."""
    q = (
        db.query(models.Anexo2)
        .join(models.Estagio, models.Anexo2.estagio_id == models.Estagio.id)
        .filter(models.Estagio.supervisor_id == supervisor_id)
    )
    if curso:
        q = q.filter(models.Anexo2.curso.ilike(f"%{curso}%"))
    if exercicio:
        q = q.filter(models.Anexo2.exercicio.ilike(f"%{exercicio}%"))
    if instituicao:
        # pode filtrar por nome textual do campo do anexo ou pelo vínculo do estágio com instituição
        q = q.filter(
            or_(
                models.Anexo2.instituicao_ensino.ilike(f"%{instituicao}%"),
            )
        )
    total = q.count()
    items = q.order_by(models.Anexo2.id.desc()).offset(skip).limit(limit).all()
    return {"items": items, "total": total}

def list_planos_for_instituicao(db: Session, instituicao_id: int, curso: str = None, exercicio: str = None, instituicao: str = None, skip: int = 0, limit: int = 10):
    """Lista planos para estágios de uma instituição específica (RBAC usuário 'escola')."""
    q = (
        db.query(models.Anexo2)
        .join(models.Estagio, models.Anexo2.estagio_id == models.Estagio.id)
        .filter(models.Estagio.instituicao_id == instituicao_id)
    )
    if curso:
        q = q.filter(models.Anexo2.curso.ilike(f"%{curso}%"))
    if exercicio:
        q = q.filter(models.Anexo2.exercicio.ilike(f"%{exercicio}%"))
    if instituicao:
        q = q.filter(models.Anexo2.instituicao_ensino.ilike(f"%{instituicao}%"))
    total = q.count()
    items = q.order_by(models.Anexo2.id.desc()).offset(skip).limit(limit).all()
    return {"items": items, "total": total}