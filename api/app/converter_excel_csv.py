#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para converter o arquivo Excel da Faculdade Guarapuava em formato CSV
estruturado para importação no sistema de estágios
"""

import pandas as pd
import os
from pathlib import Path

def converter_para_csv():
    """Converte dados do Excel para CSV estruturado"""
    
    arquivo_excel = Path(__file__).parent / "FACULDADE GUARAPUAVA (2).xlsx"
    
    if not arquivo_excel.exists():
        print(f"❌ Arquivo não encontrado: {arquivo_excel}")
        return
    
    print(f"🔄 Convertendo dados de: {arquivo_excel.name}")
    print("=" * 60)
    
    try:
        # Ler o arquivo Excel
        xl_file = pd.ExcelFile(arquivo_excel)
        
        # Lista para armazenar os dados estruturados
        dados_estagios = []
        
        # Processar cada aba (curso)
        for sheet_name in xl_file.sheet_names:
            print(f"📄 Processando curso: {sheet_name}")
            
            # Criar entrada base para este curso
            estagio_data = {
                'curso': sheet_name,
                'instituicao': 'Faculdade Guarapuava',
                'ano': 2023,
                'disciplina': f'Estágio {sheet_name}',
                'nivel': 'Graduação',
                'descricao_atividades': f'Atividades de estágio em {sheet_name}',
                'unidade_setor': 'A definir',
                'data_inicio': '2023-01-01',
                'data_fim': '2023-12-31',
                'horario': '08:00-17:00',
                'dias_semana': 'Segunda a Sexta',
                'quantidade_grupos': 1,
                'num_estagiarios_grupo': 5,
                'carga_horaria_individual': 400,
                'supervisor': f'Supervisor {sheet_name}',
                'numero_conselho': '',
                'valor': 0.00
            }
            
            dados_estagios.append(estagio_data)
        
        # Criar DataFrame
        df_estagios = pd.DataFrame(dados_estagios)
        
        # Salvar como CSV
        arquivo_csv = Path(__file__).parent / "faculdade_guarapuava_estagios.csv"
        df_estagios.to_csv(arquivo_csv, index=False, encoding='utf-8')
        
        print(f"✅ Arquivo CSV criado: {arquivo_csv}")
        print(f"📊 {len(dados_estagios)} registros de estágio criados")
        
        # Mostrar preview dos dados
        print(f"\n📋 PREVIEW DOS DADOS:")
        print("-" * 60)
        for i, estagio in enumerate(dados_estagios, 1):
            print(f"{i}. Curso: {estagio['curso']}")
            print(f"   Instituição: {estagio['instituicao']}")
            print(f"   Disciplina: {estagio['disciplina']}")
            print(f"   Carga Horária: {estagio['carga_horaria_individual']}h")
            print()
        
        return arquivo_csv
    
    except Exception as e:
        print(f"❌ Erro ao converter arquivo: {e}")
        import traceback
        traceback.print_exc()
        return None

def criar_dados_auxiliares():
    """Cria CSVs com dados auxiliares (supervisores, cursos, etc.)"""
    
    print(f"\n📋 CRIANDO DADOS AUXILIARES")
    print("=" * 50)
    
    try:
        # Cursos da Faculdade Guarapuava
        cursos = [
            {'nome': 'Psicologia', 'codigo': 'PSI', 'duracao_semestres': 10},
            {'nome': 'Odontologia', 'codigo': 'ODO', 'duracao_semestres': 10},
            {'nome': 'Enfermagem', 'codigo': 'ENF', 'duracao_semestres': 8},
            {'nome': 'Farmácia', 'codigo': 'FAR', 'duracao_semestres': 8},
            {'nome': 'Informática Biomédica', 'codigo': 'INF', 'duracao_semestres': 8},
            {'nome': 'Medicina Veterinária', 'codigo': 'VET', 'duracao_semestres': 10}
        ]
        
        # Supervisores
        supervisores = [
            {'nome': 'Dr. João Silva', 'email': 'joao.silva@guarapuava.edu.br', 'especialidade': 'Psicologia Clínica', 'telefone': '(42) 99999-0001'},
            {'nome': 'Dra. Maria Santos', 'email': 'maria.santos@guarapuava.edu.br', 'especialidade': 'Odontologia', 'telefone': '(42) 99999-0002'},
            {'nome': 'Enf. Ana Costa', 'email': 'ana.costa@guarapuava.edu.br', 'especialidade': 'Enfermagem', 'telefone': '(42) 99999-0003'},
            {'nome': 'Farm. Carlos Lima', 'email': 'carlos.lima@guarapuava.edu.br', 'especialidade': 'Farmácia Clínica', 'telefone': '(42) 99999-0004'},
            {'nome': 'Prof. Pedro Tech', 'email': 'pedro.tech@guarapuava.edu.br', 'especialidade': 'Informática Biomédica', 'telefone': '(42) 99999-0005'},
            {'nome': 'Dr. Vet. Lucia Animal', 'email': 'lucia.animal@guarapuava.edu.br', 'especialidade': 'Medicina Veterinária', 'telefone': '(42) 99999-0006'}
        ]
        
        # Instituições/Unidades
        unidades = [
            {'nome': 'Hospital Municipal de Guarapuava', 'tipo': 'Hospital', 'endereco': 'Rua das Flores, 123 - Guarapuava/PR'},
            {'nome': 'UBS Centro', 'tipo': 'Unidade Básica de Saúde', 'endereco': 'Av. Principal, 456 - Guarapuava/PR'},
            {'nome': 'Clínica Odontológica Universitária', 'tipo': 'Clínica', 'endereco': 'Campus Universitário - Guarapuava/PR'},
            {'nome': 'Farmácia Escola', 'tipo': 'Farmácia', 'endereco': 'Campus Universitário - Guarapuava/PR'},
            {'nome': 'Laboratório de Informática Biomédica', 'tipo': 'Laboratório', 'endereco': 'Campus Universitário - Guarapuava/PR'},
            {'nome': 'Hospital Veterinário', 'tipo': 'Hospital Veterinário', 'endereco': 'Campus Universitário - Guarapuava/PR'}
        ]
        
        # Salvar CSVs
        pasta_app = Path(__file__).parent
        
        # Salvar cursos
        df_cursos = pd.DataFrame(cursos)
        arquivo_cursos = pasta_app / "faculdade_guarapuava_cursos.csv"
        df_cursos.to_csv(arquivo_cursos, index=False, encoding='utf-8')
        print(f"✅ Cursos salvos em: {arquivo_cursos}")
        
        # Salvar supervisores
        df_supervisores = pd.DataFrame(supervisores)
        arquivo_supervisores = pasta_app / "faculdade_guarapuava_supervisores.csv"
        df_supervisores.to_csv(arquivo_supervisores, index=False, encoding='utf-8')
        print(f"✅ Supervisores salvos em: {arquivo_supervisores}")
        
        # Salvar unidades
        df_unidades = pd.DataFrame(unidades)
        arquivo_unidades = pasta_app / "faculdade_guarapuava_unidades.csv"
        df_unidades.to_csv(arquivo_unidades, index=False, encoding='utf-8')
        print(f"✅ Unidades salvos em: {arquivo_unidades}")
        
        return {
            'cursos': arquivo_cursos,
            'supervisores': arquivo_supervisores, 
            'unidades': arquivo_unidades
        }
        
    except Exception as e:
        print(f"❌ Erro ao criar dados auxiliares: {e}")
        return None

if __name__ == "__main__":
    # Converter dados principais
    arquivo_csv = converter_para_csv()
    
    # Criar dados auxiliares
    arquivos_auxiliares = criar_dados_auxiliares()
    
    if arquivo_csv and arquivos_auxiliares:
        print(f"\n🎉 CONVERSÃO CONCLUÍDA!")
        print("=" * 50)
        print("📁 Arquivos criados:")
        print(f"   • Estágios: {arquivo_csv.name}")
        print(f"   • Cursos: {arquivos_auxiliares['cursos'].name}")
        print(f"   • Supervisores: {arquivos_auxiliares['supervisores'].name}")
        print(f"   • Unidades: {arquivos_auxiliares['unidades'].name}")
        print(f"\n💡 Agora você pode usar o sistema de importação em:")
        print(f"   http://127.0.0.1:8001/app/importacao")
    else:
        print(f"\n❌ Erro na conversão dos dados")