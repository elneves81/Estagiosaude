#!/usr/bin/env python3
"""
Gerador de templates para Anexo II baseado em planos existentes.
Permite criar modelos padronizados para diferentes unidades/cursos.
"""

import sys
import os
import argparse
import requests
import json
from datetime import datetime, timedelta
import csv

# Adicionar o diretório pai ao path para imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def obter_plano_base(api_url: str, headers: dict, estagio_id: int):
    """Obtém plano existente como base para template"""
    try:
        resp = requests.get(f"{api_url}/anexo2/{estagio_id}", headers=headers)
        if resp.ok:
            return resp.json()
        else:
            print(f"❌ Erro ao obter plano base: {resp.status_code}")
            return None
    except Exception as e:
        print(f"❌ Erro de conexão: {e}")
        return None

def gerar_template_csv(plano_base: dict, output_file: str):
    """Gera template CSV baseado no plano"""
    
    headers = [
        'disciplina', 'descricao', 'nivel', 'unidade_setor', 
        'data_inicio', 'data_fim', 'horario', 'dias_semana',
        'quantidade_grupos', 'num_estagiarios_por_grupo', 
        'carga_horaria_individual', 'supervisor_nome', 
        'supervisor_conselho', 'valor'
    ]
    
    with open(output_file, 'w', newline='', encoding='utf-8-sig') as csvfile:
        writer = csv.writer(csvfile, delimiter=';')
        
        # Cabeçalho
        writer.writerow(headers)
        
        # Dados das atividades (limpos para template)
        for atividade in plano_base.get('atividades', []):
            row = []
            for header in headers:
                valor = atividade.get(header, '')
                
                # Limpar dados específicos para tornar template genérico
                if header == 'data_inicio':
                    valor = 'DD/MM/AAAA'
                elif header == 'data_fim':
                    valor = 'DD/MM/AAAA'
                elif header == 'supervisor_nome':
                    valor = 'Nome do Supervisor'
                elif header == 'supervisor_conselho':
                    valor = 'COREN/XX XXXXXX'
                
                row.append(str(valor))
            writer.writerow(row)
    
    print(f"✅ Template CSV gerado: {output_file}")

