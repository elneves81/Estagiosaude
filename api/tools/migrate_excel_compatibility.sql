-- Migração para adicionar campos compatíveis com Excel da Faculdade Guarapuava
-- Data: 2024-12-19
-- Descrição: Adiciona campos para compatibilidade com formato Excel utilizado

-- 1. Adicionar novos campos à tabela estagios
ALTER TABLE estagios ADD COLUMN dias_semana TEXT;
ALTER TABLE estagios ADD COLUMN quantidade_grupos INTEGER DEFAULT 1;

-- 2. Adicionar campo número do conselho à tabela supervisores  
ALTER TABLE supervisores ADD COLUMN numero_conselho TEXT;

-- 3. Comentários sobre os novos campos
-- dias_semana: Armazena os dias da semana do estágio (ex: "Segunda, Quarta, Sexta")
-- quantidade_grupos: Número de grupos/turmas para o estágio
-- numero_conselho: Registro profissional do supervisor (CRM, CRO, COREN, etc.)