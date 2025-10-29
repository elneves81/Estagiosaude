# EstágioSel - Sistema de Gestão de Estágios em Saúde

Plataforma completa para gerenciamento de estágios na área da saúde, desenvolvida para facilitar o controle de supervisores, instituições de ensino, cursos, unidades de saúde, estudantes, relatórios e importação automatizada de planilhas.

## 🚀 Tecnologias Utilizadas

### Backend
- **FastAPI** - Framework web moderno e de alta performance
- **SQLAlchemy** - ORM para manipulação do banco de dados
- **SQLite** - Banco de dados relacional
- **Pydantic** - Validação de dados
- **JWT** - Autenticação via tokens (Bearer + Cookie HTTPOnly)
- **WeasyPrint** - Geração de relatórios PDF
- **openpyxl** - Importação/exportação de arquivos Excel
- **Uvicorn** - Servidor ASGI

### Frontend
- **React 18** - Biblioteca JavaScript para interfaces
- **Vite** - Build tool e dev server
- **React Router** - Navegação SPA
- **Axios** - Cliente HTTP
- **CSS3** - Estilização responsiva

### Templates
- **Jinja2** - Engine de templates para renderização server-side
- **HTML5/CSS3** - Interface web moderna e responsiva

## 📁 Estrutura do Projeto

```plaintext
estagiosel/
├── api/                          # Backend FastAPI
│   ├── app/
│   │   ├── main.py              # Aplicação principal
│   │   ├── auth.py              # Sistema de autenticação
│   │   ├── crud.py              # Operações de banco de dados
│   │   ├── models.py            # Modelos SQLAlchemy
│   │   ├── schemas.py           # Schemas Pydantic
│   │   ├── db.py                # Configuração do banco
│   │   ├── integration.py       # Integrações externas
│   │   ├── core/
│   │   │   └── config.py        # Configurações
│   │   ├── routers/
│   │   │   ├── auth_routes.py
│   │   │   ├── supervisores_routes.py
│   │   │   ├── estagios_routes.py
│   │   │   ├── catalogos_routes.py
│   │   │   ├── usuarios_routes.py
│   │   │   ├── dashboard_routes.py
│   │   │   └── relatorios_routes.py
│   │   ├── services/            # Lógica de negócio
│   │   ├── templates/           # Templates Jinja2
│   │   └── static/              # Arquivos estáticos
│   ├── tools/                   # Scripts utilitários
│   │   ├── apply_migration.py
│   │   ├── check_*.py           # Scripts de verificação
│   │   └── list_*.py            # Scripts de listagem
│   ├── tests/                   # Testes automatizados
│   ├── requirements.txt         # Dependências Python
│   ├── setup_admin.py          # Script de setup inicial
│   └── create_test_data.py     # Dados de teste
├── web/                         # Frontend React
│   ├── src/
│   │   ├── App.jsx             # Componente principal
│   │   ├── Layout.jsx          # Layout base
│   │   ├── pages/              # Páginas da aplicação
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Estagios.jsx
│   │   │   ├── Supervisores.jsx
│   │   │   ├── Unidades.jsx
│   │   │   ├── Vagas.jsx
│   │   │   ├── Catalogos.jsx
│   │   │   ├── Importacao.jsx
│   │   │   ├── Relatorios.jsx
│   │   │   └── Usuarios.jsx
│   │   ├── components/         # Componentes reutilizáveis
│   │   ├── constants/          # Constantes da aplicação
│   │   └── styles/             # Estilos CSS
│   ├── public/                 # Arquivos públicos
│   ├── package.json
│   └── vite.config.js
├── inbox/                       # Diretório de importação
│   ├── processed/              # Arquivos processados
│   └── failed/                 # Arquivos com erro
├── service/                     # Scripts de serviço Windows
├── iniciar_sistema_completo.ps1
├── iniciar_sistema_completo.bat
└── README.md
```

## 🚀 Inicialização Rápida

### Opção 1: Script Completo (Recomendado)
```powershell
# Windows PowerShell (Recomendado)
.\iniciar_sistema_completo.ps1
```

ou

```cmd
# Prompt de Comando
iniciar_sistema_completo.bat
```

