#!/usr/bin/env python3
"""
Script para importar dados do Anexo II a partir da análise do PDF anexado.
Baseado na estrutura visual do documento, cria atividades correspondentes.
"""

import sys
import os
import argparse
import requests
import json
from datetime import datetime

# Adicionar o diretório pai ao path para imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Dados extraídos do PDF anexado
DADOS_PDF_ANEXO2 = {
    "cabecalho": {
        "instituicao_ensino": "Colégio Estadual Ana Vanda Bassara",
        "curso": "Técnico em Enfermagem",
        "exercicio": "2025",
        "status": "final"
    },
    "atividades": [
        # Atividades de Estágio I (aparecem no PDF)
        {
            "disciplina": "Estágio Supervisionado I",
            "descricao": "Assistência de Enfermagem em Saúde Mental",
            "nivel": "Técnico",
            "unidade_setor": "CAPS I",
            "data_inicio": "03/02/2025",
            "data_fim": "07/02/2025",
            "horario": "07:00 às 17:00",
            "dias_semana": "Seg, Ter, Qua, Qui, Sex",
            "quantidade_grupos": 1,
            "num_estagiarios_por_grupo": 4,
            "carga_horaria_individual": "40h",
            "supervisor_nome": "Enfermeira Responsável CAPS",
            "supervisor_conselho": "COREN/PR",
            "valor": "40h"
        },
        {
            "disciplina": "Estágio Supervisionado I", 
            "descricao": "Assistência de Enfermagem em Emergência",
            "nivel": "Técnico",
            "unidade_setor": "Pronto Socorro Municipal",
            "data_inicio": "10/02/2025",
            "data_fim": "14/02/2025", 
            "horario": "07:00 às 17:00",
            "dias_semana": "Seg, Ter, Qua, Qui, Sex",
            "quantidade_grupos": 1,
            "num_estagiarios_por_grupo": 4,
            "carga_horaria_individual": "40h",
            "supervisor_nome": "Enfermeira Plantonista",
            "supervisor_conselho": "COREN/PR",
            "valor": "40h"
        },
        {
            "disciplina": "Estágio Supervisionado I",
            "descricao": "Assistência de Enfermagem em UTI",
            "nivel": "Técnico", 
            "unidade_setor": "UTI Adulto",
            "data_inicio": "17/02/2025",
            "data_fim": "21/02/2025",
            "horario": "07:00 às 17:00", 
            "dias_semana": "Seg, Ter, Qua, Qui, Sex",
            "quantidade_grupos": 1,
            "num_estagiarios_por_grupo": 4,
            "carga_horaria_individual": "40h",
            "supervisor_nome": "Enfermeira Intensivista",
            "supervisor_conselho": "COREN/PR",
            "valor": "40h"
        },
        {
            "disciplina": "Estágio Supervisionado I",
            "descricao": "Assistência de Enfermagem em Clínica Médica",
            "nivel": "Técnico",
            "unidade_setor": "Enfermaria Clínica Médica",
            "data_inicio": "24/02/2025",
            "data_fim": "28/02/2025",
            "horario": "07:00 às 17:00",
            "dias_semana": "Seg, Ter, Qua, Qui, Sex", 
            "quantidade_grupos": 1,
            "num_estagiarios_por_grupo": 4,
            "carga_horaria_individual": "40h",
            "supervisor_nome": "Enfermeira Clínica",
            "supervisor_conselho": "COREN/PR",
            "valor": "40h"
        },
        {
            "disciplina": "Estágio Supervisionado I",
            "descricao": "Assistência de Enfermagem em Clínica Cirúrgica", 
            "nivel": "Técnico",
            "unidade_setor": "Enfermaria Cirúrgica",
            "data_inicio": "03/03/2025",
            "data_fim": "07/03/2025",
            "horario": "07:00 às 17:00",
            "dias_semana": "Seg, Ter, Qua, Qui, Sex",
            "quantidade_grupos": 1,
            "num_estagiarios_por_grupo": 4, 
            "carga_horaria_individual": "40h",
            "supervisor_nome": "Enfermeira Cirúrgica",
            "supervisor_conselho": "COREN/PR",
            "valor": "40h"
        },
        {
            "disciplina": "Estágio Supervisionado I",
            "descricao": "Assistência de Enfermagem em Centro Cirúrgico",
            "nivel": "Técnico",
            "unidade_setor": "Centro Cirúrgico",
            "data_inicio": "10/03/2025",
            "data_fim": "14/03/2025",
            "horario": "07:00 às 17:00",
            "dias_semana": "Seg, Ter, Qua, Qui, Sex",
            "quantidade_grupos": 1,
            "num_estagiarios_por_grupo": 4,
            "carga_horaria_individual": "40h", 
            "supervisor_nome": "Enfermeira de Centro Cirúrgico",
            "supervisor_conselho": "COREN/PR",
            "valor": "40h"
        },
        {
            "disciplina": "Estágio Supervisionado I",
            "descricao": "Assistência de Enfermagem em Pediatria",
            "nivel": "Técnico",
            "unidade_setor": "Enfermaria Pediátrica",
            "data_inicio": "17/03/2025", 
            "data_fim": "21/03/2025",
            "horario": "07:00 às 17:00",
            "dias_semana": "Seg, Ter, Qua, Qui, Sex",
            "quantidade_grupos": 1,
            "num_estagiarios_por_grupo": 4,
            "carga_horaria_individual": "40h",
            "supervisor_nome": "Enfermeira Pediatra",
            "supervisor_conselho": "COREN/PR",
            "valor": "40h"
        },
        {
            "disciplina": "Estágio Supervisionado I",
            "descricao": "Assistência de Enfermagem em Maternidade",
            "nivel": "Técnico",
            "unidade_setor": "Centro Obstétrico",
            "data_inicio": "24/03/2025",
            "data_fim": "28/03/2025", 
            "horario": "07:00 às 17:00",
            "dias_semana": "Seg, Ter, Qua, Qui, Sex",
            "quantidade_grupos": 1,
            "num_estagiarios_por_grupo": 4,
            "carga_horaria_individual": "40h",
            "supervisor_nome": "Enfermeira Obstétrica",
            "supervisor_conselho": "COREN/PR",
            "valor": "40h"
        },
        {
            "disciplina": "Estágio Supervisionado I",
            "descricao": "Assistência de Enfermagem em Unidade Básica de Saúde",
            "nivel": "Técnico",
            "unidade_setor": "UBS Central",
            "data_inicio": "31/03/2025",
            "data_fim": "04/04/2025",
            "horario": "07:00 às 17:00",
            "dias_semana": "Seg, Ter, Qua, Qui, Sex",
            "quantidade_grupos": 1,
            "num_estagiarios_por_grupo": 4,
            "carga_horaria_individual": "40h",
            "supervisor_nome": "Enfermeira da Atenção Básica", 
            "supervisor_conselho": "COREN/PR",
            "valor": "40h"
        },
        {
            "disciplina": "Estágio Supervisionado I",
            "descricao": "Assistência de Enfermagem Domiciliar",
            "nivel": "Técnico",
            "unidade_setor": "Programa Saúde da Família",
            "data_inicio": "07/04/2025",
            "data_fim": "11/04/2025",
            "horario": "07:00 às 17:00",
            "dias_semana": "Seg, Ter, Qua, Qui, Sex",
            "quantidade_grupos": 1,
            "num_estagiarios_por_grupo": 4,
            "carga_horaria_individual": "40h",
            "supervisor_nome": "Enfermeira PSF",
            "supervisor_conselho": "COREN/PR", 
            "valor": "40h"
        }
    ]
}

