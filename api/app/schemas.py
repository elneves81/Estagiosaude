from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# Schemas de base
class UsuarioBase(BaseModel):
    email: str
    nome: str
    tipo: str = "escola"

class UsuarioCreate(UsuarioBase):
    password: str

class UsuarioLogin(BaseModel):
    email: str
    password: str

class Usuario(UsuarioBase):
    id: int
    ativo: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user_type: str

# Schemas de Instituição
class InstituicaoBase(BaseModel):
    nome: str

class InstituicaoCreate(InstituicaoBase):
    pass

class Instituicao(InstituicaoBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Schemas de Curso
class CursoBase(BaseModel):
    nome: str

class CursoCreate(CursoBase):
    pass

class Curso(CursoBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Schemas de Unidade
class UnidadeBase(BaseModel):
    nome: str

class UnidadeCreate(UnidadeBase):
    pass

class Unidade(UnidadeBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Schemas de Supervisor
class SupervisorBase(BaseModel):
    nome: str
    email: str
    telefone: Optional[str] = None
    especialidade: Optional[str] = None

class SupervisorCreate(SupervisorBase):
    pass

class Supervisor(SupervisorBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Schemas de Estágio
class EstagioBase(BaseModel):
    nome: str
    email: str
    telefone: Optional[str] = None
    periodo: Optional[str] = None
    supervisor_id: Optional[int] = None
    instituicao_id: Optional[int] = None
    curso_id: Optional[int] = None
    unidade_id: Optional[int] = None
    disciplina: Optional[str] = None
    nivel: Optional[str] = None
    num_estagiarios: Optional[int] = None
    observacoes: Optional[str] = None

class EstagioCreate(EstagioBase):
    pass

class Estagio(EstagioBase):
    id: int
    created_at: datetime
    supervisor: Optional[Supervisor] = None
    instituicao: Optional[Instituicao] = None
    curso: Optional[Curso] = None
    unidade: Optional[Unidade] = None

    class Config:
        from_attributes = True