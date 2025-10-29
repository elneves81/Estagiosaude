#!/usr/bin/env python3
"""
Script para criar usuários de teste e popular dados iniciais
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app.db import SessionLocal
from app import crud, schemas, models

def create_test_data():
    """Cria dados de teste para demonstrar o sistema"""
    db = SessionLocal()
    try:
        # Criar usuário supervisor se não existir
        supervisor_user = crud.get_user_by_email(db, "supervisor@teste.com")
        if not supervisor_user:
            supervisor_data = schemas.UsuarioCreate(
                email="supervisor@teste.com",
                nome="Dr. Carlos Silva",
                password="supervisor123",
                tipo="supervisor"
            )
            supervisor_user = crud.create_user(db, supervisor_data)
            print("✅ Usuário supervisor criado: supervisor@teste.com / supervisor123")
        
        # Criar usuário escola se não existir
        escola_user = crud.get_user_by_email(db, "escola@teste.com")
        if not escola_user:
            escola_data = schemas.UsuarioCreate(
                email="escola@teste.com",
                nome="Maria Oliveira",
                password="escola123", 
                tipo="escola"
            )
            escola_user = crud.create_user(db, escola_data)
            print("✅ Usuário escola criado: escola@teste.com / escola123")
        
        # Criar alguns supervisores se não existirem
        supervisor_count = db.query(models.Supervisor).count()
        if supervisor_count == 0:
            supervisores_teste = [
                {"nome": "Dr. Carlos Silva", "email": "carlos.silva@hospital.com", "especialidade": "Cardiologia"},
                {"nome": "Dra. Ana Santos", "email": "ana.santos@hospital.com", "especialidade": "Pediatria"},
                {"nome": "Dr. João Ferreira", "email": "joao.ferreira@ubs.com", "especialidade": "Clínica Geral"}
            ]
            
            for sup_data in supervisores_teste:
                supervisor = schemas.SupervisorCreate(**sup_data)
                crud.create_supervisor(db, supervisor)
            
            print(f"✅ {len(supervisores_teste)} supervisores de teste criados")
        
        # Criar alguns estágios de exemplo se não existirem
        estagio_count = db.query(models.Estagio).count()
        if estagio_count == 0:
            estagios_teste = [
                {
                    "nome": "João da Silva",
                    "email": "joao.silva@academico.edu",
                    "telefone": "(11) 99999-1111",
                    "periodo": "2024/2",
                    "disciplina": "Estágio Supervisionado I",
                    "nivel": "Graduação",
                    "num_estagiarios": 1,
                    "supervisor_id": 1,
                    "instituicao_id": 1,
                    "curso_id": 1,
                    "unidade_id": 1
                },
                {
                    "nome": "Maria Fernandes",
                    "email": "maria.fernandes@academico.edu",
                    "telefone": "(11) 99999-2222", 
                    "periodo": "2024/2",
                    "disciplina": "Estágio Supervisionado II",
                    "nivel": "Graduação",
                    "num_estagiarios": 1,
                    "supervisor_id": 2,
                    "instituicao_id": 2,
                    "curso_id": 2,
                    "unidade_id": 2
                }
            ]
            
            for est_data in estagios_teste:
                estagio = schemas.EstagioCreate(**est_data)
                crud.create_estagio(db, estagio)
            
            print(f"✅ {len(estagios_teste)} estágios de exemplo criados")
        
        print("\n🎉 Sistema populado com dados de teste!")
        print("\nUsuários disponíveis:")
        print("👨‍💼 Admin: admin@estagios.local / Adm@2025!")
        print("👩‍⚕️ Supervisor: supervisor@teste.com / supervisor123")
        print("🏫 Escola: escola@teste.com / escola123")
        
    except Exception as e:
        print(f"❌ Erro ao criar dados de teste: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_data()