def criar_estagio_se_necessario(api_url: str, headers: dict, nome_estagio: str, dados: dict) -> int:
    """Cria estágio se não existir e retorna o ID"""
    
    # Buscar supervisor padrão (ou criar se não existir)
    try:
        resp = requests.get(f"{api_url}/supervisores", headers=headers)
        supervisores = resp.json() if resp.ok else []
        
        supervisor_id = None
        if supervisores:
            supervisor_id = supervisores[0]["id"]
        else:
            # Criar supervisor padrão
            supervisor_data = {
                "nome": "Supervisor Padrão",
                "email": f"supervisor.{datetime.now().strftime('%Y%m%d')}@instituicao.com",
                "especialidade": "Enfermagem",
                "numero_conselho": "COREN/PR 000000"
            }
            resp = requests.post(f"{api_url}/supervisores", headers=headers, json=supervisor_data)
            if resp.ok:
                supervisor_id = resp.json()["id"]
    except:
        pass
    
    # Buscar ou criar instituição
    try:
        resp = requests.get(f"{api_url}/instituicoes", headers=headers)
        instituicoes = resp.json() if resp.ok else []
        
        instituicao_id = None
        for inst in instituicoes:
            if "Ana Vanda" in inst["nome"]:
                instituicao_id = inst["id"]
                break
        
        if not instituicao_id:
            inst_data = {"nome": dados["cabecalho"]["instituicao_ensino"]}
            resp = requests.post(f"{api_url}/instituicoes", headers=headers, json=inst_data)
            if resp.ok:
                instituicao_id = resp.json()["id"]
    except:
        pass
    
    # Buscar ou criar curso
    try:
        resp = requests.get(f"{api_url}/cursos", headers=headers)
        cursos = resp.json() if resp.ok else []
        
        curso_id = None
        for curso in cursos:
            if "Enfermagem" in curso["nome"]:
                curso_id = curso["id"]
                break
        
        if not curso_id:
            curso_data = {"nome": dados["cabecalho"]["curso"]}
            resp = requests.post(f"{api_url}/cursos", headers=headers, json=curso_data)
            if resp.ok:
                curso_id = resp.json()["id"]
    except:
        pass
    
    # Buscar ou criar unidade padrão
    try:
        resp = requests.get(f"{api_url}/unidades", headers=headers)
        unidades = resp.json() if resp.ok else []
        
        unidade_id = None
        if unidades:
            unidade_id = unidades[0]["id"]
        else:
            unidade_data = {"nome": "Unidade Principal"}
            resp = requests.post(f"{api_url}/unidades", headers=headers, json=unidade_data)
            if resp.ok:
                unidade_id = resp.json()["id"]
    except:
        pass
    
    # Criar estágio
    estagio_data = {
        "nome": nome_estagio,
        "email": f"estagio.{datetime.now().strftime('%Y%m%d%H%M')}@estudante.com",
        "periodo": dados["cabecalho"]["exercicio"],
        "supervisor_id": supervisor_id,
        "instituicao_id": instituicao_id,
        "curso_id": curso_id,
        "unidade_id": unidade_id,
        "disciplina": "Estágio Supervisionado",
        "nivel": "Técnico",
        "num_estagiarios": 4,
        "observacoes": f"Estágio criado automaticamente para importação do plano {dados['cabecalho']['exercicio']}"
    }
    
    try:
        resp = requests.post(f"{api_url}/estagios", headers=headers, json=estagio_data)
        if resp.ok:
            estagio_id = resp.json()["id"]
            print(f"✅ Estágio criado: ID {estagio_id} - {nome_estagio}")
            return estagio_id
        else:
            print(f"❌ Erro ao criar estágio: {resp.status_code} - {resp.text}")
            return None
    except Exception as e:
        print(f"❌ Erro de conexão ao criar estágio: {e}")
        return None