**O que o script faz automaticamente:**
1. ✅ Cria ambiente virtual Python (se não existir)
2. ✅ Instala todas as dependências
3. ✅ Aplica migrações do banco de dados
4. ✅ Cria usuários de teste
5. ✅ Inicia o servidor com auto-reload

### Opção 2: Instalação Manual

```bash
# 1. Navegar até a pasta da API
cd api

# 2. Criar ambiente virtual
python -m venv venv

# 3. Ativar ambiente virtual
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# 4. Instalar dependências
pip install -r requirements.txt

# 5. Aplicar migrações
python tools\apply_migration.py

# 6. Configurar usuário admin
python setup_admin.py

# 7. Criar dados de teste (opcional)
python create_test_data.py

# 8. Iniciar servidor
uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```

## 🔐 Credenciais de Acesso

Após a inicialização, use estas credenciais para login:

| Perfil | Email | Senha |
|--------|-------|-------|
| 🔑 **Admin** | admin@estagios.local | Adm@2025! |
| 👩‍⚕️ **Supervisor** | supervisor@teste.com | supervisor123 |
| 🏫 **Escola** | escola@teste.com | escola123 |

## 🌐 URLs de Acesso

Após iniciar o sistema:

- **Frontend (React):** http://127.0.0.1:8001/app/
- **API Docs (Swagger):** http://127.0.0.1:8001/docs
- **Redoc:** http://127.0.0.1:8001/redoc
- **Métricas (Prometheus):** http://127.0.0.1:8001/metrics

## 📋 Scripts Disponíveis

### Scripts de Inicialização

| Script | Descrição |
|--------|-----------|
| `iniciar_sistema_completo.ps1/.bat` | Inicia sistema completo (recomendado) |
| `iniciar_backend.bat` | Apenas API backend |
| `iniciar_frontend.bat` | Apenas frontend React |
| `start_all.bat` | Backend + Frontend otimizado |
| `menu.bat` | Menu interativo de opções |

### Scripts de Desenvolvimento

| Script | Comando | Descrição |
|--------|---------|-----------|
| Start normal | `start_backend.bat` | Backend com auto-reload |
| Start estatístico | `start_backend.bat stat` | Reload usando 'stat' |
| Sem reload | `start_backend.bat noreload` | Mais estável para debug |
| Reset DB | `start_backend.bat reset` | Recria banco + inicia |
| Reset + stat | `start_backend.bat reset stat` | Recria banco + reload stat |

### Scripts de Manutenção

Localizados em `api/tools/`:

| Script | Função |
|--------|--------|
| `apply_migration.py` | Aplica migrações do banco |
| `check_cnes_duplicados.py` | Verifica CNEs duplicados |
| `check_cursos_duplicados.py` | Verifica cursos duplicados |
| `check_instituicoes_duplicadas.py` | Verifica instituições duplicadas |
| `count_unidades.py` | Conta unidades cadastradas |
| `list_instituicoes_all.py` | Lista todas instituições |
| `reset_vagas.py` | Reseta vagas disponíveis |

## 🔌 API REST - Endpoints Principais

### Autenticação
- `POST /auth/login` - Login de usuário
- `POST /auth/register` - Registro de novo usuário
- `GET /auth/me` - Dados do usuário atual
- `POST /auth/logout` - Logout

### Supervisores
- `GET /supervisores` - Lista supervisores
- `POST /supervisores` - Cria supervisor
- `GET /supervisores/{id}` - Busca supervisor
- `PUT /supervisores/{id}` - Atualiza supervisor
- `DELETE /supervisores/{id}` - Remove supervisor
- `GET /supervisores/search` - Busca com filtros

### Estágios
- `GET /estagios` - Lista estágios
- `POST /estagios` - Cria estágio
- `GET /estagios/{id}` - Busca estágio
- `PUT /estagios/{id}` - Atualiza estágio
- `DELETE /estagios/{id}` - Remove estágio
- `GET /estagios/search` - Busca com filtros
- `GET /estagios/{id}/html` - Relatório HTML
- `GET /estagios/{id}/pdf` - Relatório PDF

