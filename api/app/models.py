from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

DATABASE_URL = "sqlite:///./estagios.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

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
    periodo = Column(String)
    supervisor_id = Column(Integer, ForeignKey("supervisores.id"))
    instituicao_id = Column(Integer, ForeignKey("instituicoes.id"))
    curso_id = Column(Integer, ForeignKey("cursos.id"))
    unidade_id = Column(Integer, ForeignKey("unidades.id"))
    disciplina = Column(Text)
    nivel = Column(String)
    num_estagiarios = Column(Integer)
    observacoes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    supervisor = relationship("Supervisor", back_populates="estagios")
    instituicao = relationship("Instituicao", back_populates="estagios")
    curso = relationship("Curso", back_populates="estagios")
    unidade = relationship("Unidade", back_populates="estagios")