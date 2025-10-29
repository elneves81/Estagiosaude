#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Watcher simples (polling) para importar arquivos soltos automaticamente.

Como funciona:
- Monitora a pasta ../../inbox (ao lado de api/ e web/) por novos .csv/.xlsx.
- Ao detectar arquivo, chama o endpoint /importar/planilha com mapeamento padrão
  OU /importar (legado) se o mapeamento não for fornecido.
- Move o arquivo para processed/ (sucesso) ou failed/ (erro) com timestamp.

Sem dependências externas (apenas stdlib + requests), grátis.
"""

import os
import time
import json
from pathlib import Path
import requests
import shutil
from datetime import datetime

BASE_DIR = Path(__file__).resolve().parents[2]  # .../estagio
INBOX = BASE_DIR / "inbox"
PROCESSED = INBOX / "processed"
FAILED = INBOX / "failed"

API_URL = os.environ.get("API_URL", "http://127.0.0.1:8001")
TOKEN = os.environ.get("API_TOKEN", None)  # Se já tiver token salvo, exporte API_TOKEN

DEFAULT_MAP = {
    # Ajuste a seu cabeçalho de planilha; estes são campos mínimos esperados pelo endpoint completo
    # nome e email são obrigatórios hoje
    "nome": "nome",
    "email": "email",
    # opcionais (use os headers reais, ou remova)
    "telefone": "telefone",
    "periodo": "periodo",
    "supervisor": "supervisor",
    "instituicao": "instituicao",
    "curso": "curso",
    "unidade": "unidade",
    "observacoes": "observacoes",
}

POLL_SECONDS = int(os.environ.get("INBOX_POLL_SECONDS", "5"))


def ensure_dirs():
    INBOX.mkdir(parents=True, exist_ok=True)
    PROCESSED.mkdir(parents=True, exist_ok=True)
    FAILED.mkdir(parents=True, exist_ok=True)


def login_if_needed():
    global TOKEN
    if TOKEN:
        return TOKEN
    # Tentativa padrão: admin local (ajuste conforme necessário)
    try:
        resp = requests.post(f"{API_URL}/auth/login", json={
            "email": "admin@estagios.local",
            "password": "Adm@2025!",
        })
        if resp.ok:
            TOKEN = resp.json().get("access_token")
            return TOKEN
        else:
            print(f"[watcher] Login falhou: {resp.status_code} {resp.text}")
    except Exception as e:
        print(f"[watcher] Erro de login: {e}")
    return None


def import_file(path: Path):
    token = login_if_needed()
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    files = {"file": (path.name, path.open("rb"))}

    # Primeiro tenta o endpoint completo com mapeamento padrão
    try:
        data = {"mapeamento": json.dumps(DEFAULT_MAP, ensure_ascii=False)}
        r = requests.post(f"{API_URL}/importar/planilha", headers=headers, files=files, data=data)
        if r.ok:
            return True, r.json()
        else:
            # Fallback para endpoint legado
            files = {"file": (path.name, path.open("rb"))}
            r2 = requests.post(f"{API_URL}/importar", headers=headers, files=files)
            if r2.ok:
                return True, r2.json()
            return False, r2.text
    except Exception as e:
        return False, str(e)


def loop():
    ensure_dirs()
    print(f"[watcher] Monitorando {INBOX} por .csv/.xlsx (poll {POLL_SECONDS}s)… API: {API_URL}")
    while True:
        try:
            for p in INBOX.glob("*"):
                if p.is_dir():
                    continue
                if not p.suffix.lower() in (".csv", ".xlsx", ".xls"):
                    continue

                print(f"[watcher] Detectado arquivo: {p.name}")
                ok, info = import_file(p)
                timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
                if ok:
                    dest = PROCESSED / f"{timestamp}-{p.name}"
                    print(f"[watcher] ✅ Importado. Movendo para {dest.name}")
                    shutil.move(str(p), str(dest))
                else:
                    dest = FAILED / f"{timestamp}-{p.name}"
                    print(f"[watcher] ❌ Falhou. Movendo para {dest.name}. Motivo: {info}")
                    shutil.move(str(p), str(dest))
        except Exception as e:
            print(f"[watcher] Erro no loop: {e}")
        time.sleep(POLL_SECONDS)


if __name__ == "__main__":
    loop()