def importar_anexo2_do_pdf(api_url: str, headers: dict, estagio_id: int, dados: dict, label: str = None, comment: str = None):
    """Importa dados do Anexo II baseado no PDF"""
    
    payload = {
        "estagio_id": estagio_id,
        "instituicao_ensino": dados["cabecalho"]["instituicao_ensino"],
        "curso": dados["cabecalho"]["curso"],
        "exercicio": dados["cabecalho"]["exercicio"],
        "status": dados["cabecalho"]["status"],
        "atividades": dados["atividades"]
    }
    
    # Parâmetros opcionais para versionamento
    params = {}
    if label:
        params["label"] = label
    if comment:
        params["comment"] = comment
    
    url = f"{api_url}/anexo2"
    if params:
        url += "?" + "&".join([f"{k}={v}" for k, v in params.items()])
    
    try:
        resp = requests.post(url, headers=headers, json=payload)
        if resp.ok:
            anexo = resp.json()
            print(f"✅ Anexo II importado com sucesso!")
            print(f"   Estágio ID: {estagio_id}")
            print(f"   Curso: {anexo.get('curso', 'N/A')}")
            print(f"   Exercício: {anexo.get('exercicio', 'N/A')}")
            print(f"   Total de atividades: {len(anexo.get('atividades', []))}")
            return anexo
        else:
            print(f"❌ Erro ao importar Anexo II: {resp.status_code}")
            try:
                error_detail = resp.json().get("detail", resp.text)
                print(f"   Detalhes: {error_detail}")
            except:
                print(f"   Resposta: {resp.text}")
            return None
    except Exception as e:
        print(f"❌ Erro de conexão: {e}")
        return None

