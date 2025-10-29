import argparse
import os
import sqlite3

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # .../api
DB_PATH = os.path.join(BASE_DIR, 'estagios.db')


def compute_totals(conn, exercicio: str | None):
    cur = conn.cursor()
    if exercicio:
        cur.execute(
            """
            SELECT COUNT(a.id), COALESCE(SUM(COALESCE(a.quantidade_grupos,0) * COALESCE(a.num_estagiarios_por_grupo,0)),0)
            FROM anexo2_atividades a
            JOIN anexo2 p ON p.id=a.anexo2_id
            WHERE p.exercicio LIKE ?
            """,
            (f"%{exercicio}%",),
        )
    else:
        cur.execute(
            """
            SELECT COUNT(id), COALESCE(SUM(COALESCE(quantidade_grupos,0) * COALESCE(num_estagiarios_por_grupo,0)),0)
            FROM anexo2_atividades
            """
        )
    total_items, total_vagas = cur.fetchone()
    return int(total_items or 0), int(total_vagas or 0)


def reset_vagas(mode: str, exercicio: str | None):
    if not os.path.exists(DB_PATH):
        raise SystemExit(f"DB não encontrado: {DB_PATH}")

    with sqlite3.connect(DB_PATH) as conn:
        before_items, before_vagas = compute_totals(conn, exercicio)
        cur = conn.cursor()

        if mode == 'hard':
            if exercicio:
                cur.execute(
                    "DELETE FROM anexo2_atividades WHERE anexo2_id IN (SELECT id FROM anexo2 WHERE exercicio LIKE ?)",
                    (f"%{exercicio}%",),
                )
            else:
                cur.execute("DELETE FROM anexo2_atividades")
        elif mode == 'purge':
            # Remove atividades e, opcionalmente, os próprios Anexos II
            if exercicio:
                cur.execute(
                    "DELETE FROM anexo2_atividades WHERE anexo2_id IN (SELECT id FROM anexo2 WHERE exercicio LIKE ?)",
                    (f"%{exercicio}%",),
                )
                cur.execute(
                    "DELETE FROM anexo2 WHERE exercicio LIKE ?",
                    (f"%{exercicio}%",),
                )
            else:
                cur.execute("DELETE FROM anexo2_atividades")
                cur.execute("DELETE FROM anexo2")
        else:
            if exercicio:
                cur.execute(
                    """
                    UPDATE anexo2_atividades
                    SET quantidade_grupos=0,
                        num_estagiarios_por_grupo=0,
                        carga_horaria_individual=NULL,
                        valor=NULL
                    WHERE anexo2_id IN (SELECT id FROM anexo2 WHERE exercicio LIKE ?)
                    """,
                    (f"%{exercicio}%",),
                )
            else:
                cur.execute(
                    """
                    UPDATE anexo2_atividades
                    SET quantidade_grupos=0,
                        num_estagiarios_por_grupo=0,
                        carga_horaria_individual=NULL,
                        valor=NULL
                    """
                )

        affected = cur.rowcount
        conn.commit()

        after_items, after_vagas = compute_totals(conn, exercicio)

    return {
        'mode': mode,
        'exercicio': exercicio,
        'affected': int(affected or 0),
        'before': {'items': before_items, 'total_vagas': before_vagas},
        'after': {'items': after_items, 'total_vagas': after_vagas},
        'db_path': DB_PATH,
    }


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Reset de vagas (soft/hard)')
    parser.add_argument('--mode', choices=['soft', 'hard', 'purge'], default='soft', help='soft: zera quantidades; hard: apaga atividades; purge: apaga atividades e anexos')
    parser.add_argument('--exercicio', default=None, help='Filtrar por exercício (ex.: 2025)')
    args = parser.parse_args()

    result = reset_vagas(args.mode, args.exercicio)
    print(result)
