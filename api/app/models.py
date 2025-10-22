from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Date, Time, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    nome = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    tipo = Column(String, default="escola")  # admin, supervisor, escola
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