# Scripts de Importação e Templates - Anexo II

## Visão Geral

Scripts criados para importar dados do PDF anexado e gerar templates para criação de planos similares em outras unidades.

## Scripts Disponíveis

### 1. `importar_pdf_anexo2.py`
Importa dados estruturados extraídos do PDF anexado para o sistema.

**Dados inclusos:**
- 10 atividades de Estágio Supervisionado I em Técnico em Enfermagem
- Setores: CAPS I, Pronto Socorro, UTI, Clínica Médica, Clínica Cirúrgica, Centro Cirúrgico, Pediatria, Maternidade, UBS, PSF
- Período: fevereiro a abril de 2025
- Carga horária: 40h por atividade (400h total)

**Uso:**
```bash
# Criar estágio automaticamente e importar dados
python importar_pdf_anexo2.py --criar-estagio "Plano Modelo Técnico Enfermagem" --label "Dados PDF" --comment "Plano base extraído"

# Importar para estágio existente
python importar_pdf_anexo2.py --estagio-id 4 --label "Atualização" --comment "Dados atualizados"

# Listar estágios disponíveis
python importar_pdf_anexo2.py --listar-estagios
```

### 2. `gerar_templates_anexo2.py`
Gera templates CSV e JSON baseados em planos existentes para facilitar criação de novos planos.

**Funcionalidades:**
- Template CSV editável para importação via interface
- Template JSON para automação/scripts
- Geração automática de datas sequenciais
- Personalização por instituição/curso

**Uso:**
```bash
# Gerar templates baseados em plano existente
python gerar_templates_anexo2.py --estagio-base 4 --instituicao "Nova Instituição" --curso "Novo Curso"

# Gerar com datas automáticas (uma semana por atividade)
python gerar_templates_anexo2.py --estagio-base 4 --data-inicio "01/03/2025"

# Gerar apenas CSV ou JSON específico
python gerar_templates_anexo2.py --estagio-base 4 --output-csv modelo.csv
python gerar_templates_anexo2.py --estagio-base 4 --output-json modelo.json

# Listar planos disponíveis como base
python gerar_templates_anexo2.py --listar-planos
```

### 3. `gerar_token.py`
Utilitário para gerar tokens de autenticação para os scripts.

**Uso:**
```bash
# Usar credenciais padrão
python gerar_token.py

# Especificar credenciais
python gerar_token.py usuario@email.com senha123 http://localhost:8000
```

### 4. `gerar_templates_por_unidade.py`

Gera automaticamente um par de templates (CSV e JSON) para CADA unidade cadastrada no sistema a partir de um plano base (estágio que já possua Anexo II). Útil para replicar rapidamente o mesmo conjunto de atividades em todas as unidades, mantendo apenas a mudança do campo `unidade_setor` e datas opcionais sequenciais.

**Principais características:**

- Faz requisição ao endpoint `/unidades` e obtém todas as unidades
- Clona as atividades do plano base substituindo `unidade_setor` por cada nome de unidade
- Datas podem ficar como placeholders `[DD/MM/AAAA]` ou serem preenchidas automaticamente semana a semana a partir de `--data-inicio`
- Gera arquivos nomeados com slug da unidade: `template_<unidade>.json` e `template_<unidade>.csv`
- Campos de supervisor ficam como placeholders (`[SUPERVISOR]`, `[CONSELHO]`) para posterior ajuste

**Uso básico:**

```bash
python gerar_templates_por_unidade.py --estagio-base 4 --token SEU_TOKEN
```

**Com geração de datas sequenciais (cada atividade = 1 semana):**

```bash
python gerar_templates_por_unidade.py --estagio-base 4 --token SEU_TOKEN --data-inicio 01/09/2025
```

**Alterar diretório de saída e prefixo dos arquivos:**

```bash
python gerar_templates_por_unidade.py --estagio-base 4 \
   --token SEU_TOKEN \
   --out-dir ./templates_unidades \
   --prefixo plano
```

**Se possuir arquivo `.token` (mesmo diretório do script) não precisa passar `--token`:**

```bash
python gerar_templates_por_unidade.py --estagio-base 4
```

Saída esperada:
 
```text
✅ Plano base carregado: 10 atividades
✅ 5 unidade(s) encontrada(s)
    • Gerado template para unidade: Unidade A
    • Gerado template para unidade: Unidade B
    ...
🎉 Templates gerados em: C:\caminho\absoluto\templates_unidades
```

