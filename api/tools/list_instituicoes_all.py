import sys
import os
from sqlalchemy import func

API_DIR = os.path.dirname(os.path.dirname(__file__))
if API_DIR not in sys.path:
    sys.path.append(API_DIR)

from app.db import SessionLocal
from app import models


def main():
    s = SessionLocal()
    try:
        rows = s.query(models.Instituicao).order_by(func.lower(models.Instituicao.nome).asc()).all()
        print(f"Total instituicoes: {len(rows)}")
        for i in rows:
            print(f"{i.id}\t{i.nome}")
    finally:
        s.close()


if __name__ == "__main__":
    main()
