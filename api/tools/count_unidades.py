import sys
import os

# Garantir que o pacote app seja importável
API_DIR = os.path.dirname(os.path.dirname(__file__))
if API_DIR not in sys.path:
    sys.path.append(API_DIR)

from app.db import SessionLocal
from app import models


def main():
    s = SessionLocal()
    try:
        total = s.query(models.Unidade).count()
        sem = s.query(models.Unidade).filter((models.Unidade.cnes == None) | (models.Unidade.cnes == "")).count()
        print(f"Unidades totais: {total} | Sem CNES: {sem}")
        if total > 0:
            exemplos = s.query(models.Unidade).order_by(models.Unidade.id.asc()).limit(5).all()
            for u in exemplos:
                print(f" - [{u.id}] {u.nome} | CNES={u.cnes}")
    finally:
        s.close()


if __name__ == "__main__":
    main()