Depois de gerados, abra o CSV da unidade desejada, ajuste datas / supervisores / cargas específicas e importe via interface web ou por script de importação.

## Fluxo de Trabalho Recomendado

### Para criar plano similar ao PDF anexado

1. **Importar dados base (uma vez):**
   
   ```bash
   python importar_pdf_anexo2.py --criar-estagio "Plano Base Enfermagem"
   ```

2. **Gerar template para nova unidade:**
   
   ```bash
   python gerar_templates_anexo2.py --estagio-base [ID] --instituicao "Hospital XYZ" --data-inicio "01/06/2025"
   ```

3. **Personalizar template gerado:**
   - Editar CSV/JSON conforme necessidade específica
   - Ajustar setores, supervisores, datas, etc.

4. **Importar via interface web ou script:**
   - Usar importador interativo no sistema web
   - Ou criar novo script baseado no template JSON

### Para diferentes cursos/modalidades

1. **Adaptar dados base:**
   
   ```bash
   python gerar_templates_anexo2.py --estagio-base [ID] --curso "Técnico em Radiologia"
   ```

2. **Personalizar atividades:**
   - Alterar descrições para especialidade específica
   - Ajustar setores (ex: Radiologia, Tomografia, etc.)
   - Modificar cargas horárias conforme regulamentação

## Estrutura dos Dados

### Cabeçalho do Plano

- `instituicao_ensino`: Nome da instituição de ensino
- `curso`: Nome do curso técnico/superior
- `exercicio`: Ano letivo (ex: "2025")
- `status`: "rascunho" ou "final"

### Atividades

- `disciplina`: Estágio Supervisionado I/II, etc.
- `descricao`: Descrição específica da atividade
- `nivel`: Técnico, Graduação, etc.
- `unidade_setor`: Local específico do estágio
- `data_inicio/data_fim`: Período da atividade (DD/MM/AAAA)
- `horario`: Horário no formato "HH:MM às HH:MM"
- `dias_semana`: Dias úteis (ex: "Seg, Ter, Qua, Qui, Sex")
- `quantidade_grupos`: Número de grupos simultâneos
- `num_estagiarios_por_grupo`: Estagiários por grupo
- `carga_horaria_individual`: Carga horária por estagiário
- `supervisor_nome`: Nome do supervisor responsável
- `supervisor_conselho`: Registro profissional (COREN, CRM, etc.)
- `valor`: Valor/carga horária total

## Customizações Possíveis

### Adaptação por área

- **Enfermagem**: UTI, Emergência, Clínica, Cirúrgica, Pediatria
- **Radiologia**: TC, RM, Raio-X, Mamografia, Ultrassom
- **Laboratório**: Hematologia, Bioquímica, Microbiologia, Parasitologia
- **Farmácia**: Farmácia Hospitalar, Drogaria, Manipulação

### Adaptação por nível

- **Técnico**: 400-600h conforme regulamentação
- **Graduação**: 800-1200h distribuídas em módulos
- **Pós-graduação**: Conforme especialização

### Adaptação por modalidade

- **Presencial**: Cronograma fixo semanal
- **Modular**: Blocos intensivos
- **Flexível**: Distribuição personalizada

## Observações Importantes

1. **Validações**: Scripts incluem validações básicas para horários e datas
2. **Versionamento**: Cada importação pode gerar versão com rótulo/comentário
3. **Backup**: Dados são preservados no histórico de versões
4. **Flexibilidade**: Templates podem ser editados manualmente antes da importação
5. **Integração**: Scripts usam mesmas APIs do sistema web

## Exemplo Prático Completo

```bash
# 1. Gerar token de acesso
python gerar_token.py admin@sistema.com senha123

# 2. Importar plano base do PDF
python importar_pdf_anexo2.py --criar-estagio "Modelo Base Enfermagem"

# 3. Gerar template para Hospital ABC
python gerar_templates_anexo2.py --estagio-base 4 \
  --instituicao "Hospital ABC" \
  --curso "Técnico em Enfermagem" \
  --data-inicio "01/08/2025" \
  --output-csv hospital_abc_modelo.csv

# 4. Editar hospital_abc_modelo.csv conforme necessidade

# 5. Importar via interface web ou novo script personalizado
```

Esta estrutura permite replicar facilmente o plano do PDF anexado para múltiplas unidades, cursos e modalidades, mantendo a consistência e facilitando a gestão dos estágios.
