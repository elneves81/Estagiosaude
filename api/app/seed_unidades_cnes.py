from .db import SessionLocal
from . import models

# Lista de unidades (CNES, Nome Fantasia, Razão Social)
DADOS = [
    {"cnes": "0970972", "nome": "VACINA EPIDEMIOLOGIA", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "9080635", "nome": "ESF XARQUINHO II", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "3584445", "nome": "ESF SAO MIGUEL", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "2705753", "nome": "ESF SANTA CRUZ", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "0777897", "nome": "NUCLEO DE SAUDE DIGITAL", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "2743221", "nome": "CAPS II GUARAPUAVA", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "2742853", "nome": "UNIDADE DE PRONTO ATENDIMENTO TRIANON", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "2741601", "nome": "ESF ENTRE RIOS", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "2741652", "nome": "ESF RIO DAS PEDRAS", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "2741792", "nome": "SAE SERVICO DE ATENDIMENTO ESPECIALIZADO", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "2743299", "nome": "ESF JARDIM DAS AMERICAS", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "3016730", "nome": "ESF TANCREDO NEVES", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "3016749", "nome": "ESF RESIDENCIAL 2000", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "3016838", "nome": "ESF ADAO KAMINSKI", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "7463227", "nome": "UPA 24H BATEL", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "7513348", "nome": "AMBULATORIO DE CURATIVOS ESPECIAIS GUARAPUAVA", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "6661297", "nome": "CAPS AD GUARAPUAVA", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "3402843", "nome": "ESF PAZ E BEM", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "2706180", "nome": "ESF JORDAO", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "2741563", "nome": "ESF BONSUCESSO", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "2741598", "nome": "ESF CAMPO VELHO", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "2741636", "nome": "ESF MORRO ALTO", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "2741679", "nome": "ESF VILA CARLI", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "2741555", "nome": "CEO CENTRO DE ESPECIALIDADES ODONTOLOGICAS GPUAVA", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "2741644", "nome": "ESF PRIMAVERA", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "2743302", "nome": "ESF RECANTO FELIZ", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "6430651", "nome": "SECRETARIA MUNICIPAL DE SAUDE VIGILANCIA EM SAUDE", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "6936210", "nome": "CENTRAL DE REGULACAO SAMU GUARAPUAVA", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "7513747", "nome": "CAPS AD III INFANTO JUVENIL CIS 5 REGIONAL DE SAUDE", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "7513739", "nome": "CAPS AD III ADULTO CIS 5 REGIONAL DE SAUDE", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "6592171", "nome": "ESF VILA FEROZ", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "3091120", "nome": "ESF PLANALTO", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "3091139", "nome": "ESF PARQUE DAS ARVORES", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "7423780", "nome": "SAMU BRAVO II GUARAPUAVA", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "7423802", "nome": "SAMU BRAVO I GUARAPUAVA", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "7423810", "nome": "SAMU ALFA GUARAPUAVA", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "7429711", "nome": "MELHOR EM CASA GUARAPUAVA", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "2742365", "nome": "ESF GUAIRACA", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "2741369", "nome": "AMBULATORIO MUNICIPAL PNEUMOLOGIA E DERMATOLOGIA SANITARIA", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "3409635", "nome": "ESF SAO CRISTOVAO", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "3584461", "nome": "ESF JARDIM ARAUCARIA", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "2743310", "nome": "ESF VILA COLIBRI", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "3016773", "nome": "ESF CONCORDIA", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "3722988", "nome": "ESF ENTRE RIOS II", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "3016811", "nome": "CENTRO DE SAUDE DA MULHER", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "2706164", "nome": "ESF XARQUINHO", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "2706172", "nome": "ESF VILA BELA", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "2706199", "nome": "ESF PALMEIRINHA", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "2741571", "nome": "ESF BOQUEIRAO", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "2741628", "nome": "ESF GUARA", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "2741660", "nome": "ESF SANTANA", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "6483798", "nome": "SERVICO DE RADIOLOGIA MUNICIPAL GUARAPUAVA", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "4465482", "nome": "ESF PALMEIRINHA VOLANTE", "razao_social": "ESF PALMEIRINHA VOLANTE"},
    {"cnes": "4465369", "nome": "DIVISAO DE PERICIA MEDICA", "razao_social": "DIVISAO DE PERICIA MEDICA DO MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "0287202", "nome": "FARMACIA CENTRAL", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "4403460", "nome": "SAMU ALFA 02 GUARAPUAVA", "razao_social": "SAMU ALFA 02 GUARAPUAVA"},
    {"cnes": "6397972", "nome": "LABORATORIO MUNICIPAL GUARAPUAVA", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "4560604", "nome": "DIVISAO DE SEGURANCA E MEDICINA DO TRABALHO", "razao_social": "PREFEITURA MUNICIPAL DE GUARAPUAVA"},
    {"cnes": "9917233", "nome": "UNIDADE DE PRONTO ATENDIMENTO PRIMAVERA", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    # Itens adicionais da lista do usuário (evitar duplicatas com os já existentes acima)
    {"cnes": "0287202", "nome": "FARMACIA CENTRAL", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "7463227", "nome": "UPA 24H BATEL", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "2743221", "nome": "CAPS II GUARAPUAVA", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "2742853", "nome": "UNIDADE DE PRONTO ATENDIMENTO TRIANON", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "2741601", "nome": "ESF ENTRE RIOS", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "2741652", "nome": "ESF RIO DAS PEDRAS", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "2741792", "nome": "SAE SERVICO DE ATENDIMENTO ESPECIALIZADO", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "2743299", "nome": "ESF JARDIM DAS AMERICAS", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "3016730", "nome": "ESF TANCREDO NEVES", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "3016749", "nome": "ESF RESIDENCIAL 2000", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "3016838", "nome": "ESF ADAO KAMINSKI", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "2741369", "nome": "AMBULATORIO MUNICIPAL PNEUMOLOGIA E DERMATOLOGIA SANITARIA", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "6661297", "nome": "CAPS AD GUARAPUAVA", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "3402843", "nome": "ESF PAZ E BEM", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "2706180", "nome": "ESF JORDAO", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "2741563", "nome": "ESF BONSUCESSO", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "2741598", "nome": "ESF CAMPO VELHO", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "2741636", "nome": "ESF MORRO ALTO", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "2741679", "nome": "ESF VILA CARLI", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "2741555", "nome": "CEO CENTRO DE ESPECIALIDADES ODONTOLOGICAS GPUAVA", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "2741644", "nome": "ESF PRIMAVERA", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "2743302", "nome": "ESF RECANTO FELIZ", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "6430651", "nome": "SECRETARIA MUNICIPAL DE SAUDE VIGILANCIA EM SAUDE", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "6936210", "nome": "CENTRAL DE REGULACAO SAMU GUARAPUAVA", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "7513348", "nome": "AMBULATORIO DE CURATIVOS ESPECIAIS GUARAPUAVA", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "7513747", "nome": "CAPS AD III INFANTO JUVENIL CIS 5 REGIONAL DE SAUDE", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "7513739", "nome": "CAPS AD III ADULTO CIS 5 REGIONAL DE SAUDE", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "6397972", "nome": "LABORATORIO MUNICIPAL GUARAPUAVA", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "6592171", "nome": "ESF VILA FEROZ", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "3091120", "nome": "ESF PLANALTO", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "3091139", "nome": "ESF PARQUE DAS ARVORES", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "7423780", "nome": "SAMU BRAVO II GUARAPUAVA", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "7423802", "nome": "SAMU BRAVO I GUARAPUAVA", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "7423810", "nome": "SAMU ALFA GUARAPUAVA", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "7429711", "nome": "MELHOR EM CASA GUARAPUAVA", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "2742365", "nome": "ESF GUAIRACA", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "3409635", "nome": "ESF SAO CRISTOVAO", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "3584461", "nome": "ESF JARDIM ARAUCARIA", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "2743310", "nome": "ESF VILA COLIBRI", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "3016773", "nome": "ESF CONCORDIA", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "3722988", "nome": "ESF ENTRE RIOS II", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "3016811", "nome": "CENTRO DE SAUDE DA MULHER", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "2706164", "nome": "ESF XARQUINHO", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "2706172", "nome": "ESF VILA BELA", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "2706199", "nome": "ESF PALMEIRINHA", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "2741571", "nome": "ESF BOQUEIRAO", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "2741628", "nome": "ESF GUARA", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "2741660", "nome": "ESF SANTANA", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "6483798", "nome": "SERVICO DE RADIOLOGIA MUNICIPAL GUARAPUAVA", "razao_social": "MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "4465482", "nome": "ESF PALMEIRINHA VOLANTE", "razao_social": "ESF PALMEIRINHA VOLANTE"},
    {"cnes": "4465369", "nome": "DIVISAO DE PERICIA MEDICA", "razao_social": "DIVISAO DE PERICIA MEDICA DO MUNICIPIO DE GUARAPUAVA"},
    {"cnes": "4403460", "nome": "SAMU ALFA 02 GUARAPUAVA", "razao_social": "SAMU ALFA 02 GUARAPUAVA"},
]

def run():
    db = SessionLocal()
    try:
        inseridos = 0
        atualizados = 0
        for item in DADOS:
            cnes = (item.get('cnes') or '').strip()
            nome = (item.get('nome') or '').strip()
            razao = (item.get('razao_social') or '').strip()
            if not nome:
                continue
            rec = None
            if cnes:
                rec = db.query(models.Unidade).filter(models.Unidade.cnes == cnes).first()
            if not rec:
                rec = db.query(models.Unidade).filter(models.Unidade.nome.ilike(nome)).first()
            if rec:
                rec.nome = nome or rec.nome
                rec.cnes = cnes or rec.cnes
                rec.razao_social = razao or rec.razao_social
                atualizados += 1
            else:
                db.add(models.Unidade(nome=nome, cnes=cnes or None, razao_social=razao or None))
                inseridos += 1
        db.commit()
        print(f"✅ Unidades CNES processadas. Inseridos: {inseridos}, Atualizados: {atualizados}")
    except Exception as e:
        db.rollback()
        print(f"⚠️ Erro ao processar unidades CNES: {e}")
    finally:
        db.close()

if __name__ == '__main__':
    run()
