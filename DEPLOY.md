# Deploy do Sistema de Estágios (sem Vite)

Este guia explica como colocar o backend (FastAPI + Jinja) em produção em outro ambiente, sem precisar do front-end Vite. A interface web já é servida pelo próprio backend via templates.

- Backend: FastAPI (Uvicorn) + Jinja2, SQLite por padrão
- Caminho do backend: `estagios-saude/api`
- Banco: `estagios-saude/api/estagios.db`
- Rotas web: `http://<host>:8001/web/login`, `http://<host>:8001/web/relatorios`

## Requisitos

- Python 3.11+ instalado
- Permissão de administrador (para instalar serviço no Windows ou configurar systemd no Linux)
- Porta 8001 liberada (ou outra de sua preferência)

---

## Opção A — Windows com Serviço (NSSM) [recomendado]

Essa opção instala o backend como serviço do Windows utilizando o NSSM. O serviço inicia automaticamente e roda em background.

1) Instalar o NSSM
- Baixe de https://nssm.cc/ e adicione `nssm.exe` ao PATH (ou copie para `C:\Windows\System32`).

2) Copiar o projeto para o servidor
- Ex.: `C:\apps\estagios-saude\` (mantenha a estrutura da pasta `api/`)

3) Instalar o serviço
- No PowerShell (como Administrador), dentro de `estagios-saude/`:

```powershell
# Ajuste a pasta conforme seu ambiente
Set-Location "C:\apps\estagios-saude"

# Instala dependências, aplica migração, garante admin e instala o serviço via NSSM
# O serviço usa por padrão: 127.0.0.1:8001
.\service\install_service.ps1
```

4) Iniciar/Parar/Remover serviço
```powershell
# Iniciar
.\service\start_service.ps1

# Parar
.\service\stop_service.ps1

# Desinstalar
.\service\uninstall_service.ps1
```

5) Acessar
- Localmente: http://localhost:8001/web/login
- Em rede local (se exposto via proxy ou se alterar host para 0.0.0.0): `http://<IP_DO_SERVIDOR>:8001/web/login`

Dica (exposição na rede): por padrão o serviço usa `127.0.0.1`. Para expor a rede sem proxy, edite `service/install_service.ps1` e troque `--host 127.0.0.1` por `--host 0.0.0.0`, reinstalando o serviço em seguida. Recomenda-se uso de um proxy (Nginx/Traefik) para HTTPS e segurança.

Firewall (Windows):
```powershell
# Abrir porta TCP 8001 (se for expor sem proxy)
netsh advfirewall firewall add rule name="Estagios 8001" dir=in action=allow protocol=TCP localport=8001
```

---

## Opção B — Windows sem serviço (execução direta)

Use se não quiser instalar serviço agora. Um `.bat` prepara tudo e sobe o uvicorn.

```powershell
Set-Location "C:\apps\estagios-saude"
.\service\run_backend.bat
```

- Por padrão sobe em 127.0.0.1:8001 com auto-reload estável (StatReload).
- Para expor na rede, edite o arquivo e troque `--host 127.0.0.1` por `--host 0.0.0.0`.

Acessar:
- http://localhost:8001/web/login

---

## Opção C — Linux (Ubuntu) com systemd + Nginx (HTTPS)

1) Preparar diretórios
```bash
sudo mkdir -p /opt/estagios
sudo chown -R $USER:$USER /opt/estagios
# copie o conteúdo do projeto para /opt/estagios
```

2) Criar venv e instalar deps
```bash
cd /opt/estagios/api
python3 -m venv venv
./venv/bin/pip install --upgrade pip
./venv/bin/pip install -r requirements.txt
./venv/bin/python tools/apply_migration.py
./venv/bin/python setup_admin.py
```

3) Service (systemd): `/etc/systemd/system/estagios.service`
```ini
[Unit]
Description=Estagios FastAPI
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/opt/estagios/api
Environment="PYTHONUNBUFFERED=1"
ExecStart=/opt/estagios/api/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8001 --workers 2 --proxy-headers
Restart=always

[Install]
WantedBy=multi-user.target
```

Ativar:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now estagios
```

4) Nginx reverse proxy: `/etc/nginx/sites-available/estagios`
```nginx
server {
  listen 80;
  server_name relatorios.seudominio.com;

  location / {
    proxy_pass http://127.0.0.1:8001;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```
Ativar e HTTPS:
```bash
sudo ln -s /etc/nginx/sites-available/estagios /etc/nginx/sites-enabled/estagios
sudo nginx -t && sudo systemctl reload nginx
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d relatorios.seudominio.com --redirect -m seu@email -n --agree-tos
```

---

## Testes rápidos
- Página de login: `GET /web/login` — deve responder 200
- Após login, acessar `/web/relatorios`
- Se precisar resetar banco: apagar `api/estagios.db` e rodar novamente migração + `setup_admin.py`.

---

## Usuário administrador padrão
- Email: `admin@estagios.local`
- Senha: `admin123`
- O script `api/setup_admin.py` cria o admin se não existir.

---

## Troubleshooting
- Porta ocupada: troque `--port` (ex.: 8002) e ajuste o proxy/firewall.
- Sem acesso externo: usando `127.0.0.1` só responde localmente. Exponha via Nginx ou use `--host 0.0.0.0` (avaliando segurança).
- Falha ao iniciar serviço (Windows): verifique se NSSM está no PATH e execute PowerShell como Administrador.
- Erro de migração: confira `api/tools/migrate.sql` e execute `tools/apply_migration.py` manualmente.
- Login 401: rode `setup_admin.py` e use as credenciais padrão; depois altere a senha.
- Backup: salve o arquivo `api/estagios.db` regularmente.

---

## Segurança (recomendado)
- Não exponha diretamente o Uvicorn para internet; use Nginx/Traefik com HTTPS.
- Troque a senha do admin após o primeiro acesso.
- Restrinja a porta no firewall quando possível.

---

## Observações
- A pasta `web/` (Vite/React) não é necessária para essa interface; tudo é servido por templates Jinja em `api/app/templates/`.
- Se quiser usar um domínio, siga a Opção C (Nginx + Certbot) para HTTPS.
