#!/usr/bin/env python3
"""Script para verificar conteúdo do banco de dados"""

import sqlite3
import sys
import os

# Ajustar o caminho do banco
db_path = os.path.join(os.path.dirname(__file__), 'estagios.db')

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("=" * 60)
    print("ANÁLISE DO BANCO DE DADOS - ESTAGIOSEL")
    print("=" * 60)
    print(f"\n📁 Banco: {db_path}\n")
    
    # Listar todas as tabelas
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    tables = [row[0] for row in cursor.fetchall()]
    
    print("📊 TABELAS E REGISTROS:\n")
    print("-" * 60)
    
    total_records = 0
    table_info = []
    
    for table in tables:
        if table == 'sqlite_sequence':
            continue
            
        cursor.execute(f"SELECT COUNT(*) FROM {table}")
        count = cursor.fetchone()[0]
        total_records += count
        table_info.append((table, count))
        
        # Emoji baseado no tipo de tabela
        emoji = "👥" if table == "usuarios" else \
                "👨‍⚕️" if table == "supervisores" else \
                "📝" if table == "estagios" else \
                "🏥" if table == "unidades" else \
                "🎓" if table == "instituicoes_ensino" else \
                "📚" if table == "cursos" else \
                "📋" if "plano" in table.lower() else \
                "🔧" if table == "config_financeiro" else \
                "📊"
        
        print(f"{emoji} {table:<30} {count:>6} registros")
    
    print("-" * 60)
    print(f"\n✅ TOTAL: {len(table_info)} tabelas com {total_records} registros\n")
    
    # Informações específicas importantes
    print("=" * 60)
    print("DETALHES IMPORTANTES:")
    print("=" * 60)
    
    # Usuários
    cursor.execute("SELECT tipo, COUNT(*) FROM usuarios GROUP BY tipo")
    users_by_type = cursor.fetchall()
    if users_by_type:
        print("\n👥 USUÁRIOS POR TIPO:")
        for tipo, count in users_by_type:
            print(f"   - {tipo}: {count}")
    
    # Supervisores
    cursor.execute("SELECT COUNT(*) FROM supervisores")
    supervisores_count = cursor.fetchone()[0]
    if supervisores_count > 0:
        print(f"\n👨‍⚕️ SUPERVISORES CADASTRADOS: {supervisores_count}")
        cursor.execute("SELECT nome, especialidade FROM supervisores LIMIT 3")
        for nome, esp in cursor.fetchall():
            print(f"   - {nome} ({esp})")
        if supervisores_count > 3:
            print(f"   ... e mais {supervisores_count - 3}")
    
    # Estágios
    cursor.execute("SELECT COUNT(*) FROM estagios")
    estagios_count = cursor.fetchone()[0]
    if estagios_count > 0:
        print(f"\n📝 ESTÁGIOS CADASTRADOS: {estagios_count}")
        cursor.execute("SELECT status, COUNT(*) FROM estagios GROUP BY status")
        for status, count in cursor.fetchall():
            print(f"   - {status}: {count}")
    
    # Unidades
    cursor.execute("SELECT COUNT(*) FROM unidades")
    unidades_count = cursor.fetchone()[0]
    if unidades_count > 0:
        print(f"\n🏥 UNIDADES DE SAÚDE: {unidades_count}")
        cursor.execute("SELECT nome FROM unidades LIMIT 3")
        for (nome,) in cursor.fetchall():
            print(f"   - {nome}")
        if unidades_count > 3:
            print(f"   ... e mais {unidades_count - 3}")
    
    # Instituições
    cursor.execute("SELECT COUNT(*) FROM instituicoes_ensino")
    inst_count = cursor.fetchone()[0]
    if inst_count > 0:
        print(f"\n🎓 INSTITUIÇÕES DE ENSINO: {inst_count}")
        cursor.execute("SELECT nome FROM instituicoes_ensino LIMIT 3")
        for (nome,) in cursor.fetchall():
            print(f"   - {nome}")
        if inst_count > 3:
            print(f"   ... e mais {inst_count - 3}")
    
    # Cursos
    cursor.execute("SELECT COUNT(*) FROM cursos")
    cursos_count = cursor.fetchone()[0]
    if cursos_count > 0:
        print(f"\n📚 CURSOS CADASTRADOS: {cursos_count}")
        cursor.execute("SELECT nome FROM cursos LIMIT 5")
        for (nome,) in cursor.fetchall():
            print(f"   - {nome}")
        if cursos_count > 5:
            print(f"   ... e mais {cursos_count - 5}")
    
    # Planos de atividades
    if "planos_atividades" in tables:
        cursor.execute("SELECT COUNT(*) FROM planos_atividades")
        planos_count = cursor.fetchone()[0]
        if planos_count > 0:
            print(f"\n📋 PLANOS DE ATIVIDADES: {planos_count}")
    
    print("\n" + "=" * 60)
    print("✅ BANCO DE DADOS VERIFICADO COM SUCESSO!")
    print("=" * 60)
    
    conn.close()
    
except Exception as e:
    print(f"\n❌ ERRO ao acessar banco: {e}")
    sys.exit(1)
