from collections import defaultdict
from .db import SessionLocal
from . import models


def run(dry_run: bool = True):
    db = SessionLocal()
    try:
        # Seleciona unidades com CNES preenchido
        unidades = db.query(models.Unidade).filter(models.Unidade.cnes != None, models.Unidade.cnes != "").all()
        por_cnes = defaultdict(list)
        for u in unidades:
            por_cnes[(u.cnes or '').strip()].append(u)

        grupos_dup = {cnes: lst for cnes, lst in por_cnes.items() if len(lst) > 1}
        if not grupos_dup:
            print("ℹ️ Nenhuma Unidade com CNES duplicado encontrada.")
            return

        total_groups = len(grupos_dup)
        total_remove = 0
        total_reassign = 0
        print(f"Encontrados {total_groups} CNES com duplicidades.")
        for cnes, lst in sorted(grupos_dup.items(), key=lambda kv: kv[0]):
            # Ordena por id crescente e mantém a primeira
            lst_sorted = sorted(lst, key=lambda u: u.id)
            keep = lst_sorted[0]
            dups = lst_sorted[1:]
            ids_dups = [u.id for u in dups]
            print(f"CNES {cnes}: manter [{keep.id}] {keep.nome}; remover {ids_dups}")

            if dry_run:
                # Só mostrar quantos estágios seriam reatribuídos
                if ids_dups:
                    cnt = db.query(models.Estagio).filter(models.Estagio.unidade_id.in_(ids_dups)).count()
                    print(f"  - Estágios a reatribuir: {cnt} -> unidade {keep.id}")
                continue

            # Reatribuir estágios e remover duplicatas
            if ids_dups:
                reassigned = (
                    db.query(models.Estagio)
                    .filter(models.Estagio.unidade_id.in_(ids_dups))
                    .update({models.Estagio.unidade_id: keep.id}, synchronize_session=False)
                )
                total_reassign += reassigned or 0
                removed = (
                    db.query(models.Unidade)
                    .filter(models.Unidade.id.in_(ids_dups))
                    .delete(synchronize_session=False)
                )
                total_remove += removed or 0

        if not dry_run:
            db.commit()
            print(f"✅ Duplicidades consolidadas. Unidades removidas: {total_remove}. Estágios reatribuídos: {total_reassign}")
        else:
            print("(dry-run) Nenhuma alteração aplicada.")
    except Exception as e:
        db.rollback()
        print(f"❌ Erro ao consolidar CNES duplicado: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    run(True)
