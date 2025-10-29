#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para importar automaticamente todos os dados da Faculdade Guarapuava
"""

import requests
import pandas as pd
import os
from pathlib import Path
import json

class ImportadorAutomatico:
    def __init__(self, base_url="http://127.0.0.1:8001"):
        self.base_url = base_url
        self.token = None
        self.headers = {"Content-Type": "application/json"}
    
    def fazer_login(self, email="admin@estagios.local", senha="Adm@2025!"):
        """Faz login no sistema"""
        try:
            login_data = {"username": email, "password": senha}
            response = requests.post(f"{self.base_url}/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("access_token")
                self.headers["Authorization"] = f"Bearer {self.token}"
                print("✅ Login realizado com sucesso!")
                return True
            else:
                print(f"❌ Erro no login: {response.text}")
                return False
        except Exception as e:
            print(f"❌ Erro na conexão: {e}")
            return False
    
    def importar_supervisores(self):
        """Importa supervisores"""
        arquivo = Path(__file__).parent / "faculdade_guarapuava_supervisores.csv"
        
        if not arquivo.exists():
            print(f"❌ Arquivo não encontrado: {arquivo}")
            return False
        
        print("📋 Importando supervisores...")
        
        try:
            df = pd.read_csv(arquivo)
            supervisores_criados = 0
            
            for _, row in df.iterrows():
                supervisor_data = {
                    "nome": row["nome"],
                    "email": row["email"],
                    "telefone": row["telefone"],
                    "especialidade": row["especialidade"]
                }
                
                response = requests.post(
                    f"{self.base_url}/supervisores",
                    headers=self.headers,
                    json=supervisor_data
                )
                
                if response.status_code == 200:
                    supervisores_criados += 1
                    print(f"   ✅ Supervisor criado: {row['nome']}")
                else:
                    print(f"   ⚠️ Erro ao criar supervisor {row['nome']}: {response.text}")
            
            print(f"✅ {supervisores_criados} supervisores importados!")
            return True
            
        except Exception as e:
            print(f"❌ Erro ao importar supervisores: {e}")
            return False
    
    def importar_cursos(self):
        """Importa cursos"""
        arquivo = Path(__file__).parent / "faculdade_guarapuava_cursos.csv"
        
        if not arquivo.exists():
            print(f"❌ Arquivo não encontrado: {arquivo}")
            return False
        
        print("📚 Importando cursos...")
        
        try:
            df = pd.read_csv(arquivo)
            cursos_criados = 0
            
            for _, row in df.iterrows():
                curso_data = {
                    "nome": row["nome"],
                    "codigo": row["codigo"],
                    "duracao_semestres": int(row["duracao_semestres"])
                }
                
                response = requests.post(
                    f"{self.base_url}/cursos",
                    headers=self.headers,
                    json=curso_data
                )
                
                if response.status_code == 200:
                    cursos_criados += 1
                    print(f"   ✅ Curso criado: {row['nome']}")
                else:
                    print(f"   ⚠️ Erro ao criar curso {row['nome']}: {response.text}")
            
            print(f"✅ {cursos_criados} cursos importados!")
            return True
            
        except Exception as e:
            print(f"❌ Erro ao importar cursos: {e}")
            return False
    
    def importar_unidades(self):
        """Importa unidades"""
        arquivo = Path(__file__).parent / "faculdade_guarapuava_unidades.csv"
        
        if not arquivo.exists():
            print(f"❌ Arquivo não encontrado: {arquivo}")
            return False
        
        print("🏥 Importando unidades...")
        
        try:
            df = pd.read_csv(arquivo)
            unidades_criadas = 0
            
            for _, row in df.iterrows():
                unidade_data = {
                    "nome": row["nome"],
                    "tipo": row["tipo"],
                    "endereco": row["endereco"]
                }
                
                response = requests.post(
                    f"{self.base_url}/unidades",
                    headers=self.headers,
                    json=unidade_data
                )
                
                if response.status_code == 200:
                    unidades_criadas += 1
                    print(f"   ✅ Unidade criada: {row['nome']}")
                else:
                    print(f"   ⚠️ Erro ao criar unidade {row['nome']}: {response.text}")
            
            print(f"✅ {unidades_criadas} unidades importadas!")
            return True
            
        except Exception as e:
            print(f"❌ Erro ao importar unidades: {e}")
            return False
    
    def importar_instituicoes(self):
        """Importa instituições (usando as unidades como base)"""
        print("🏫 Criando instituição Faculdade Guarapuava...")
        
        try:
            instituicao_data = {
                "nome": "Faculdade Guarapuava",
                "endereco": "Guarapuava - PR",
                "contato": "contato@guarapuava.edu.br"
            }
            
            response = requests.post(
                f"{self.base_url}/instituicoes",
                headers=self.headers,
                json=instituicao_data
            )
            
            if response.status_code == 200:
                print("   ✅ Instituição criada: Faculdade Guarapuava")
                return True
            else:
                print(f"   ⚠️ Erro ao criar instituição: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Erro ao importar instituições: {e}")
            return False
    
    def importar_estagios(self):
        """Importa estágios"""
        arquivo = Path(__file__).parent / "faculdade_guarapuava_estagios.csv"
        
        if not arquivo.exists():
            print(f"❌ Arquivo não encontrado: {arquivo}")
            return False
        
        print("📝 Importando estágios...")
        
        # Primeiro, buscar dados auxiliares
        try:
            # Buscar supervisores
            resp_supervisores = requests.get(f"{self.base_url}/supervisores", headers=self.headers)
            supervisores = {s["nome"]: s["id"] for s in resp_supervisores.json()} if resp_supervisores.status_code == 200 else {}
            
            # Buscar cursos
            resp_cursos = requests.get(f"{self.base_url}/cursos", headers=self.headers)
            cursos = {c["nome"]: c["id"] for c in resp_cursos.json()} if resp_cursos.status_code == 200 else {}
            
            # Buscar unidades
            resp_unidades = requests.get(f"{self.base_url}/unidades", headers=self.headers)
            unidades = {u["nome"]: u["id"] for u in resp_unidades.json()} if resp_unidades.status_code == 200 else {}
            
            # Buscar instituições
            resp_instituicoes = requests.get(f"{self.base_url}/instituicoes", headers=self.headers)
            instituicoes = {i["nome"]: i["id"] for i in resp_instituicoes.json()} if resp_instituicoes.status_code == 200 else {}
            
            print(f"📊 Dados auxiliares: {len(supervisores)} supervisores, {len(cursos)} cursos, {len(unidades)} unidades, {len(instituicoes)} instituições")
            
        except Exception as e:
            print(f"❌ Erro ao buscar dados auxiliares: {e}")
            return False
        
        try:
            df = pd.read_csv(arquivo)
            estagios_criados = 0
            
            for _, row in df.iterrows():
                # Mapear IDs
                supervisor_id = None
                if f"Supervisor {row['curso']}" in supervisores:
                    supervisor_id = supervisores[f"Supervisor {row['curso']}"]
                
                curso_id = cursos.get(row["curso"])
                instituicao_id = instituicoes.get("Faculdade Guarapuava")
                
                # Selecionar unidade baseada no curso
                unidade_id = None
                if row["curso"] == "Psicologia":
                    unidade_id = unidades.get("UBS Centro")
                elif row["curso"] == "Odontologia":
                    unidade_id = unidades.get("Clínica Odontológica Universitária")
                elif row["curso"] == "Enfermagem":
                    unidade_id = unidades.get("Hospital Municipal de Guarapuava")
                elif row["curso"] == "Farmácia":
                    unidade_id = unidades.get("Farmácia Escola")
                elif row["curso"] == "Informática Biomédica":
                    unidade_id = unidades.get("Laboratório de Informática Biomédica")
                elif row["curso"] == "Medicina Veterinária":
                    unidade_id = unidades.get("Hospital Veterinário")
                
                estagio_data = {
                    "nome_estagiario": f"Estagiário {row['curso']} 01",
                    "cpf": "000.000.000-00",
                    "email": f"estagiario.{row['curso'].lower().replace(' ', '.')}@estudante.com",
                    "telefone": "(42) 99999-0000",
                    "curso": row["curso"],
                    "disciplina": row["disciplina"],
                    "data_inicio": row["data_inicio"],
                    "data_fim": row["data_fim"],
                    "carga_horaria": int(row["carga_horaria_individual"]),
                    "nivel": row["nivel"],
                    "num_estagiarios": int(row["num_estagiarios_grupo"]),
                    "observacoes": f"Estágio de {row['curso']} - {row['descricao_atividades']}"
                }
                
                # Adicionar IDs se encontrados
                if supervisor_id:
                    estagio_data["supervisor_id"] = supervisor_id
                if curso_id:
                    estagio_data["curso_id"] = curso_id
                if instituicao_id:
                    estagio_data["instituicao_id"] = instituicao_id
                if unidade_id:
                    estagio_data["unidade_id"] = unidade_id
                
                response = requests.post(
                    f"{self.base_url}/estagios",
                    headers=self.headers,
                    json=estagio_data
                )
                
                if response.status_code == 200:
                    estagios_criados += 1
                    print(f"   ✅ Estágio criado: {row['disciplina']}")
                else:
                    print(f"   ⚠️ Erro ao criar estágio {row['disciplina']}: {response.text}")
            
            print(f"✅ {estagios_criados} estágios importados!")
            return True
            
        except Exception as e:
            print(f"❌ Erro ao importar estágios: {e}")
            return False
    
    def executar_importacao_completa(self):
        """Executa a importação completa na ordem correta"""
        print("🚀 INICIANDO IMPORTAÇÃO AUTOMÁTICA")
        print("=" * 50)
        
        # 1. Login
        if not self.fazer_login():
            return False
        
        # 2. Importar na ordem correta
        etapas = [
            ("Supervisores", self.importar_supervisores),
            ("Cursos", self.importar_cursos),
            ("Unidades", self.importar_unidades),
            ("Instituições", self.importar_instituicoes),
            ("Estágios", self.importar_estagios)
        ]
        
        for nome_etapa, funcao_etapa in etapas:
            print(f"\n📋 ETAPA: {nome_etapa}")
            print("-" * 30)
            
            if not funcao_etapa():
                print(f"❌ Falha na etapa: {nome_etapa}")
                return False
        
        print(f"\n🎉 IMPORTAÇÃO CONCLUÍDA COM SUCESSO!")
        print("=" * 50)
        print("✅ Todos os dados da Faculdade Guarapuava foram importados!")
        print("💡 Acesse o sistema em: http://127.0.0.1:8001/app/")
        
        return True

if __name__ == "__main__":
    importador = ImportadorAutomatico()
    importador.executar_importacao_completa()