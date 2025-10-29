import sys
import os

API_DIR = os.path.dirname(os.path.dirname(__file__))
if API_DIR not in sys.path:
    sys.path.append(API_DIR)

from app.db import SessionLocal
from app import models
from sqlalchemy import func


def main():
    s = SessionLocal()
    try:
        q = (
            s.query(models.Instituicao)
            .join(models.InstituicaoCurso, models.InstituicaoCurso.instituicao_id == models.Instituicao.id)
            .group_by(models.Instituicao.id)
            .order_by(func.lower(models.Instituicao.nome).asc())
        )
        rows = q.all()
        print(f"Total instituicoes de ensino: {len(rows)}")
        for i in rows:
            print(f"{i.id}\t{i.nome}")
    finally:
        s.close()


if __name__ == "__main__":
    main()
