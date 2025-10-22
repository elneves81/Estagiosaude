## Sistema de Gestão de Estágios

Plataforma para gerenciamento de estágios em saúde (supervisores, instituições, cursos, unidades, estudantes, relatórios e importação de planilhas) construída em **FastAPI + Jinja2 (HTML server-side)** e opção adicional de **frontend React/Vite**.

### Tecnologias
- FastAPI, SQLAlchemy, SQLite
- Templates Jinja2 + CSS custom
- JWT (Bearer + Cookie HTTPOnly para HTML)
- Relatórios HTML/PDF (WeasyPrint opcional)
- Importação CSV/XLSX (openpyxl)

### Estrutura
```
estagios-saude/
	api/
		app/
			main.py
			auth.py
			crud.py
			models.py
			schemas.py
			utils_pdf.py
			core/config.py
			routers/
				auth_routes.py
				supervisores_routes.py
				estagios_routes.py
				catalogos_routes.py
			templates/
			static/
		tools/
			migrate.sql
			apply_migration.py
		requirements.txt
	web/ (opcional SPA)
```

### Inicialização Rápida (Backend)
```
cd estagios-saude/api
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python tools\apply_migration.py
uvicorn app.main:app --port 8001 --reload
```
Acesse: http://127.0.0.1:8001/web/login

Modo alternativo (sem problemas de reload em Python 3.13):
```
ESTAGIOS_RELOAD=0 python app\main.py
```

Credenciais padrão:
```
admin@estagios.local / admin123
```

### Scripts .BAT
| Script | Descrição |
|--------|-----------|
| iniciar_backend.bat | Sobe somente API (agora com modos: reload, stat, noreload, reset) |
| iniciar_frontend.bat | Sobe SPA React (se usar) |
| iniciar_sistema.bat | Backend + Frontend (versão antiga, mantida) |
| start_all.bat | Backend + Frontend (versão nova otimizada) |
| menu.bat | Menu interativo |

### Novo Script PowerShell Simplificado
Você também pode usar o script único `start.ps1` (recomendado no Windows PowerShell):

```
./start.ps1              # inicia backend
./start.ps1 -Frontend    # inicia backend + frontend (se web/ existir)
./start.ps1 -ResetDb     # recria o banco antes de iniciar
```

Se der erro de execução de script (ExecutionPolicy), rode uma vez como administrador:
```
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

Ou apenas:
```
powershell -ExecutionPolicy Bypass -File .\start.ps1
```

### Script .BAT Simplificado (Windows)
Se preferir usar somente .bat (Prompt de Comando):

```
start_backend.bat             # inicia backend (reload padrão)
start_backend.bat stat        # reload usando implementação 'stat'
start_backend.bat noreload    # sem reload (mais estável)
start_backend.bat reset       # recria banco + reload padrão
start_backend.bat reset stat  # recria banco + reload stat
```

Se o comando `py` não funcionar, edite o arquivo e troque `py` por `python`.


### API (JSON)
Docs: http://127.0.0.1:8001/docs

Endpoints principais: `/auth/login`, `/supervisores`, `/estagios`, `/instituicoes`, `/cursos`, `/unidades`, `/importar`, `/relatorios/anexo2/{id}`

### Execução Unificada (Windows) Nova

Para subir tudo de uma vez (backend + frontend) na raiz do projeto:

```
start_all.bat
```

Modos combináveis:
```
start_all.bat stat        # backend com reload 'stat'
start_all.bat noreload    # backend sem reload
start_all.bat reset       # recria banco
start_all.bat reset stat  # recria banco + reload stat
```

Se quiser apenas ver logs em um terminal único, use os comandos manuais descritos acima.

### Importação CSV mínima
Campos: `nome,email` (opcionais: telefone, periodo, supervisor_id)

### Relatório Anexo II
`/relatorios/anexo2/{estagio_id}?format=html|pdf`

### Em andamento / próximos passos
- [ ] Versionar API em `/api/v1` e separar `/web/*`
- [ ] Camada `services/` para regras complexas
- [ ] Testes automatizados (pytest + httpx)
- [ ] Logging estruturado
- [ ] `.env` + segredo externo
- [ ] GitHub Actions (CI)
- [ ] CSRF tokens em formulários HTML
- [ ] Ajustar compatibilidade Python 3.13 (auto-reload)

### Funcionalidades atuais
✅ Auth multi-perfil (admin, supervisor, escola)  
✅ CRUD supervisores / estágios / catálogos  
✅ Relatórios HTML/PDF  
✅ Importação CSV/XLSX  
✅ Templates rápidos (Jinja2)  
✅ Exclusão via interface  
✅ Layout moderno de login  

### Segurança (recomendações)
- Alterar SECRET_KEY em produção
- Usar cookies `Secure` (HTTPS)
- Habilitar limites e auditoria de ações críticas

### Licença
Uso interno acadêmico / institucional (ajuste conforme política local).