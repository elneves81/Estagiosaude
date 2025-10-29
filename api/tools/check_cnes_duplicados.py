import sys
import os
from collections import defaultdict

API_DIR = os.path.dirname(os.path.dirname(__file__))
if API_DIR not in sys.path:
    sys.path.append(API_DIR)

from app.db import SessionLocal
from app import models


def main():
    s = SessionLocal()
    try:
        por_cnes = defaultdict(list)
        for u in s.query(models.Unidade).filter(models.Unidade.cnes != None, models.Unidade.cnes != "").all():
            por_cnes[(u.cnes or '').strip()].append(u)
        dups = {c: lst for c, lst in por_cnes.items() if len(lst) > 1}
        if not dups:
            print("OK: nenhum CNES duplicado.")
            return
        print(f"Encontrados {len(dups)} CNES duplicados:")
        for c, lst in sorted(dups.items(), key=lambda kv: kv[0]):
            ids = [u.id for u in sorted(lst, key=lambda x: x.id)]
            nomes = ", ".join(u.nome for u in lst)
            print(f" - CNES {c}: ids={ids} | nomes= {nomes}")
    finally:
        s.close()


if __name__ == "__main__":
    main()
