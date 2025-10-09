import sqlite3
import os
import sys

def apply_migration():
    """Aplica a migração SQL no banco de dados"""
    try:
        # Caminho para o banco de dados
        db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'estagios.db')
        
        # Caminho para o arquivo de migração
        migration_path = os.path.join(os.path.dirname(__file__), 'migrate.sql')
        
        # Verificar se o arquivo de migração existe
        if not os.path.exists(migration_path):
            print(f"❌ Arquivo de migração não encontrado: {migration_path}")
            return False
            
        # Ler o arquivo de migração
        with open(migration_path, 'r', encoding='utf-8') as f:
            migration_sql = f.read()
        
        # Conectar ao banco e executar a migração
        with sqlite3.connect(db_path) as conn:
            conn.executescript(migration_sql)
            conn.commit()
            
        print(f"✅ Migração aplicada com sucesso!")
        print(f"📁 Banco: {db_path}")
        return True
        
    except Exception as e:
        print(f"❌ Erro ao aplicar migração: {e}")
        return False

if __name__ == "__main__":
    success = apply_migration()
    sys.exit(0 if success else 1)