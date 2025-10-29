import sys
import os
from collections import defaultdict
from sqlalchemy import func

API_DIR = os.path.dirname(os.path.dirname(__file__))
if API_DIR not in sys.path:
    sys.path.append(API_DIR)

from app.db import SessionLocal
from app import models


def main():
    s = SessionLocal()
    try:
        por_nome = defaultdict(list)
        for i in s.query(models.Instituicao).all():
            key = (i.nome or '').strip().lower()
            if not key:
                continue
            por_nome[key].append(i)
        dups = {k: v for k, v in por_nome.items() if len(v) > 1}
        if not dups:
            print("OK: nenhuma instituição duplicada por nome.")
            return
        print(f"Encontrados {len(dups)} nomes duplicados de instituições:")
        for k, lst in sorted(dups.items(), key=lambda kv: kv[0]):
            ids = [i.id for i in sorted(lst, key=lambda x: x.id)]
            print(f" - '{lst[0].nome}': ids={ids}")
    finally:
        s.close()


if __name__ == "__main__":
    main()
