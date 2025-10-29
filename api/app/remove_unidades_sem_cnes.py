from .db import SessionLocal
from . import models


def run(dry_run: bool = True):
    db = SessionLocal()
    try:
        q = db.query(models.Unidade).filter((models.Unidade.cnes == None) | (models.Unidade.cnes == ""))
        rows = q.all()
        if dry_run:
            print(f"Encontradas {len(rows)} unidades sem CNES:")
            for u in rows:
                print(f" - [{u.id}] {u.nome}")
            return

        ids = [u.id for u in rows]
        if not ids:
            print("ℹ️ Nenhuma unidade sem CNES encontrada.")
            return

        # Soltar referências de estágios
        atualizados = (
            db.query(models.Estagio)
            .filter(models.Estagio.unidade_id.in_(ids))
            .update({models.Estagio.unidade_id: None}, synchronize_session=False)
        )

        removidos = (
            db.query(models.Unidade)
            .filter(models.Unidade.id.in_(ids))
            .delete(synchronize_session=False)
        )
        db.commit()
        print(f"✅ Removidas {removidos} unidades sem CNES. Estágios ajustados: {atualizados}")
    except Exception as e:
        db.rollback()
        print(f"❌ Erro na remoção: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    run(True)
