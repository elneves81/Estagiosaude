from collections import defaultdict
from .db import SessionLocal
from . import models


def run(dry_run: bool = True):
    db = SessionLocal()
    try:
        cursos = db.query(models.Curso).all()
        por_nome = defaultdict(list)
        for c in cursos:
            key = (c.nome or '').strip().lower()
            if not key:
                continue
            por_nome[key].append(c)

        grupos_dup = {k: v for k, v in por_nome.items() if len(v) > 1}
        if not grupos_dup:
            print("ℹ️ Nenhum Curso duplicado por nome encontrado.")
            return

        total_groups = len(grupos_dup)
        total_remove = 0
        total_reassign_estagio = 0
        total_ic_updates = 0
        total_ic_deleted = 0
        print(f"Encontrados {total_groups} grupos de cursos duplicados (por nome, case-insensitive).")

        for nome_key, lst in sorted(grupos_dup.items(), key=lambda kv: kv[0]):
            lst_sorted = sorted(lst, key=lambda c: c.id)
            keep = lst_sorted[0]
            dups = lst_sorted[1:]
            dup_ids = [c.id for c in dups]
            names = ", ".join(c.nome for c in lst)
            print(f"Nome '{keep.nome}': manter [{keep.id}] e remover {dup_ids} | variantes: {names}")

            if dry_run:
                if dup_ids:
                    n_est = db.query(models.Estagio).filter(models.Estagio.curso_id.in_(dup_ids)).count()
                    n_ic = db.query(models.InstituicaoCurso).filter(models.InstituicaoCurso.curso_id.in_(dup_ids)).count()
                    print(f"  - Estágios a reatribuir: {n_est} -> curso {keep.id}")
                    print(f"  - Relações instituicao_cursos a atualizar: {n_ic}")
                continue

            # Reatribuir estágios
            if dup_ids:
                reassigned = (
                    db.query(models.Estagio)
                    .filter(models.Estagio.curso_id.in_(dup_ids))
                    .update({models.Estagio.curso_id: keep.id}, synchronize_session=False)
                )
                total_reassign_estagio += reassigned or 0

                # Atualizar relações instituicao_cursos evitando duplicatas lógicas
                ics = db.query(models.InstituicaoCurso).filter(models.InstituicaoCurso.curso_id.in_(dup_ids)).all()
                for ic in ics:
                    exists = db.query(models.InstituicaoCurso).filter(
                        models.InstituicaoCurso.instituicao_id == ic.instituicao_id,
                        models.InstituicaoCurso.curso_id == keep.id,
                    ).first()
                    if exists:
                        # Já existe relação com o curso mantido: deletar este registro duplicado
                        db.delete(ic)
                        total_ic_deleted += 1
                    else:
                        ic.curso_id = keep.id
                        db.add(ic)
                        total_ic_updates += 1

                removed = (
                    db.query(models.Curso)
                    .filter(models.Curso.id.in_(dup_ids))
                    .delete(synchronize_session=False)
                )
                total_remove += removed or 0

        if dry_run:
            print("(dry-run) Nenhuma alteração aplicada.")
        else:
            db.commit()
            print(
                f"✅ Cursos deduplicados. Removidos: {total_remove}. Estágios reatribuídos: {total_reassign_estagio}. "
                f"Relações instituicao_cursos atualizadas: {total_ic_updates}, removidas: {total_ic_deleted}."
            )
    except Exception as e:
        db.rollback()
        print(f"❌ Erro ao deduplicar cursos: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    run(True)
