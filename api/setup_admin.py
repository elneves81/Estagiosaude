#!/usr/bin/env python3
"""
Script para criar o usuário administrador padrão
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app.db import SessionLocal
from app import crud, schemas

def setup_admin():
    """Cria o usuário administrador padrão se não existir"""
    db = SessionLocal()
    try:
        # Verificar se admin já existe
        admin = crud.get_user_by_email(db, "admin@estagios.local")
        if admin:
            print("✅ Usuário admin já existe")
            return
        
        # Criar admin
        admin_data = schemas.UsuarioCreate(
            email="admin@estagios.local",
            nome="Administrador",
            password="admin123",
            tipo="admin"
        )
        
        admin = crud.create_user(db, admin_data)
        print("✅ Usuário admin criado com sucesso!")
        print("📧 Email: admin@estagios.local")
        print("🔑 Senha: admin123")
        
    except Exception as e:
        print(f"❌ Erro ao criar admin: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    setup_admin()