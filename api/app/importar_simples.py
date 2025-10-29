#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script simplificado para importar dados da Faculdade Guarapuava
"""

import requests
import pandas as pd
import os
from pathlib import Path
import json
import time
from typing import Optional, Dict, Any

SESSION = requests.Session()
DEFAULT_TIMEOUT = 10

def request_with_retry(method: str, url: str, *, headers: Optional[Dict[str, str]] = None, json: Optional[Dict[str, Any]] = None, retries: int = 5, backoff: float = 0.8):
    """Efetua uma requisição HTTP com tentativas e backoff exponencial simples."""
    last_err = None
    for attempt in range(1, retries + 1):
        try:
            resp = SESSION.request(method=method.upper(), url=url, headers=headers, json=json, timeout=DEFAULT_TIMEOUT)
            return resp
        except (requests.exceptions.ConnectionError, requests.exceptions.ChunkedEncodingError, requests.exceptions.ReadTimeout) as e:
            last_err = e
            wait = backoff * attempt
            print(f"  ⚠️ Falha na conexão (tentativa {attempt}/{retries}): {e}. Aguardando {wait:.1f}s...")
            time.sleep(wait)
        except Exception as e:
            last_err = e
            print(f"  ❌ Erro inesperado na requisição: {e}")
            break
    raise last_err

def importar_dados_faculdade():
    """Importa todos os dados da faculdade"""
    
    base_url = "http://127.0.0.1:8001"
    
    print("INICIANDO IMPORTACAO AUTOMATICA")
    print("=" * 50)
    
    # 1. Login
    print("Fazendo login...")
    # API espera 'email' e 'password'
    login_data = {"email": "admin@estagios.local", "password": "Adm@2025!"}
    response = request_with_retry("post", f"{base_url}/auth/login", json=login_data)
    
    if response.status_code != 200:
        print(f"ERRO no login ({response.status_code}): {response.text}")
        return False
    
    token = response.json().get("access_token")
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }
    print("Login realizado com sucesso!")
    
    # 2. Importar supervisores
    print("\nImportando supervisores...")
    supervisores = [
        {'nome': 'Dr. João Silva', 'email': 'joao.silva@guarapuava.edu.br', 'especialidade': 'Psicologia Clínica', 'telefone': '(42) 99999-0001'},
        {'nome': 'Dra. Maria Santos', 'email': 'maria.santos@guarapuva.edu.br', 'especialidade': 'Odontologia', 'telefone': '(42) 99999-0002'},
        {'nome': 'Enf. Ana Costa', 'email': 'ana.costa@guarapuava.edu.br', 'especialidade': 'Enfermagem', 'telefone': '(42) 99999-0003'},
        {'nome': 'Farm. Carlos Lima', 'email': 'carlos.lima@guarapuava.edu.br', 'especialidade': 'Farmácia Clínica', 'telefone': '(42) 99999-0004'},
        {'nome': 'Prof. Pedro Tech', 'email': 'pedro.tech@guarapuava.edu.br', 'especialidade': 'Informática Biomédica', 'telefone': '(42) 99999-0005'},
        {'nome': 'Dr. Vet. Lucia Animal', 'email': 'lucia.animal@guarapuava.edu.br', 'especialidade': 'Medicina Veterinária', 'telefone': '(42) 99999-0006'}
    ]
    
    for supervisor in supervisores:
        response = request_with_retry("post", f"{base_url}/supervisores", headers=headers, json=supervisor)
        if response.status_code == 200:
            print(f"  Supervisor criado: {supervisor['nome']}")
        else:
            print(f"  Erro ao criar supervisor {supervisor['nome']}: {response.text}")
    
    # 3. Importar cursos
    print("\nImportando cursos...")
    cursos = [
        {'nome': 'Psicologia', 'codigo': 'PSI', 'duracao_semestres': 10},
        {'nome': 'Odontologia', 'codigo': 'ODO', 'duracao_semestres': 10},
        {'nome': 'Enfermagem', 'codigo': 'ENF', 'duracao_semestres': 8},
        {'nome': 'Farmácia', 'codigo': 'FAR', 'duracao_semestres': 8},
        {'nome': 'Informática Biomédica', 'codigo': 'INF', 'duracao_semestres': 8},
        {'nome': 'Medicina Veterinária', 'codigo': 'VET', 'duracao_semestres': 10}
    ]
    
    for curso in cursos:
        response = request_with_retry("post", f"{base_url}/cursos", headers=headers, json=curso)
        if response.status_code == 200:
            print(f"  Curso criado: {curso['nome']}")
        else:
            print(f"  Erro ao criar curso {curso['nome']}: {response.text}")
    
    # 4. Importar unidades
    print("\nImportando unidades...")
    unidades = [
        {'nome': 'Hospital Municipal de Guarapuava', 'tipo': 'Hospital', 'endereco': 'Rua das Flores, 123 - Guarapuava/PR'},
        {'nome': 'UBS Centro', 'tipo': 'Unidade Básica de Saúde', 'endereco': 'Av. Principal, 456 - Guarapuava/PR'},
        {'nome': 'Clínica Odontológica Universitária', 'tipo': 'Clínica', 'endereco': 'Campus Universitário - Guarapuava/PR'},
        {'nome': 'Farmácia Escola', 'tipo': 'Farmácia', 'endereco': 'Campus Universitário - Guarapuava/PR'},
        {'nome': 'Laboratório de Informática Biomédica', 'tipo': 'Laboratório', 'endereco': 'Campus Universitário - Guarapuava/PR'},
        {'nome': 'Hospital Veterinário', 'tipo': 'Hospital Veterinário', 'endereco': 'Campus Universitário - Guarapuava/PR'}
    ]
    
    for unidade in unidades:
        response = request_with_retry("post", f"{base_url}/unidades", headers=headers, json=unidade)
        if response.status_code == 200:
            print(f"  Unidade criada: {unidade['nome']}")
        else:
            print(f"  Erro ao criar unidade {unidade['nome']}: {response.text}")
    
    # 5. Importar instituição
    print("\nCriando instituição...")
    instituicao = {
        "nome": "Faculdade Guarapuava",
        "endereco": "Guarapuava - PR", 
        "contato": "contato@guarapuava.edu.br"
    }
    
    response = request_with_retry("post", f"{base_url}/instituicoes", headers=headers, json=instituicao)
    if response.status_code == 200:
        print(f"  Instituição criada: {instituicao['nome']}")
    else:
        print(f"  Erro ao criar instituição: {response.text}")
    
    # 6. Buscar IDs para criar estágios
    print("\nBuscando dados para criar estágios...")
    try:
        resp_supervisores = request_with_retry("get", f"{base_url}/supervisores", headers=headers)
        supervisores_dict = {s["nome"]: s["id"] for s in resp_supervisores.json()} if resp_supervisores.status_code == 200 else {}

        resp_cursos = request_with_retry("get", f"{base_url}/cursos", headers=headers)
        cursos_dict = {c["nome"]: c["id"] for c in resp_cursos.json()} if resp_cursos.status_code == 200 else {}

        resp_unidades = request_with_retry("get", f"{base_url}/unidades", headers=headers)
        unidades_dict = {u["nome"]: u["id"] for u in resp_unidades.json()} if resp_unidades.status_code == 200 else {}

        resp_instituicoes = request_with_retry("get", f"{base_url}/instituicoes", headers=headers)
        instituicoes_dict = {i["nome"]: i["id"] for i in resp_instituicoes.json()} if resp_instituicoes.status_code == 200 else {}

        print(f"  IDs encontrados: {len(supervisores_dict)} supervisores, {len(cursos_dict)} cursos")
        
    except Exception as e:
        print(f"  Erro ao buscar IDs: {e}")
        return False
    
    # 7. Importar estágios
    print("\nImportando estágios...")
    cursos_nomes = ['Psicologia', 'Odontologia', 'Enfermagem', 'Farmácia', 'Informática Biomédica', 'Medicina Veterinária']
    
    mapeamento_unidades = {
        "Psicologia": "UBS Centro",
        "Odontologia": "Clínica Odontológica Universitária", 
        "Enfermagem": "Hospital Municipal de Guarapuava",
        "Farmácia": "Farmácia Escola",
        "Informática Biomédica": "Laboratório de Informática Biomédica",
        "Medicina Veterinária": "Hospital Veterinário"
    }
    
    mapeamento_supervisores = {
        "Psicologia": "Dr. João Silva",
        "Odontologia": "Dra. Maria Santos",
        "Enfermagem": "Enf. Ana Costa", 
        "Farmácia": "Farm. Carlos Lima",
        "Informática Biomédica": "Prof. Pedro Tech",
        "Medicina Veterinária": "Dr. Vet. Lucia Animal"
    }
    
    for curso_nome in cursos_nomes:
        supervisor_nome = mapeamento_supervisores.get(curso_nome)
        unidade_nome = mapeamento_unidades.get(curso_nome)
        
        estagio_data = {
            "nome_estagiario": f"Estagiário {curso_nome} 01",
            "cpf": "000.000.000-00",
            "email": f"estagiario.{curso_nome.lower().replace(' ', '.')}@estudante.com",
            "telefone": "(42) 99999-0000",
            "curso": curso_nome,
            "disciplina": f"Estágio {curso_nome}",
            "data_inicio": "2023-01-01", 
            "data_fim": "2023-12-31",
            "carga_horaria": 400,
            "nivel": "Graduação",
            "num_estagiarios": 5,
            "observacoes": f"Estágio de {curso_nome} - Atividades práticas supervisionadas"
        }
        
        # Adicionar IDs se encontrados
        if supervisor_nome and supervisor_nome in supervisores_dict:
            estagio_data["supervisor_id"] = supervisores_dict[supervisor_nome]
        
        if curso_nome in cursos_dict:
            estagio_data["curso_id"] = cursos_dict[curso_nome]
            
        if "Faculdade Guarapuava" in instituicoes_dict:
            estagio_data["instituicao_id"] = instituicoes_dict["Faculdade Guarapuava"]
            
        if unidade_nome and unidade_nome in unidades_dict:
            estagio_data["unidade_id"] = unidades_dict[unidade_nome]

        response = request_with_retry("post", f"{base_url}/estagios", headers=headers, json=estagio_data)
        if response.status_code == 200:
            print(f"  Estágio criado: {estagio_data['disciplina']}")
        else:
            print(f"  Erro ao criar estágio {estagio_data['disciplina']}: {response.text}")
    
    print(f"\nIMPORTACAO CONCLUIDA COM SUCESSO!")
    print("Todos os dados da Faculdade Guarapuava foram importados!")
    print("Acesse o sistema em: http://127.0.0.1:8001/app/")
    
    return True

if __name__ == "__main__":
    importar_dados_faculdade()