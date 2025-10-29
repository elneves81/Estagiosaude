from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Date, Time, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import os

Base = declarative_base()

# Caminho do banco de dados
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'estagios.db')
DATABASE_URL = f"sqlite:///{DB_PATH}"

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    nome = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    tipo = Column(String, default="escola")  # admin, supervisor, escola
    instituicao_id = Column(Integer, ForeignKey("instituicoes.id"))
    ativo = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

    supervisores = relationship("Supervisor", back_populates="usuario")

class Territorio(Base):
    __tablename__ = "territorios"
    
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    descricao = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    estagios = relationship("Estagio", back_populates="territorio")

class Instituicao(Base):
    __tablename__ = "instituicoes"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    cnes = Column(String)
    razao_social = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    estagios = relationship("Estagio", back_populates="instituicao")

class Curso(Base):
    __tablename__ = "cursos"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    estagios = relationship("Estagio", back_populates="curso")

class Unidade(Base):
    __tablename__ = "unidades"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    cnes = Column(String)
    razao_social = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    estagios = relationship("Estagio", back_populates="unidade")

class Supervisor(Base):
    __tablename__ = "supervisores"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    telefone = Column(String)
    especialidade = Column(String)
    numero_conselho = Column(String)  # Número do conselho profissional (CRM, CRO, COREN, etc.)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    usuario = relationship("Usuario", back_populates="supervisores")
    estagios = relationship("Estagio", back_populates="supervisor")

class Estagio(Base):
    __tablename__ = "estagios"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    email = Column(String, nullable=False)
    telefone = Column(String)
    
    # Datas e horários
    data_inicio = Column(Date)
    data_fim = Column(Date)
    horario_inicio = Column(Time)
    horario_fim = Column(Time)
    
    # Informações acadêmicas
    periodo = Column(String)
    disciplina = Column(Text)
    nivel = Column(String)
    carga_horaria = Column(Integer)
    
    # Quantidades e observações
    num_estagiarios = Column(Integer)
    quantidade_grupos = Column(Integer, default=1)  # Número de grupos/turmas
    dias_semana = Column(Text)  # Dias da semana do estágio (ex: "Segunda, Quarta, Sexta")
    observacoes = Column(Text)
    salario = Column(String)  # Salário do estágio
    
    # Relacionamentos
    supervisor_id = Column(Integer, ForeignKey("supervisores.id"))
    instituicao_id = Column(Integer, ForeignKey("instituicoes.id"))
    curso_id = Column(Integer, ForeignKey("cursos.id"))
    unidade_id = Column(Integer, ForeignKey("unidades.id"))
    territorio_id = Column(Integer, ForeignKey("territorios.id"))
    
    # Status e controle
    status = Column(String, default="ativo")  # ativo, concluido, cancelado
    valor_total = Column(Float)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

    # Relacionamentos
    supervisor = relationship("Supervisor", back_populates="estagios")
    instituicao = relationship("Instituicao", back_populates="estagios")
    curso = relationship("Curso", back_populates="estagios")
    unidade = relationship("Unidade", back_populates="estagios")
    territorio = relationship("Territorio", back_populates="estagios")
    anexos2 = relationship("Anexo2", back_populates="estagio")

class Anexo2(Base):
    __tablename__ = "anexo2"
    
    id = Column(Integer, primary_key=True, index=True)
    estagio_id = Column(Integer, ForeignKey("estagios.id"), nullable=False)
    instituicao_ensino = Column(String)
    curso = Column(String)
    exercicio = Column(String)
    status = Column(String, default="final")
    versao = Column(Integer, default=1)
    logo_url = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
    
    estagio = relationship("Estagio", back_populates="anexos2")
    atividades = relationship("Anexo2Atividade", back_populates="anexo2", cascade="all, delete-orphan")

class Anexo2Atividade(Base):
    __tablename__ = "anexo2_atividades"
    
    id = Column(Integer, primary_key=True, index=True)
    anexo2_id = Column(Integer, ForeignKey("anexo2.id"), nullable=False)
    disciplina = Column(String)
    descricao = Column(Text)
    nivel = Column(String)
    unidade_setor = Column(String)
    data_inicio = Column(String)
    data_fim = Column(String)
    horario = Column(String)
    dias_semana = Column(String)
    quantidade_grupos = Column(Integer)
    num_estagiarios_por_grupo = Column(Integer)
    carga_horaria_individual = Column(String)
    supervisor_nome = Column(String)
    supervisor_conselho = Column(String)
    valor = Column(String)
    territorio = Column(String)
    instituicao_ensino = Column(String)
    curso = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    anexo2 = relationship("Anexo2", back_populates="atividades")

class Anexo2Version(Base):
    __tablename__ = "anexo2_versions"
    
    id = Column(Integer, primary_key=True, index=True)
    estagio_id = Column(Integer, nullable=False)
    versao = Column(Integer, nullable=False)
    payload = Column(Text, nullable=False)
    label = Column(String)
    comment = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class VagaTemplate(Base):
    __tablename__ = "vaga_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False, unique=True)
    descricao = Column(Text)
    template_data = Column(Text, nullable=False)
    created_by = Column(Integer, ForeignKey("usuarios.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

class InstituicaoCurso(Base):
    __tablename__ = "instituicao_cursos"
    
    id = Column(Integer, primary_key=True, index=True)
    instituicao_id = Column(Integer, ForeignKey("instituicoes.id"), nullable=False)
    curso_id = Column(Integer, ForeignKey("cursos.id"), nullable=False)
    nivel = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)