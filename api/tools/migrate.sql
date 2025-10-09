-- Migração para criação das tabelas base e expansão do sistema
-- Sistema de Gestão de Estágios
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    nome TEXT NOT NULL,
    hashed_password TEXT NOT NULL,
    tipo TEXT NOT NULL DEFAULT 'escola', -- admin, supervisor, escola
    ativo BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS instituicoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cursos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS unidades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS supervisores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    telefone TEXT,
    especialidade TEXT,
    usuario_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
);

CREATE TABLE IF NOT EXISTS estagios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    telefone TEXT,
    periodo TEXT,
    supervisor_id INTEGER,
    instituicao_id INTEGER,
    curso_id INTEGER,
    unidade_id INTEGER,
    disciplina TEXT,
    nivel TEXT,
    num_estagiarios INTEGER,
    observacoes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supervisor_id) REFERENCES supervisores (id),
    FOREIGN KEY (instituicao_id) REFERENCES instituicoes (id),
    FOREIGN KEY (curso_id) REFERENCES cursos (id),
    FOREIGN KEY (unidade_id) REFERENCES unidades (id)
);

-- Inserir dados iniciais se não existirem
INSERT OR IGNORE INTO usuarios (email, nome, hashed_password, tipo) 
VALUES ('admin@estagios.local', 'Administrador', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'admin');

-- Inserir algumas instituições padrão
INSERT OR IGNORE INTO instituicoes (nome) VALUES 
('Hospital Geral'),
('UBS Centro'),
('Clínica São Paulo'),
('Hospital Universitário'),
('CAPS');

-- Inserir alguns cursos padrão  
INSERT OR IGNORE INTO cursos (nome) VALUES 
('Enfermagem'),
('Medicina'),
('Fisioterapia'),
('Psicologia'),
('Nutrição'),
('Farmácia');

-- Inserir algumas unidades padrão
INSERT OR IGNORE INTO unidades (nome) VALUES 
('Emergência'),
('UTI'),
('Clínica Médica'),
('Pediatria'),
('Ginecologia'),
('Cirurgia'),
('Ambulatório');