### Catálogos
- `GET /instituicoes` - Instituições de ensino
- `GET /cursos` - Cursos disponíveis
- `GET /unidades` - Unidades de saúde
- `GET /vagas` - Vagas disponíveis
- `POST /importar` - Importação de planilhas

### Dashboard & Relatórios
- `GET /dashboard/metrics` - Métricas do sistema
- `GET /relatorios/anexo2/{id}` - Relatório Anexo II
- `GET /planos/search` - Busca planos de atividades

## ✨ Funcionalidades Principais

### Gestão de Usuários
- ✅ Sistema de autenticação multi-perfil (Admin, Supervisor, Escola)
- ✅ Controle de acesso baseado em roles
- ✅ Gerenciamento completo de usuários
- ✅ Tokens JWT com refresh automático

### Supervisores
- ✅ Cadastro completo de supervisores
- ✅ Vinculação com unidades de saúde
- ✅ Histórico de estágios supervisionados
- ✅ Busca e filtros avançados

### Estágios
- ✅ Gestão completa do ciclo de estágios
- ✅ Vinculação estudante-supervisor-unidade
- ✅ Controle de períodos e horários
- ✅ Acompanhamento de status
- ✅ Geração de relatórios individuais

### Catálogos
- ✅ Instituições de ensino
- ✅ Cursos e especializações
- ✅ Unidades de saúde com integração CNES
- ✅ Controle de vagas disponíveis

### Importação de Dados
- ✅ Importação de planilhas Excel (XLSX)
- ✅ Importação de arquivos CSV
- ✅ Validação automática de dados
- ✅ Processamento em lote
- ✅ Relatórios de erros e sucessos
- ✅ Suporte para Anexo II

### Relatórios
- ✅ Geração de relatórios em HTML
- ✅ Exportação para PDF (WeasyPrint)
- ✅ Relatório Anexo II personalizado
- ✅ Dashboards com métricas em tempo real
- ✅ Relatórios interativos
- ✅ Visualização de planos de atividades

### Interface
- ✅ Design responsivo (mobile-first)
- ✅ Navegação lateral intuitiva
- ✅ Feedback visual de ações
- ✅ Formulários validados
- ✅ Modais e componentes reutilizáveis

## 📊 Dashboard e Métricas

O sistema oferece um dashboard completo com:

- 📈 Total de estágios ativos
- 👥 Supervisores cadastrados
- 🏥 Unidades de saúde vinculadas
- 🎓 Instituições parceiras
- 📝 Planos de atividades em andamento
- 🔔 Alertas e notificações

## 📥 Importação de Planilhas

### Formatos Suportados

- **Excel (.xlsx)** - Formato completo com múltiplas abas
- **CSV (.csv)** - Formato simplificado

### Campos Obrigatórios

```csv
nome,email,curso,periodo
João Silva,joao@email.com,Enfermagem,5
Maria Santos,maria@email.com,Medicina,8
```

### Campos Opcionais

- `telefone` - Telefone de contato
- `instituicao` - Nome da instituição de ensino
- `supervisor_id` - ID do supervisor vinculado
- `unidade_id` - ID da unidade de saúde
- `data_inicio` - Data de início do estágio
- `data_fim` - Data de término do estágio

### Scripts de Importação Especial

Veja documentação completa em: `api/SCRIPTS_IMPORTACAO.md`

**Scripts disponíveis:**
- `importador_inteligente.py` - Importação com detecção automática
- `importar_anexo2_from_excel.py` - Importação específica Anexo II
- `gerar_templates_anexo2.py` - Geração de templates vazios
- `gerar_templates_por_unidade.py` - Templates por unidade
- `analisar_excel.py` - Análise de estrutura

## 🔧 Configuração Avançada

### Variáveis de Ambiente

Crie um arquivo `.env` na pasta `api/`:

```env
# Banco de Dados
DATABASE_URL=sqlite:///./estagios.db

# Segurança
SECRET_KEY=sua-chave-secreta-aqui
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Servidor
HOST=127.0.0.1
PORT=8001
RELOAD=true

# Email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASSWORD=sua-senha

# Integração CNES (opcional)
CNES_API_URL=https://cnes.datasus.gov.br/api
```

