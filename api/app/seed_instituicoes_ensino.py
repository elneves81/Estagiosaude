from .db import SessionLocal
from . import models


CATALOGO = [
    {
        "nome": "COLÉGIO ESTADUAL ANA VANDA BASSARA",
        "razao_social": "GOVERNO DO ESTADO DO PARANÁ",
        "ofertas": [
            {"curso": "Técnico em Enfermagem", "nivel": "tecnico"},
        ],
    },
    {
        "nome": "FACULDADE GUARAPUAVA",
        "razao_social": "FACULDADE GUARAPUAVA",
        "ofertas": [
            {"curso": "Enfermagem", "nivel": "superior"},
        ],
    },
    {
        "nome": "UNICENTRO - Universidade Estadual do Centro-Oeste (Campus Guarapuava)",
        "razao_social": "UNIVERSIDADE ESTADUAL DO CENTRO-OESTE",
        "ofertas": [
            {"curso": "Enfermagem", "nivel": "superior"},
        ],
    },
    {
        "nome": "Uniguairacá Centro Universitário",
        "razao_social": "ASSOCIAÇÃO GU PARA EDUCAÇÃO E CULTURA",
        "ofertas": [
            {"curso": "Enfermagem", "nivel": "superior"},
        ],
    },
    {
        "nome": "Centro Universitário Campo Real",
        "razao_social": "SOCIEDADE EDUCACIONAL DE GUARAPUAVA LTDA",
        "ofertas": [
            {"curso": "Enfermagem", "nivel": "superior"},
        ],
    },
]


def run():
    db = SessionLocal()
    try:
        inser_inst = 0
        inser_rel = 0
        inser_curso = 0
        for inst in CATALOGO:
            nome = inst["nome"].strip()
            razao = inst.get("razao_social")
            i = db.query(models.Instituicao).filter(models.Instituicao.nome.ilike(nome)).first()
            if not i:
                i = models.Instituicao(nome=nome, razao_social=razao)
                db.add(i)
                db.flush()
                inser_inst += 1

            for of in inst.get("ofertas", []):
                curso_nome = of["curso"].strip()
                nivel = of.get("nivel")
                c = db.query(models.Curso).filter(models.Curso.nome.ilike(curso_nome)).first()
                if not c:
                    c = models.Curso(nome=curso_nome)
                    db.add(c)
                    db.flush()
                    inser_curso += 1
                # verifica se já existe relação
                exists = db.query(models.InstituicaoCurso).filter(
                    models.InstituicaoCurso.instituicao_id == i.id,
                    models.InstituicaoCurso.curso_id == c.id,
                ).first()
                if not exists:
                    db.add(models.InstituicaoCurso(instituicao_id=i.id, curso_id=c.id, nivel=nivel))
                    inser_rel += 1

        db.commit()
        print(f"✅ Instituições de ensino processadas. Instituições novas: {inser_inst}, Cursos novos: {inser_curso}, Ofertas criadas: {inser_rel}")
    except Exception as e:
        db.rollback()
        print(f"❌ Erro no seed de instituições de ensino: {e}")
    finally:
        db.close()


if __name__ == '__main__':
    run()
