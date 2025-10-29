from app.models import SessionLocal, Supervisor
from sqlalchemy.orm import Session
import re

NOMES = [
    "Luciane Bahls Nascimento de Jesus",
    "Samuara Fatima Hassan",
    "Sandra Mara Valentim",
    "Claudiane Zampier Meira",
    "Jocilene Aparecida Lara",
    "Samuara Fatima Hassan",
    "Thayna Martini Batista",
    "Danúbia Carla Nascimento",
    "Danúbia Carla Nascimento",
    "Claudiane Zampier Meira",
    "Danúbia Carla Nascimento",
    "Luciane Bahls Nascimento de Jesus",
    "Franciele Lustosa Barbosa",
    "Jaqueline Aparecida Haubert Koszalka",
    "Robiana da Silva Ruppel",
    "Robiana da Silva Ruppel",
    "Robiana da Silva Ruppel",
    "Cibele Marochi",
    "Cibele Marochi",
    "Clara Roberta Buzzato",
    "Clara Roberta Buzzato",
    "Ideir Pereira de Oliveira Valotto",
    "Clara Roberta Buzzato",
    "Ideir Pereira de Oliveira Valotto",
    "Josiane de Fatima Fernandes",
    "Claudiane Zampier Meira",
    "Robiana da Silva Ruppel",
    "Josiane de Fatima Fernandes",
    "Clara Roberta Buzzato",
    "Clara Roberta Buzzato",
    "Marjorie Rabel Corso",
    "Clara Roberta Buzzato",
    "Sandra Mara Valentim",
    "Claudiane Zampier Meira",
    "Claudiane Zampier Meira",
    "Claudiane Zampier Meira",
    "Daiane Padilha",
    "Daiane Padilha",
    "Claudiane Zampier Meira",
    "Daiane Padilha",
    "Marjorie Rabel Corso",
    "Sandra Mara Valentim",
    "Sandra Mara Valentim",
    "Franciele Lustosa Barbosa",
    "Sandra Mara Valentim",
    "Franciele Lustosa Barbosa",
    "Jaqueline Aparecida Haubert Koszalka",
    "Jaqueline Aparecida Haubert Koszalka",
    "Daiane Padilha",
    "Iliane de Paula",
    "Jocilene Aparecida Lara",
    "Luciane Bahls Nascimento de Jesus",
    "Marjorie Rabel Corso",
    "Rafael Brandão",
    "Jocilene Aparecida Lara",
    "Marjorie Rabel Corso",
    "Danúbia Carla Nascimento",
    "Flávia Silva de Souza",
    "Danúbia Carla Nascimento",
    "Danúbia Carla Nascimento",
    "Jocilene Aparecida Lara",
    "Robiana da Silva Ruppel",
    "Robiana da Silva Ruppel",
    "Robiana da Silva Ruppel",
    "Claudiane Zampier Meira",
    "Elisangela Ruaro",
    "Jurandir Portela Junior",
    "Elisangela Ruaro",
    "Jurandir Portela Junior",
    "Elisangela Ruaro",
    "Jurandir Portela Junior",
]

# normaliza e cria email baseado no nome

def slugify_name(name: str) -> str:
    # Remove acentos e caracteres não alfanuméricos
    name = name.strip().lower()
    # troca acentos simples
    normalize_map = str.maketrans(
        "áàãâäéèêëíìîïóòõôöúùûüçñ",
        "aaaaaeeeeiiiiooooouuuucn",
    )
    name = name.translate(normalize_map)
    name = re.sub(r"[^a-z0-9\s]", "", name)
    name = re.sub(r"\s+", " ", name)
    return name


def email_from_name(base: str, taken: set) -> str:
    base = base.replace(" ", ".")
    domain = "supervisores@example.local"
    email = f"{base}@{domain}"
    if email not in taken:
        return email
    # tenta sufixos numericos
    i = 2
    while True:
        email_i = f"{base}{i}@{domain}"
        if email_i not in taken:
            return email_i
        i += 1


def main():
    db: Session = SessionLocal()
    try:
        # coletar existentes
        existentes = {s.nome.strip().lower(): s for s in db.query(Supervisor).all()}
        taken_emails = {s.email for s in existentes.values() if s.email}
        adicionados = 0
        ignorados = 0
        for raw in NOMES:
            nome = raw.strip()
            if not nome:
                continue
            key = nome.lower()
            if key in existentes:
                ignorados += 1
                continue
            slug = slugify_name(nome)
            email = email_from_name(slug, taken_emails)
            sup = Supervisor(nome=nome, email=email)
            db.add(sup)
            db.flush()
            existentes[key] = sup
            taken_emails.add(email)
            adicionados += 1
        db.commit()
        print(f"Supervisores adicionados: {adicionados}; ignorados (já existiam): {ignorados}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
