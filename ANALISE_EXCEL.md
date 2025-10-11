# Análise do Arquivo Excel da Faculdade Guarapuava

## 📋 Resumo da Análise

O arquivo `FACULDADE GUARAPUAVA (2).xlsx` contém um modelo de **Plano de Atividades de Integração Ensino-Serviço-Comunidade** para diferentes cursos da área da saúde.

### 🎓 Cursos Identificados (6 planilhas)
1. **Psicologia**
2. **Odontologia** 
3. **Enfermagem**
4. **Farmácia**
5. **Informática Biomédica**
6. **Medicina Veterinária**

## 📊 Estrutura dos Dados

### Campos Identificados (linha 6 de cada planilha):
1. **Disciplina** 
2. **Descrição de atividades** (descrever no mínimo cinco)
3. **Nível**
4. **Unidade/setor**
5. **Data** (dia/mês/ano) - dividido em Início/Fim
6. **Horário**
7. **Dias da semana**
8. **Quantidade de grupos**
9. **Nº de Estagiários por grupo**
10. **Carga Horária Individual**
11. **Supervisor**
12. **Nº Conselho** (número do conselho profissional)
13. **Valor** (com fórmula de cálculo automático)

### 🔍 Tipo de Documento
- **Modelo/Template**: O arquivo contém apenas a estrutura e cabeçalhos
- **Sem dados reais**: Não há registros de estágios preenchidos
- **Fórmulas**: Campo "Valor" possui fórmula Excel para cálculo automático baseado no nível

## 🎯 Impacto no Sistema Atual

### ✅ Campos já suportados pelo sistema:
- **Disciplina** → `disciplina` (campo existente)
- **Descrição de atividades** → `observacoes` (campo existente)
- **Nível** → `nivel` (campo existente)
- **Unidade/setor** → `unidade_id` (relacionamento existente)
- **Data** → `data_inicio/data_fim` (campos existentes)
- **Horário** → `horario_inicio/horario_fim` (campos existentes)
- **Nº de Estagiários por grupo** → `num_estagiarios` (campo existente)
- **Carga Horária Individual** → `carga_horaria` (campo existente)
- **Supervisor** → `supervisor_id` (relacionamento existente)
- **Valor** → `valor_total` (campo existente)

### 🔸 Novos campos necessários:
1. **Dias da semana** - para especificar quais dias da semana ocorre o estágio
2. **Quantidade de grupos** - número de grupos/turmas do estágio  
3. **Nº Conselho** - número do registro no conselho profissional do supervisor

## 🛠️ Modificações Recomendadas

### 1. Adicionar novos campos ao modelo `Estagio`:
```sql
ALTER TABLE estagios ADD COLUMN dias_semana TEXT;
ALTER TABLE estagios ADD COLUMN quantidade_grupos INTEGER;
```

### 2. Adicionar campo ao modelo `Supervisor`:
```sql
ALTER TABLE supervisores ADD COLUMN numero_conselho TEXT;
```

### 3. Atualizar interface web:
- Adicionar campos de "Dias da semana" no formulário de estágios
- Adicionar campo "Quantidade de grupos" 
- Adicionar campo "Número do conselho" no formulário de supervisores

## 💡 Oportunidades de Integração

### 1. Import em lote de dados
- Criar funcionalidade para importar dados do Excel quando preenchido
- Mapear automaticamente cursos para as planilhas existentes
- Validar dados antes da importação

### 2. Export para modelo Excel
- Gerar arquivo Excel no mesmo formato para preenchimento externo
- Permitir download do template para cada curso
- Facilitar intercâmbio com instituições de ensino

### 3. Cálculo automático de valores
- Implementar lógica de cálculo similar à fórmula Excel:
  - G (Graduação): grupos × estagiários × carga_horária × 2
  - I (Integrada): grupos × estagiários × carga_horária × 2  
  - PG (Pós-graduação): grupos × estagiários × carga_horária × 2
  - M (Mestrado): grupos × estagiários × carga_horária × 1

## 🚀 Próximos Passos

1. **Implementar migração do banco** para adicionar novos campos
2. **Atualizar modelos** SQLAlchemy com novos campos
3. **Atualizar formulários** web para incluir novos campos
4. **Criar funcionalidade de import** de dados do Excel
5. **Criar funcionalidade de export** para template Excel
6. **Implementar cálculo automático** de valores

## 📈 Benefícios Esperados

- **Compatibilidade** com formato já utilizado pela Faculdade
- **Facilita migração** de dados existentes
- **Padronização** do processo de planejamento de estágios
- **Automatização** de cálculos de valores
- **Intercâmbio** facilitado entre sistema e planilhas Excel