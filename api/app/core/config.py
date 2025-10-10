from functools import lru_cache
from pydantic_settings import BaseSettings
from pydantic import field_validator
import json


def _split_csv(value: str) -> list[str]:
    if not value:
        return []
    return [v.strip() for v in value.split(',') if v.strip()]

class Settings(BaseSettings):
    APP_NAME: str = "Sistema de Estágios"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api"
    SECRET_KEY: str = "change-me"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    # Aceita str (CSV/JSON) ou lista; faremos normalização no validador
    CORS_ORIGINS: list[str] | str = ["http://localhost:5173", "http://127.0.0.1:5173"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors(cls, v):
        """Aceita vários formatos:
        - lista já pronta
        - string vazia -> lista vazia
        - string CSV ("http://a,http://b")
        - string JSON list ("[\"http://a\", \"http://b\"]")
        Qualquer erro -> fallback para lista vazia / CSV simples.
        """
        try:
            if v is None:
                return []
            if isinstance(v, list):
                # Normaliza removendo vazios
                return [x for x in (str(i).strip() for i in v) if x]
            if isinstance(v, str):
                s = v.strip()
                if s == "":
                    return []
                if s.startswith("["):
                    # JSON
                    try:
                        data = json.loads(s)
                        if isinstance(data, list):
                            return [str(item).strip() for item in data if str(item).strip()]
                    except Exception:
                        # segue para CSV
                        pass
                # CSV fallback
                return _split_csv(s)
            # Qualquer outra coisa: converte para lista única
            return [str(v)]
        except Exception:
            return []

    class Config:
        env_file = ".env"
        case_sensitive = True

@lru_cache
def get_settings() -> Settings:
    return Settings()
