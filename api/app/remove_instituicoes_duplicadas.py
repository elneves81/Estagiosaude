from collections import defaultdict
from .db import SessionLocal
from . import models


def run(dry_run: bool = True):
    db = SessionLocal()
    try:
        insts = db.query(models.Instituicao).all()
        por_nome = defaultdict(list)
        for i in insts:
            key = (i.nome or '').strip().lower()
            if not key:
                continue
            por_nome[key].append(i)

        grupos = {k: v for k, v in por_nome.items() if len(v) > 1}
        if not grupos:
            print("ℹ️ Nenhuma instituição duplicada por nome encontrada.")
            return

        total_groups = len(grupos)
        total_removed = 0
        total_estagio_reassign = 0
        total_usuario_reassign = 0
        total_ic_updates = 0
        total_ic_deleted = 0
        print(f"Encontrados {total_groups} grupos de instituições duplicadas (por nome, case-insensitive).")

        for nome_key, lst in sorted(grupos.items(), key=lambda kv: kv[0]):
            lst_sorted = sorted(lst, key=lambda x: x.id)
            keep = lst_sorted[0]
            dups = lst_sorted[1:]
            dup_ids = [i.id for i in dups]
            variants = ", ".join(i.nome for i in lst)
            print(f"Nome '{keep.nome}': manter [{keep.id}] e remover {dup_ids} | variantes: {variants}")

            if dry_run:
                if dup_ids:
                    n_est = db.query(models.Estagio).filter(models.Estagio.instituicao_id.in_(dup_ids)).count()
                    n_usr = db.query(models.Usuario).filter(models.Usuario.instituicao_id.in_(dup_ids)).count()
                    n_ic = db.query(models.InstituicaoCurso).filter(models.InstituicaoCurso.instituicao_id.in_(dup_ids)).count()
                    print(f"  - Estágios a reatribuir: {n_est} -> inst {keep.id}")
                    print(f"  - Usuários a reatribuir: {n_usr} -> inst {keep.id}")
                    print(f"  - Relações instituicao_cursos a atualizar: {n_ic}")
                continue

            if dup_ids:
                # Estágios -> keep
                reassigned_e = (
                    db.query(models.Estagio)
                    .filter(models.Estagio.instituicao_id.in_(dup_ids))
                    .update({models.Estagio.instituicao_id: keep.id}, synchronize_session=False)
                )
                total_estagio_reassign += reassigned_e or 0

                # Usuários -> keep
                reassigned_u = (
                    db.query(models.Usuario)
                    .filter(models.Usuario.instituicao_id.in_(dup_ids))
                    .update({models.Usuario.instituicao_id: keep.id}, synchronize_session=False)
                )
                total_usuario_reassign += reassigned_u or 0

                # Relações instituicao_cursos
                ics = db.query(models.InstituicaoCurso).filter(models.InstituicaoCurso.instituicao_id.in_(dup_ids)).all()
                for ic in ics:
                    exists = db.query(models.InstituicaoCurso).filter(
                        models.InstituicaoCurso.instituicao_id == keep.id,
                        models.InstituicaoCurso.curso_id == ic.curso_id,
                    ).first()
                    if exists:
                        # já existe a relação; deletar duplicado
                        db.delete(ic)
                        total_ic_deleted += 1
                    else:
                        ic.instituicao_id = keep.id
                        db.add(ic)
                        total_ic_updates += 1

                removed = (
                    db.query(models.Instituicao)
                    .filter(models.Instituicao.id.in_(dup_ids))
                    .delete(synchronize_session=False)
                )
                total_removed += removed or 0

        if dry_run:
            print("(dry-run) Nenhuma alteração aplicada.")
        else:
            db.commit()
            print(
                f"✅ Instituições deduplicadas. Removidas: {total_removed}. "
                f"Estágios reatribuídos: {total_estagio_reassign}. Usuários reatribuídos: {total_usuario_reassign}. "
                f"Relações instituicao_cursos atualizadas: {total_ic_updates}, removidas: {total_ic_deleted}."
            )
    except Exception as e:
        db.rollback()
        print(f"❌ Erro ao deduplicar instituições: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    run(True)
