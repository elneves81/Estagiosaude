#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para analisar e importar dados do arquivo Excel da Faculdade Guarapuava
"""

import pandas as pd
import os
from pathlib import Path

def analisar_excel():
    """Analisa o arquivo Excel e mostra sua estrutura"""
    
    arquivo_excel = Path(__file__).parent / "FACULDADE GUARAPUAVA (2).xlsx"
    
    if not arquivo_excel.exists():
        print(f"❌ Arquivo não encontrado: {arquivo_excel}")
        return
    
    print(f"📊 Analisando arquivo: {arquivo_excel.name}")
    print("=" * 60)
    
    try:
        # Ler o arquivo Excel
        xl_file = pd.ExcelFile(arquivo_excel)
        
        # Mostrar todas as abas
        print(f"📋 Abas encontradas: {len(xl_file.sheet_names)}")
        for i, sheet_name in enumerate(xl_file.sheet_names, 1):
            print(f"  {i}. {sheet_name}")
        
        print("\n" + "=" * 60)
        
        # Analisar cada aba
        for sheet_name in xl_file.sheet_names:
            print(f"\n📄 ANÁLISE DA ABA: '{sheet_name}'")
            print("-" * 40)
            
            # Ler a aba
            df = pd.read_excel(arquivo_excel, sheet_name=sheet_name)
            
            print(f"   📏 Dimensões: {df.shape[0]} linhas × {df.shape[1]} colunas")
            
            if len(df.columns) > 0:
                print("   📋 Colunas encontradas:")
                for i, col in enumerate(df.columns, 1):
                    # Contar valores não-nulos
                    valores_nao_nulos = df[col].count()
                    exemplo = df[col].dropna().iloc[0] if valores_nao_nulos > 0 else "Vazio"
                    print(f"      {i:2d}. '{col}' - {valores_nao_nulos} valores - Ex: {str(exemplo)[:50]}")
                
                # Mostrar algumas linhas de exemplo (apenas colunas com dados)
                colunas_com_dados = [col for col in df.columns if df[col].count() > 0]
                if colunas_com_dados and len(df) > 0:
                    print(f"\n   📝 Primeiras linhas (colunas com dados):")
                    df_sample = df[colunas_com_dados].head(3)
                    
                    for idx, row in df_sample.iterrows():
                        print(f"      Linha {idx + 1}:")
                        for col in colunas_com_dados[:5]:  # Mostrar no máximo 5 colunas
                            valor = row[col]
                            if pd.notna(valor):
                                print(f"        {col}: {str(valor)[:60]}")
                        print()
            else:
                print("   ⚠️ Nenhuma coluna encontrada")
    
    except Exception as e:
        print(f"❌ Erro ao analisar arquivo: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    analisar_excel()