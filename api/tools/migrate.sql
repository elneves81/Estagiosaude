-- Migração para criação das tabelas base e expansão do sistema
-- Sistema de Gestão de Estágios

CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    nome TEXT NOT NULL,
    hashed_password TEXT NOT NULL,
    tipo TEXT NOT NULL DEFAULT 'escola',
    ativo BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS territorios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    descricao TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
    data_inicio DATE,
    data_fim DATE,
    horario_inicio TIME,
    horario_fim TIME,
    periodo TEXT,
    disciplina TEXT,
    nivel TEXT,
    carga_horaria INTEGER,
    num_estagiarios INTEGER,
    observacoes TEXT,
    supervisor_id INTEGER,
    instituicao_id INTEGER,
    curso_id INTEGER,
    unidade_id INTEGER,
    territorio_id INTEGER,
    status TEXT DEFAULT 'ativo',
    valor_total REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supervisor_id) REFERENCES supervisores (id),
    FOREIGN KEY (instituicao_id) REFERENCES instituicoes (id),
    FOREIGN KEY (curso_id) REFERENCES cursos (id),
    FOREIGN KEY (unidade_id) REFERENCES unidades (id),
    FOREIGN KEY (territorio_id) REFERENCES territorios (id)
);

-- Inserir dados iniciais se não existirem
-- Hash bcrypt de 'admin123' gerado em tools/gen_hash.py (recomendar alterar em produção)
INSERT OR IGNORE INTO usuarios (email, nome, hashed_password, tipo) 
VALUES ('admin@estagios.local', 'Administrador', '$2b$12$cHL4uCdHIgakNNhxO5DJWufqvtpAIaWLEBjf/oSrFXml83l2XE5Ku', 'admin');

-- Inserir territórios padrão
INSERT OR IGNORE INTO territorios (nome, descricao) VALUES 
('TERRITÓRIO 1', 'Região Norte da cidade'),
('TERRITÓRIO 2', 'Região Sul da cidade'),
('TERRITÓRIO 3', 'Região Leste da cidade'),
('TERRITÓRIO 4', 'Região Oeste da cidade'),
('TERRITÓRIO 5', 'Região Central da cidade');

-- Inserir algumas instituições padrão
INSERT OR IGNORE INTO instituicoes (nome) VALUES 
('Campo Real'),
('UNICENTRO'),
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
('Farmácia'),
('Odontologia'),
('Técnico em Enfermagem');

-- Inserir algumas unidades padrão
INSERT OR IGNORE INTO unidades (nome) VALUES 
('Emergência'),
('UTI'),
('Clínica Médica'),
('Pediatria'),
('Ginecologia'),
('Cirurgia'),
('Ambulatório'),
('Saúde Coletiva'),
('UBS Coibri'),
('UBS Santana'),
('UBS Vila Rica');

-- Inserir supervisores de exemplo
INSERT OR IGNORE INTO supervisores (nome, email, telefone, especialidade) VALUES 
('Maria Eduarda Lima de Paula', 'maria.eduarda@saude.local', '(42) 99999-0001', 'Enfermagem'),
('Dr. José Silva', 'jose.silva@saude.local', '(42) 99999-0002', 'Medicina'),
('Katia Pereira Borba', 'katia.borba@saude.local', '(42) 99999-0003', 'Fisioterapia'),
('Thayna Kelliny Gueiros', 'thayna.gueiros@saude.local', '(42) 99999-0004', 'Enfermagem'),
('Luciane Brasil Nascimento de Jesus', 'luciane.brasil@saude.local', '(42) 99999-0005', 'Psicologia');