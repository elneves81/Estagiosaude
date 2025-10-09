# Sistema de Estágios - Scripts de Inicialização

## Como usar

### 🚀 Iniciar sistema completo (recomendado)
```
iniciar_sistema.bat
```
Este script inicia tanto o backend quanto o frontend automaticamente em janelas separadas.

### 🔧 Iniciar apenas o backend
```
iniciar_backend.bat
```
Inicia apenas a API em http://localhost:8000

### 🌐 Iniciar apenas o frontend
```
iniciar_frontend.bat
```
Inicia apenas o frontend em http://localhost:5173
(Certifique-se de que o backend já está rodando)

## Credenciais de acesso

**Administrador:**
- Email: admin@estagios.local
- Senha: admin123

## URLs importantes

- **Frontend:** http://localhost:5173
- **API Backend:** http://localhost:8001
- **Documentação da API:** http://localhost:8001/docs

## Estrutura do projeto

```
estagios-saude/
├── api/                 # Backend FastAPI
│   ├── app/            # Código da aplicação
│   ├── tools/          # Scripts de migração
│   └── venv/           # Ambiente virtual Python
├── web/                # Frontend React
│   ├── src/            # Código fonte
│   ├── public/         # Arquivos estáticos
│   └── node_modules/   # Dependências npm
├── iniciar_sistema.bat # Script principal
├── iniciar_backend.bat # Só backend
└── iniciar_frontend.bat # Só frontend
```

## Funcionalidades

✅ Autenticação com 3 tipos de usuário (admin, supervisor, escola)
✅ Gestão de supervisores
✅ Gestão de estágios com formulários completos
✅ Catálogos de instituições, cursos e unidades
✅ Importação de planilhas CSV/XLSX
✅ Relatórios em PDF/HTML
✅ Interface responsiva (PWA)