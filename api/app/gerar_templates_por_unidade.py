#!/usr/bin/env python3
"""
Gera templates (CSV e JSON) de Anexo II para cada unidade cadastrada
baseando-se em um plano base existente (estágio com Anexo II).

Uso:
  python gerar_templates_por_unidade.py --api-url http://localhost:8000 \
      --token <TOKEN> --estagio-base 4 --out-dir ./templates_unidades \
      --data-inicio 01/08/2025

Fluxo:
  1. Busca plano base (/anexo2/{estagio_id})
  2. Lista unidades (/unidades)
  3. Para cada unidade gera CSV e JSON substituindo unidade_setor e limpando datas
  4. Opcional: aplica datas sequenciais iniciando em --data-inicio
"""

import os, sys, json, argparse, requests
from datetime import datetime, timedelta

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

HEADERS_ATIVIDADES = [
    'disciplina','descricao','nivel','unidade_setor','data_inicio','data_fim','horario','dias_semana',
    'quantidade_grupos','num_estagiarios_por_grupo','carga_horaria_individual','supervisor_nome','supervisor_conselho','valor'
]

def fetch_json(url, headers):
    r = requests.get(url, headers=headers)
    if not r.ok:
        raise RuntimeError(f"GET {url} -> {r.status_code} {r.text}")
    return r.json()

def gerar_datas(base_data_inicio: str, n: int):
    try:
        d0 = datetime.strptime(base_data_inicio, '%d/%m/%Y')
    except:
        return [('DD/MM/AAAA','DD/MM/AAAA')]*n
    out = []
    for i in range(n):
        ini = d0 + timedelta(weeks=i)
        fim = ini + timedelta(days=4)
        out.append((ini.strftime('%d/%m/%Y'), fim.strftime('%d/%m/%Y')))
    return out

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--api-url', default='http://localhost:8000')
    ap.add_argument('--token')
    ap.add_argument('--estagio-base', type=int, required=True, help='Estágio que possui o plano base')
    ap.add_argument('--out-dir', default='./templates_unidades')
    ap.add_argument('--data-inicio', help='Data início para datas sequenciais (DD/MM/AAAA)')
    ap.add_argument('--prefixo', default='template')
    args = ap.parse_args()

    token = args.token
    if not token:
        token_file = os.path.join(os.path.dirname(__file__), '.token')
        if os.path.exists(token_file):
            token = open(token_file).read().strip()
    if not token:
        print('❌ Necessário --token ou arquivo .token')
        return 1

    headers = {'Authorization': f'Bearer {token}', 'Content-Type':'application/json'}

    # 1. Plano base
    try:
        plano_base = fetch_json(f"{args.api_url}/anexo2/{args.estagio_base}", headers)
    except Exception as e:
        print(f"❌ Falha ao obter plano base: {e}")
        return 1
    atividades_base = plano_base.get('atividades', [])
    print(f"✅ Plano base carregado: {len(atividades_base)} atividades")

    # 2. Unidades
    try:
        unidades = fetch_json(f"{args.api_url}/unidades", headers)
    except Exception as e:
        print(f"❌ Falha ao listar unidades: {e}")
        return 1
    if not unidades:
        print('⚠️ Nenhuma unidade encontrada.')
        return 0
    print(f"✅ {len(unidades)} unidade(s) encontrada(s)")

    # 3. Preparar saída
    os.makedirs(args.out_dir, exist_ok=True)

    # Datas sequenciais se solicitado
    datas_seq = gerar_datas(args.data_inicio, len(atividades_base)) if args.data_inicio else None

    for unidade in unidades:
        unidade_nome = unidade['nome']
        slug = unidade_nome.lower().replace(' ','_').replace('/','-')
        base_json = {
            'cabecalho': {
                'instituicao_ensino': plano_base.get('instituicao_ensino') or 'INSTITUIÇÃO',
                'curso': plano_base.get('curso') or 'CURSO',
                'exercicio': plano_base.get('exercicio') or 'ANO',
                'status': 'final'
            },
            'atividades': []
        }
        for idx,a in enumerate(atividades_base):
            ini, fim = ('[DD/MM/AAAA]', '[DD/MM/AAAA]')
            if datas_seq:
                ini, fim = datas_seq[idx]
            base_json['atividades'].append({
                'disciplina': a.get('disciplina',''),
                'descricao': a.get('descricao',''),
                'nivel': a.get('nivel',''),
                'unidade_setor': unidade_nome,
                'data_inicio': ini,
                'data_fim': fim,
                'horario': a.get('horario','07:00 às 17:00'),
                'dias_semana': a.get('dias_semana','Seg, Ter, Qua, Qui, Sex'),
                'quantidade_grupos': a.get('quantidade_grupos',1),
                'num_estagiarios_por_grupo': a.get('num_estagiarios_por_grupo',4),
                'carga_horaria_individual': a.get('carga_horaria_individual','40h'),
                'supervisor_nome': '[SUPERVISOR]',
                'supervisor_conselho': '[CONSELHO]',
                'valor': a.get('valor','40h')
            })

        json_path = os.path.join(args.out_dir, f"{args.prefixo}_{slug}.json")
        with open(json_path,'w',encoding='utf-8') as f:
            json.dump(base_json,f,indent=2,ensure_ascii=False)

        # CSV
        csv_path = os.path.join(args.out_dir, f"{args.prefixo}_{slug}.csv")
        with open(csv_path,'w',encoding='utf-8-sig') as f:
            f.write(';'.join(HEADERS_ATIVIDADES)+'\n')
            for at in base_json['atividades']:
                row = []
                for h in HEADERS_ATIVIDADES:
                    v = at.get(h,'')
                    row.append(str(v).replace(';',','))
                f.write(';'.join(row)+'\n')

        print(f"   • Gerado template para unidade: {unidade_nome}")

    print(f"\n🎉 Templates gerados em: {os.path.abspath(args.out_dir)}")
    return 0

if __name__ == '__main__':
    sys.exit(main())