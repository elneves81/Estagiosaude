"""
Integração externa: adaptadores para buscar Estágios em uma API externa
e mapear para o schema interno (schemas.Estagio) esperado pelo frontend.

Configuração via variáveis de ambiente:
  - INTEGRATION_ESTAGIOS_ENABLED: "1" para habilitar (default: "0")
  - INTEGRATION_BASE_URL: Base da API externa (ex.: https://sua.api)
  - INTEGRATION_TOKEN: Token/Bearer (opcional)

Contrato esperado do adaptador fetch_estagios:
  - Parâmetros: q, curso_id, instituicao_id, unidade_id, supervisor_id, limit, offset, sort_field, sort_dir
  - Retorno: dict { items: [<estagio_dict>], total: int }

Onde <estagio_dict> deve conter ao menos:
  {
    "id": int,
    "nome": str,
    "email": str,
    "periodo": str | None,
    "instituicao": { "id": int | None, "nome": str | None },
    "curso": { "id": int | None, "nome": str | None },
    "unidade": { "id": int | None, "nome": str | None },
    "supervisor": { "id": int | None, "nome": str | None }
  }

Caso a API externa use chaves diferentes, adapte em _adapt_estagio().
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple
import os
import requests

class IntegrationConfig:
    def __init__(self) -> None:
        self.enabled = os.getenv("INTEGRATION_ESTAGIOS_ENABLED", "0") in ("1", "true", "TRUE", "on", "yes")
        self.base_url = os.getenv("INTEGRATION_BASE_URL", "").rstrip("/")
        self.token = os.getenv("INTEGRATION_TOKEN", "")

    def headers(self) -> Dict[str, str]:
        h = {"Accept": "application/json"}
        if self.token:
            h["Authorization"] = f"Bearer {self.token}"
        return h


def _adapt_estagio(src: Dict[str, Any]) -> Dict[str, Any]:
    """Mapeia o payload vindo da API externa para o formato Estagio esperado.

    Ajuste as chaves conforme a sua API externa.
    """
    return {
        "id": src.get("id") or src.get("estagio_id"),
        "nome": src.get("nome") or src.get("estudante") or src.get("aluno"),
        "email": src.get("email") or src.get("email_aluno"),
        "periodo": src.get("periodo") or src.get("semestre"),
        "instituicao": {
            "id": (src.get("instituicao_id") or (src.get("instituicao") or {}).get("id")),
            "nome": (src.get("instituicao_nome") or (src.get("instituicao") or {}).get("nome")),
        },
        "curso": {
            "id": (src.get("curso_id") or (src.get("curso") or {}).get("id")),
            "nome": (src.get("curso_nome") or (src.get("curso") or {}).get("nome")),
        },
        "unidade": {
            "id": (src.get("unidade_id") or (src.get("unidade") or {}).get("id")),
            "nome": (src.get("unidade_nome") or (src.get("unidade") or {}).get("nome")),
        },
        "supervisor": {
            "id": (src.get("supervisor_id") or (src.get("supervisor") or {}).get("id")),
            "nome": (src.get("supervisor_nome") or (src.get("supervisor") or {}).get("nome")),
        },
    }


def fetch_estagios(
    cfg: IntegrationConfig,
    q: Optional[str] = None,
    curso_id: Optional[int] = None,
    instituicao_id: Optional[int] = None,
    unidade_id: Optional[int] = None,
    supervisor_id: Optional[int] = None,
    limit: int = 20,
    offset: int = 0,
    sort_field: Optional[str] = None,
    sort_dir: str = "desc",
) -> Dict[str, Any]:
    if not cfg.base_url:
        raise RuntimeError("INTEGRATION_BASE_URL não configurada")

    # Monte os parâmetros conforme a API externa aceita
    params: Dict[str, Any] = {
        "limit": limit,
        "offset": offset,
        "sort": f"{sort_field}:{sort_dir}" if sort_field else None,
    }
    if q: params["q"] = q
    if curso_id: params["curso_id"] = curso_id
    if instituicao_id: params["instituicao_id"] = instituicao_id
    if unidade_id: params["unidade_id"] = unidade_id
    if supervisor_id: params["supervisor_id"] = supervisor_id

    # Exemplo de endpoint externo (ajuste o caminho): /estagios
    url = f"{cfg.base_url}/estagios"
    r = requests.get(url, headers=cfg.headers(), params={k: v for k, v in params.items() if v is not None}, timeout=30)
    r.raise_for_status()
    data = r.json()

    # Detectar formato: lista simples ou envelope {items,total}
    if isinstance(data, list):
        items = data
        total = len(items)
    else:
        items = data.get("items", [])
        total = data.get("total", len(items))

    adapted = [_adapt_estagio(item) for item in items]
    return {"items": adapted, "total": total}