def gerar_template_json(plano_base: dict, output_file: str, nome_instituicao: str = None, curso: str = None):
    """Gera template JSON personalizável"""
    
    template = {
        "cabecalho": {
            "instituicao_ensino": nome_instituicao or "[NOME DA INSTITUIÇÃO]",
            "curso": curso or "[NOME DO CURSO]", 
            "exercicio": "[ANO]",
            "status": "final"
        },
        "atividades": []
    }
    
    # Processar atividades como template
    for atividade in plano_base.get('atividades', []):
        atividade_template = {
            "disciplina": atividade.get('disciplina', ''),
            "descricao": atividade.get('descricao', ''),
            "nivel": atividade.get('nivel', ''),
            "unidade_setor": "[UNIDADE/SETOR]",
            "data_inicio": "[DD/MM/AAAA]",
            "data_fim": "[DD/MM/AAAA]",
            "horario": atividade.get('horario', '07:00 às 17:00'),
            "dias_semana": atividade.get('dias_semana', 'Seg, Ter, Qua, Qui, Sex'),
            "quantidade_grupos": atividade.get('quantidade_grupos', 1),
            "num_estagiarios_por_grupo": atividade.get('num_estagiarios_por_grupo', 4),
            "carga_horaria_individual": atividade.get('carga_horaria_individual', '40h'),
            "supervisor_nome": "[NOME DO SUPERVISOR]",
            "supervisor_conselho": "[CONSELHO PROFISSIONAL]",
            "valor": atividade.get('valor', '40h')
        }
        template["atividades"].append(atividade_template)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(template, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Template JSON gerado: {output_file}")

def criar_plano_personalizado(template_data: dict, personalizacao: dict):
    """Cria plano personalizado a partir do template"""
    
    plano = template_data.copy()
    
    # Aplicar personalizações ao cabeçalho
    for campo, valor in personalizacao.get('cabecalho', {}).items():
        if campo in plano['cabecalho']:
            plano['cabecalho'][campo] = valor
    
    # Aplicar personalizações às atividades
    for i, atividade in enumerate(plano['atividades']):
        # Personalização por índice de atividade
        if str(i) in personalizacao.get('atividades', {}):
            atividade_custom = personalizacao['atividades'][str(i)]
            for campo, valor in atividade_custom.items():
                atividade[campo] = valor
        
        # Personalização global para todas as atividades
        if 'global' in personalizacao.get('atividades', {}):
            global_custom = personalizacao['atividades']['global']
            for campo, valor in global_custom.items():
                if campo not in personalizacao.get('atividades', {}).get(str(i), {}):
                    atividade[campo] = valor
    
    return plano

def gerar_datas_sequenciais(data_inicio_str: str, num_semanas: int, formato_entrada: str = "%d/%m/%Y"):
    """Gera datas sequenciais por semana"""
    try:
        data_inicio = datetime.strptime(data_inicio_str, formato_entrada)
        datas = []
        
        for semana in range(num_semanas):
            inicio_semana = data_inicio + timedelta(weeks=semana)
            fim_semana = inicio_semana + timedelta(days=4)  # Segunda a sexta
            
            datas.append({
                'inicio': inicio_semana.strftime("%d/%m/%Y"),
                'fim': fim_semana.strftime("%d/%m/%Y")
            })
        
        return datas
    except:
        return []

def aplicar_datas_automaticas(plano: dict, data_inicio: str):
    """Aplica datas automáticas sequenciais ao plano"""
    atividades = plano.get('atividades', [])
    if not atividades:
        return
    
    datas = gerar_datas_sequenciais(data_inicio, len(atividades))
    
    for i, atividade in enumerate(atividades):
        if i < len(datas):
            atividade['data_inicio'] = datas[i]['inicio']
            atividade['data_fim'] = datas[i]['fim']

def listar_planos_disponiveis(api_url: str, headers: dict):
    """Lista planos disponíveis como base para templates"""
    try:
        resp = requests.get(f"{api_url}/planos/search?limit=100", headers=headers)
        if resp.ok:
            data = resp.json()
            planos = data.get('items', [])
            
            print("\n📋 Planos disponíveis para usar como base:")
            for plano in planos:
                print(f"   Estágio ID {plano['estagio_id']}: {plano.get('curso', 'N/A')} - {plano.get('exercicio', 'N/A')}")
                print(f"      Instituição: {plano.get('instituicao_ensino', 'N/A')}")
                print(f"      Atividades: {len(plano.get('atividades', []))}")
                print()
            
            return planos
        else:
            print(f"❌ Erro ao listar planos: {resp.status_code}")
            return []
    except Exception as e:
        print(f"❌ Erro de conexão: {e}")
        return []

def main():
    parser = argparse.ArgumentParser(description="Gerador de templates para Anexo II")
    parser.add_argument("--api-url", default="http://localhost:8000", help="URL da API")
    parser.add_argument("--token", help="Token de autenticação")
    parser.add_argument("--estagio-base", type=int, help="ID do estágio usado como base")
    parser.add_argument("--listar-planos", action="store_true", help="Listar planos disponíveis")
    parser.add_argument("--output-csv", help="Arquivo CSV de saída")
    parser.add_argument("--output-json", help="Arquivo JSON de saída")
    parser.add_argument("--instituicao", help="Nome da instituição para template")
    parser.add_argument("--curso", help="Nome do curso para template") 
    parser.add_argument("--data-inicio", help="Data de início para gerar datas automáticas (DD/MM/AAAA)")
    
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
    
    # Listar planos disponíveis
    if args.listar_planos:
        listar_planos_disponiveis(args.api_url, headers)
        return 0
    
    if not args.estagio_base:
        print("❌ É necessário especificar --estagio-base")
        print("💡 Use --listar-planos para ver opções disponíveis")
        return 1
    
    # Obter plano base
    print(f"📥 Obtendo plano base do estágio {args.estagio_base}...")
    plano_base = obter_plano_base(args.api_url, headers, args.estagio_base)
    
    if not plano_base:
        return 1
    
    print(f"✅ Plano obtido: {plano_base.get('curso', 'N/A')} - {len(plano_base.get('atividades', []))} atividades")
    
    # Aplicar datas automáticas se solicitado
    if args.data_inicio:
        print(f"📅 Aplicando datas automáticas a partir de {args.data_inicio}...")
        aplicar_datas_automaticas(plano_base, args.data_inicio)
    
    # Gerar templates
    if args.output_csv:
        gerar_template_csv(plano_base, args.output_csv)
    
    if args.output_json:
        gerar_template_json(plano_base, args.output_json, args.instituicao, args.curso)
    
    if not args.output_csv and not args.output_json:
        # Gerar templates padrão
        timestamp = datetime.now().strftime("%Y%m%d_%H%M")
        csv_file = f"template_anexo2_{timestamp}.csv"
        json_file = f"template_anexo2_{timestamp}.json"
        
        gerar_template_csv(plano_base, csv_file)
        gerar_template_json(plano_base, json_file, args.instituicao, args.curso)
    
    print(f"\n🎉 Templates gerados com sucesso!")
    print(f"💡 Use os templates para criar planos similares para outras unidades")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())