### Execução como Serviço Windows

Scripts disponíveis em `service/`:

```powershell
# Instalar serviço
.\service\install_service.ps1

# Iniciar serviço
.\service\start_service.ps1

# Parar serviço
.\service\stop_service.ps1

# Desinstalar serviço
.\service\uninstall_service.ps1
```

## 🧪 Testes

### Executar Testes

```bash
# Ativar ambiente virtual
cd api
venv\Scripts\activate

# Instalar dependências de teste
pip install pytest pytest-cov httpx

# Executar todos os testes
pytest

# Com cobertura
pytest --cov=app --cov-report=html

# Teste específico
pytest tests/test_auth.py
```

### Estrutura de Testes

```
api/tests/
├── conftest.py           # Configuração de fixtures
├── test_auth.py          # Testes de autenticação
├── test_estagios.py      # Testes de estágios
├── test_supervisores.py  # Testes de supervisores
└── test_importacao.py    # Testes de importação
```

## 🚀 Deploy em Produção

### Requisitos

- Python 3.9+
- PostgreSQL ou MySQL (recomendado para produção)
- Nginx (como proxy reverso)
- Supervisor ou systemd (para gerenciar processo)

### Configuração Básica

1. **Atualizar dependências:**

```bash
pip install -r requirements.txt
pip install psycopg2-binary  # Para PostgreSQL
```

2. **Configurar banco de dados:**

```env
DATABASE_URL=postgresql://user:password@localhost/estagiosel
```

3. **Executar migrações:**

```bash
python tools/apply_migration.py
```

4. **Configurar Nginx:**

```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

5. **Iniciar com Gunicorn:**

```bash
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8001
```

## 🛡️ Segurança

### Recomendações para Produção

- ✅ Alterar `SECRET_KEY` para valor único e seguro
- ✅ Usar HTTPS (SSL/TLS) em produção
- ✅ Configurar cookies com flags `Secure` e `HttpOnly`
- ✅ Implementar rate limiting
- ✅ Habilitar CORS apenas para domínios confiáveis
- ✅ Usar banco de dados com senha forte
- ✅ Realizar backups regulares
- ✅ Manter logs de auditoria
- ✅ Atualizar dependências regularmente

### CORS

Configurar em `api/app/core/config.py`:

```python
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:8001",
    "https://seu-dominio.com"
]
```

## 📝 Roadmap / Próximos Passos

### Em Desenvolvimento
- [ ] Versionamento da API (`/api/v1`)
- [ ] Camada de serviços (`services/`) completa
- [ ] Testes automatizados (cobertura 80%+)
- [ ] Logging estruturado (JSON)
- [ ] Integração com serviços externos
- [ ] Notificações por email/SMS
- [ ] Exportação de relatórios Excel
- [ ] Gráficos e dashboards avançados

### Planejado
- [ ] Autenticação via LDAP/Active Directory
- [ ] Sistema de mensagens internas
- [ ] Calendário de estágios
- [ ] App mobile (React Native)
- [ ] Integração com sistemas acadêmicos (TOTVS, etc)
- [ ] API GraphQL
- [ ] WebSockets para atualizações em tempo real
- [ ] Sistema de avaliação de supervisores

## 🤝 Contribuindo

### Como Contribuir

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

### Padrões de Código

- **Python:** Seguir PEP 8
- **JavaScript:** Usar ESLint com Airbnb style guide
- **Git Commits:** Usar Conventional Commits

## 📞 Suporte

Para dúvidas, problemas ou sugestões:

- 📧 Email: suporte@estagiosel.com.br
- 📱 WhatsApp: (42) 99999-9999
- 🐛 Issues: [GitHub Issues](https://github.com/elneves81/Estagiosaude/issues)

## 📄 Licença

Este projeto é de uso interno acadêmico/institucional.

Desenvolvido para gestão de estágios na área da saúde.

---

**EstágioSel** - Sistema de Gestão de Estágios em Saúde
Versão 2.0 - 2025

Desenvolvido com ❤️ para facilitar a gestão de estágios na área da saúde.