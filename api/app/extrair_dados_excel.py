#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para analisar e extrair dados detalhados do arquivo Excel da Faculdade Guarapuava
"""

import pandas as pd
import os
from pathlib import Path

def extrair_dados_detalhados():
    """Extrai dados detalhados do arquivo Excel"""
    
    arquivo_excel = Path(__file__).parent / "FACULDADE GUARAPUAVA (2).xlsx"
    
    if not arquivo_excel.exists():
        print(f"❌ Arquivo não encontrado: {arquivo_excel}")
        return
    
    print(f"📊 Extraindo dados detalhados de: {arquivo_excel.name}")
    print("=" * 80)
    
    try:
        # Ler o arquivo Excel
        xl_file = pd.ExcelFile(arquivo_excel)
        
        # Analisar cada aba para extrair dados estruturados
        for sheet_name in xl_file.sheet_names:
            print(f"\n📄 CURSO: {sheet_name}")
            print("-" * 50)
            
            # Ler a aba sem cabeçalho para acessar células específicas
            df = pd.read_excel(arquivo_excel, sheet_name=sheet_name, header=None)
            
            # Mostrar toda a planilha para entender a estrutura
            print("📋 CONTEÚDO COMPLETO DA PLANILHA:")
            print()
            
            for idx in range(min(30, len(df))):  # Mostrar até 30 linhas
                linha = df.iloc[idx]
                valores_nao_nulos = []
                
                for col_idx, valor in enumerate(linha):
                    if pd.notna(valor) and str(valor).strip():
                        valores_nao_nulos.append(f"Col{col_idx}: {str(valor).strip()}")
                
                if valores_nao_nulos:
                    print(f"   Linha {idx+1:2d}: {' | '.join(valores_nao_nulos)}")
            
            print("\n" + "=" * 80)
    
    except Exception as e:
        print(f"❌ Erro ao analisar arquivo: {e}")
        import traceback
        traceback.print_exc()

def identificar_campos_estagio():
    """Identifica os campos de estágio que podem ser extraídos"""
    
    arquivo_excel = Path(__file__).parent / "FACULDADE GUARAPUAVA (2).xlsx"
    
    print(f"\n🔍 IDENTIFICANDO CAMPOS DE ESTÁGIO")
    print("=" * 50)
    
    try:
        # Ler apenas a primeira aba para identificar padrões
        df = pd.read_excel(arquivo_excel, sheet_name=0, header=None)
        
        # Procurar por campos específicos
        campos_identificados = {}
        
        for idx in range(len(df)):
            for col_idx in range(len(df.columns)):
                valor = df.iloc[idx, col_idx]
                
                if pd.notna(valor):
                    valor_str = str(valor).strip().lower()
                    
                    # Identificar campos relevantes
                    if 'curso' in valor_str:
                        campos_identificados['curso'] = f"Linha {idx+1}, Coluna {col_idx+1}"
                    elif 'instituição' in valor_str or 'instituicao' in valor_str:
                        campos_identificados['instituicao'] = f"Linha {idx+1}, Coluna {col_idx+1}"
                    elif 'unidade' in valor_str or 'setor' in valor_str:
                        campos_identificados['unidade'] = f"Linha {idx+1}, Coluna {col_idx+1}"
                    elif 'supervisor' in valor_str:
                        campos_identificados['supervisor'] = f"Linha {idx+1}, Coluna {col_idx+1}"
                    elif 'data' in valor_str and ('início' in valor_str or 'inicio' in valor_str):
                        campos_identificados['data_inicio'] = f"Linha {idx+1}, Coluna {col_idx+1}"
                    elif 'data' in valor_str and 'fim' in valor_str:
                        campos_identificados['data_fim'] = f"Linha {idx+1}, Coluna {col_idx+1}"
                    elif 'horário' in valor_str or 'horario' in valor_str:
                        campos_identificados['horario'] = f"Linha {idx+1}, Coluna {col_idx+1}"
                    elif 'carga' in valor_str and 'horária' in valor_str:
                        campos_identificados['carga_horaria'] = f"Linha {idx+1}, Coluna {col_idx+1}"
                    elif 'estagiário' in valor_str or 'estagiario' in valor_str:
                        campos_identificados['estagiarios'] = f"Linha {idx+1}, Coluna {col_idx+1}"
        
        print("📋 Campos identificados:")
        if campos_identificados:
            for campo, localizacao in campos_identificados.items():
                print(f"   ✅ {campo}: {localizacao}")
        else:
            print("   ⚠️  Nenhum campo padrão identificado automaticamente")
        
        return campos_identificados
    
    except Exception as e:
        print(f"❌ Erro ao identificar campos: {e}")
        return {}

if __name__ == "__main__":
    extrair_dados_detalhados()
    identificar_campos_estagio()