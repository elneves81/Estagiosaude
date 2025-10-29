from .db import SessionLocal
from . import models


def run(limit: int | None = None):
    db = SessionLocal()
    try:
        q = db.query(models.Unidade).order_by(models.Unidade.id.asc())
        if limit:
            q = q.limit(limit)
        rows = q.all()
        print(f"Total unidades: {len(rows)}")
        for u in rows:
            print(f"[{u.id}] nome='{u.nome}' cnes='{u.cnes or ''}' razao='{u.razao_social or ''}' created_at='{u.created_at}'")
    finally:
        db.close()


if __name__ == "__main__":
    run()
