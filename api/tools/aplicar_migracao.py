#!/usr/bin/env python3
"""
Script para aplicar migração de compatibilidade com Excel
"""
import sqlite3
import sys
import os
from pathlib import Path

def aplicar_migracao(db_path="estagios.db"):
    """Aplica a migração para compatibilidade com Excel"""
    
    if not os.path.exists(db_path):
        print(f"❌ Banco de dados não encontrado: {db_path}")
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("🚀 Aplicando migração de compatibilidade com Excel...")
        
        # Verificar se as colunas já existem
        cursor.execute("PRAGMA table_info(estagios)")
        colunas_estagios = [row[1] for row in cursor.fetchall()]
        
        cursor.execute("PRAGMA table_info(supervisores)")
        colunas_supervisores = [row[1] for row in cursor.fetchall()]
        
        # Aplicar alterações na tabela estagios
        if 'dias_semana' not in colunas_estagios:
            cursor.execute("ALTER TABLE estagios ADD COLUMN dias_semana TEXT")
            print("✅ Campo 'dias_semana' adicionado à tabela estagios")
        else:
            print("⚠️ Campo 'dias_semana' já existe na tabela estagios")
        
        if 'quantidade_grupos' not in colunas_estagios:
            cursor.execute("ALTER TABLE estagios ADD COLUMN quantidade_grupos INTEGER DEFAULT 1")
            print("✅ Campo 'quantidade_grupos' adicionado à tabela estagios")
        else:
            print("⚠️ Campo 'quantidade_grupos' já existe na tabela estagios")
        
        # Aplicar alterações na tabela supervisores
        if 'numero_conselho' not in colunas_supervisores:
            cursor.execute("ALTER TABLE supervisores ADD COLUMN numero_conselho TEXT")
            print("✅ Campo 'numero_conselho' adicionado à tabela supervisores")
        else:
            print("⚠️ Campo 'numero_conselho' já existe na tabela supervisores")
        
        # Commit das alterações
        conn.commit()
        conn.close()
        
        print("🎉 Migração aplicada com sucesso!")
        return True
        
    except Exception as e:
        print(f"❌ Erro ao aplicar migração: {e}")
        return False

if __name__ == "__main__":
    db_path = "estagios.db"
    
    # Verificar se foi passado caminho do banco como argumento
    if len(sys.argv) > 1:
        db_path = sys.argv[1]
    
    # Procurar banco na estrutura do projeto
    possible_paths = [
        db_path,
        f"../estagios.db",
        f"../../estagios.db"
    ]
    
    banco_encontrado = None
    for path in possible_paths:
        if os.path.exists(path):
            banco_encontrado = path
            break
    
    if banco_encontrado:
        print(f"📊 Banco encontrado: {banco_encontrado}")
        sucesso = aplicar_migracao(banco_encontrado)
        
        if sucesso:
            print("✅ Migração concluída!")
        else:
            print("❌ Falha na migração!")
            sys.exit(1)
    else:
        print("❌ Banco de dados não encontrado!")
        print("💡 Execute este script no diretório que contém o arquivo estagios.db")
        sys.exit(1)