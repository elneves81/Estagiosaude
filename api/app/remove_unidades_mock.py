import os
import csv
from .db import SessionLocal
from . import models


# CSV com nomes mock (se existir)
CSV_PATH = os.path.join(os.path.dirname(__file__), "faculdade_guarapuava_unidades.csv")

# Fallback caso o CSV não exista por algum motivo
FALLBACK_NOMES = [
    "Hospital Municipal de Guarapuava",
    "UBS Centro",
    "Clínica Odontológica Universitária",
    "Farmácia Escola",
    "Laboratório de Informática Biomédica",
    "Hospital Veterinário",
]


def _carregar_nomes_mock():
    nomes = set()
    if os.path.exists(CSV_PATH):
        try:
            with open(CSV_PATH, newline="", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    nome = (row.get("nome") or "").strip()
                    if nome:
                        nomes.add(nome)
        except Exception:
            # Em caso de falha de leitura, use fallback
            nomes.update(FALLBACK_NOMES)
    else:
        nomes.update(FALLBACK_NOMES)
    return nomes


def run(dry_run: bool = False):
    """Remove unidades mock previamente usadas em demonstrações.

    Estratégia segura: remove somente unidades cujos nomes constam no CSV
    de mock (ou na lista fallback). Antes, solta as referências de Estágios.

    Parâmetros:
      - dry_run: quando True, apenas lista o que seria removido.
    """
    db = SessionLocal()
    try:
        nomes = _carregar_nomes_mock()
        if not nomes:
            print("⚠️ Nenhum nome mock encontrado para remover.")
            return

        unidades = (
            db.query(models.Unidade)
            .filter(models.Unidade.nome.in_(list(nomes)))
            .all()
        )
        if not unidades:
            print("ℹ️ Nenhuma unidade mock encontrada no banco.")
            return

        ids = [u.id for u in unidades]
        nomes_encontrados = [u.nome for u in unidades]

        if dry_run:
            print(f"Encontradas {len(unidades)} unidades mock: {nomes_encontrados}")
            return

        # Soltar referências de estágios antes de deletar
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
        print(
            f"✅ Remoção concluída. Estágios atualizados: {atualizados}, Unidades removidas: {removidos}"
        )
    except Exception as e:
        db.rollback()
        print(f"❌ Erro ao remover unidades mock: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    run()
