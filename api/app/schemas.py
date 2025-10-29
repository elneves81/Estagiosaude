from pydantic import BaseModel, Field, field_validator
try:
    # Pydantic v2
    from pydantic import AliasChoices  # type: ignore
except Exception:  # pragma: no cover
    AliasChoices = None  # fallback for type hints
from typing import Optional, List
from datetime import datetime

# Helpers
def _to_upper(v):
    if v is None:
        return v
    if isinstance(v, str):
        return v.upper().strip()
    return v

# Schemas de base
class UsuarioBase(BaseModel):
    email: str
    nome: str
    tipo: str = "escola"
    instituicao_id: int | None = None

class UsuarioCreate(UsuarioBase):
    password: str

class UsuarioUpdate(BaseModel):
    nome: str | None = None
    email: str | None = None
    password: str | None = None
    tipo: str | None = None
    instituicao_id: int | None = None

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
    cnes: Optional[str] = None
    razao_social: Optional[str] = None

    # Uppercase normalization (display/storage standardization)
    @field_validator('nome', 'razao_social', mode='before')
    def _upper_instituicao(cls, v):
        return _to_upper(v)

class InstituicaoCreate(InstituicaoBase):
    pass

class Instituicao(InstituicaoBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class InstituicaoCurso(BaseModel):
    id: int
    instituicao_id: int
    curso_id: int
    nivel: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True

class InstituicaoCursoCreate(BaseModel):
    instituicao_id: int
    curso_id: int
    nivel: str | None = None

# Schemas de Curso
class CursoBase(BaseModel):
    nome: str

    @field_validator('nome', mode='before')
    def _upper_curso(cls, v):
        return _to_upper(v)

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
    cnes: Optional[str] = None
    razao_social: Optional[str] = None

    @field_validator('nome', 'razao_social', mode='before')
    def _upper_unidade(cls, v):
        return _to_upper(v)

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
    numero_conselho: Optional[str] = None

    @field_validator('nome', 'especialidade', 'numero_conselho', mode='before')
    def _upper_supervisor(cls, v):
        return _to_upper(v)

class SupervisorCreate(SupervisorBase):
    pass

class Supervisor(SupervisorBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class SupervisorUpdate(BaseModel):
    nome: Optional[str] = None
    email: Optional[str] = None
    telefone: Optional[str] = None
    especialidade: Optional[str] = None
    numero_conselho: Optional[str] = None

    @field_validator('nome', 'especialidade', 'numero_conselho', mode='before')
    def _upper_supervisor_update(cls, v):
        return _to_upper(v)

# Schemas de Estágio
class EstagioBase(BaseModel):
    # Accept both 'nome' and legacy 'nome_estagiario' as input (pydantic v2)
    nome: str = Field(..., validation_alias=AliasChoices('nome', 'nome_estagiario') if AliasChoices else 'nome_estagiario')
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
    carga_horaria: Optional[int] = None
    observacoes: Optional[str] = None
    salario: Optional[str] = None

    @field_validator('nome', 'periodo', 'disciplina', 'nivel', 'observacoes', mode='before')
    def _upper_estagio(cls, v):
        return _to_upper(v)


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

# ------------------------------
# Anexo II (Plano de Atividades)
# ------------------------------
class Anexo2AtividadeBase(BaseModel):
    disciplina: Optional[str] = None
    descricao: Optional[str] = None
    nivel: Optional[str] = None
    unidade_setor: Optional[str] = None
    data_inicio: Optional[str] = None
    data_fim: Optional[str] = None
    horario: Optional[str] = None
    dias_semana: Optional[str] = None
    quantidade_grupos: Optional[int] = None
    num_estagiarios_por_grupo: Optional[int] = None
    carga_horaria_individual: Optional[str] = None
    supervisor_nome: Optional[str] = None
    supervisor_conselho: Optional[str] = None
    valor: Optional[str] = None
    territorio: Optional[str] = None
    instituicao_ensino: Optional[str] = None
    curso: Optional[str] = None

    @field_validator('quantidade_grupos', 'num_estagiarios_por_grupo', mode='before')
    def _empty_str_to_none_int(cls, v):
        """Converte string vazia para None antes de validar como int"""
        if v == '' or v is None:
            return None
        return v

    @field_validator('disciplina', 'descricao', 'nivel', 'unidade_setor', 'horario', 'dias_semana', 'carga_horaria_individual', 'supervisor_nome', 'supervisor_conselho', 'valor', 'territorio', 'instituicao_ensino', 'curso', mode='before')
    def _upper_anexo2_atividade(cls, v):
        return _to_upper(v)

class Anexo2AtividadeCreate(Anexo2AtividadeBase):
    pass

class Anexo2Atividade(Anexo2AtividadeBase):
    id: int

    class Config:
        from_attributes = True

class Anexo2Base(BaseModel):
    estagio_id: int
    instituicao_ensino: Optional[str] = None
    curso: Optional[str] = None
    exercicio: Optional[str] = None
    status: Optional[str] = "final"  # rascunho|final
    versao: Optional[int] = 1
    logo_url: Optional[str] = None
    atividades: Optional[List[Anexo2AtividadeCreate]] = []

    @field_validator('instituicao_ensino', 'curso', mode='before')
    def _upper_anexo2(cls, v):
        return _to_upper(v)

class Anexo2Create(Anexo2Base):
    pass

class Anexo2(Anexo2Base):
    id: int
    created_at: datetime

    # Ao ler, devolvemos atividades já materializadas
    atividades: List[Anexo2Atividade] = []

    class Config:
        from_attributes = True

class VagaTemplateBase(BaseModel):
    nome: str
    descricao: Optional[str] = None
    template_data: str  # JSON string

class VagaTemplateCreate(VagaTemplateBase):
    pass

class VagaTemplate(VagaTemplateBase):
    id: int
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class Anexo2Version(BaseModel):
    id: int
    estagio_id: int
    versao: int
    payload: str
    label: str | None = None
    comment: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True