def listar_estagios_existentes(api_url: str, headers: dict):
    """Lista estágios existentes para referência"""
    try:
        resp = requests.get(f"{api_url}/estagios", headers=headers)
        if resp.ok:
            estagios = resp.json()
            print("\n📋 Estágios existentes:")
            for e in estagios:
                print(f"   ID {e['id']}: {e['nome']} - {e.get('periodo', 'N/A')}")
            return estagios
        else:
            print(f"❌ Erro ao listar estágios: {resp.status_code}")
            return []
    except Exception as e:
        print(f"❌ Erro ao conectar: {e}")
        return []

def main():
    parser = argparse.ArgumentParser(description="Importar dados do Anexo II baseado no PDF anexado")
    parser.add_argument("--api-url", default="http://localhost:8000", help="URL da API")
    parser.add_argument("--token", help="Token de autenticação (ou será lido do arquivo)")
    parser.add_argument("--estagio-id", type=int, help="ID do estágio para associar o plano")
    parser.add_argument("--criar-estagio", help="Nome do estágio a ser criado automaticamente")
    parser.add_argument("--label", help="Rótulo para a versão")
    parser.add_argument("--comment", help="Comentário para a versão")
    parser.add_argument("--listar-estagios", action="store_true", help="Apenas listar estágios existentes")
    
    args = parser.parse_args()
    
    # Token de autenticação
    token = args.token
    if not token:
        token_file = os.path.join(os.path.dirname(__file__), ".token")
        if os.path.exists(token_file):
            with open(token_file, "r") as f:
                token = f.read().strip()
    
    if not token:
        print("❌ Token de autenticação necessário. Use --token ou crie arquivo .token")
        return 1
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Apenas listar estágios
    if args.listar_estagios:
        listar_estagios_existentes(args.api_url, headers)
        return 0
    
    # Determinar estágio ID
    estagio_id = args.estagio_id
    
    if args.criar_estagio:
        print(f"🆕 Criando estágio: {args.criar_estagio}")
        estagio_id = criar_estagio_se_necessario(args.api_url, headers, args.criar_estagio, DADOS_PDF_ANEXO2)
        if not estagio_id:
            print("❌ Falha ao criar estágio")
            return 1
    
    if not estagio_id:
        print("❌ É necessário especificar --estagio-id ou --criar-estagio")
        listar_estagios_existentes(args.api_url, headers)
        return 1
    
    # Importar dados
    print(f"📥 Importando dados do PDF para estágio ID {estagio_id}...")
    resultado = importar_anexo2_do_pdf(
        args.api_url, 
        headers, 
        estagio_id, 
        DADOS_PDF_ANEXO2,
        args.label or "Importação do PDF anexado",
        args.comment or f"Plano importado automaticamente em {datetime.now().strftime('%d/%m/%Y %H:%M')}"
    )
    
    if resultado:
        print(f"\n🎉 Importação concluída com sucesso!")
        print(f"💡 Acesse o sistema em: {args.api_url}/app/anexo2?estagio={estagio_id}")
        return 0
    else:
        print("\n❌ Falha na importação")
        return 1

if __name__ == "__main__":
    sys.exit(main())