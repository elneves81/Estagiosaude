#!/usr/bin/env python3
"""
Script para atualizar a senha do usuário administrador
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app.db import SessionLocal
from app import crud, schemas, auth, models

def update_admin_password():
    """Atualiza a senha do usuário administrador"""
    db = SessionLocal()
    try:
        # Buscar admin
        admin = db.query(models.Usuario).filter_by(email="admin@estagios.local").first()
        if not admin:
            print("❌ Usuário admin não encontrado")
            return
        
        # Atualizar senha
        new_password = "Adm@2025!"
        admin.hashed_password = auth.get_password_hash(new_password)
        db.commit()
        
        print("✅ Senha do admin atualizada com sucesso!")
        print("📧 Email: admin@estagios.local")
        print("🔑 Nova senha: Adm@2025!")
        
        # Testar a nova senha
        test = auth.verify_password(new_password, admin.hashed_password)
        print(f"🧪 Teste da senha: {'✅ OK' if test else '❌ FALHOU'}")
        
    except Exception as e:
        print(f"❌ Erro ao atualizar senha: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    update_admin_password()