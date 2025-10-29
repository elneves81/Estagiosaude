#!/usr/bin/env python3
"""
Gerar token de autenticação para scripts de importação
"""

import sys
import os
import requests
import json

def gerar_token(api_url: str, email: str, password: str):
    """Gera token via login"""
    try:
        login_data = {"email": email, "password": password}
        resp = requests.post(f"{api_url}/auth/login", json=login_data)
        
        if resp.ok:
            data = resp.json()
            token = data.get("access_token")
            
            if token:
                # Salvar token em arquivo
                token_file = os.path.join(os.path.dirname(__file__), ".token")
                with open(token_file, "w") as f:
                    f.write(token)
                
                print(f"✅ Token gerado e salvo em .token")
                print(f"🔑 Token: {token[:50]}...")
                return token
            else:
                print("❌ Token não encontrado na resposta")
                return None
        else:
            print(f"❌ Erro de login: {resp.status_code}")
            try:
                error_detail = resp.json().get("detail", resp.text)
                print(f"   Detalhes: {error_detail}")
            except:
                print(f"   Resposta: {resp.text}")
            return None
    
    except Exception as e:
        print(f"❌ Erro de conexão: {e}")
        return None

def main():
    # Credenciais padrão (ajustar conforme necessário)
    api_url = "http://localhost:8001"
    email = "admin@example.com"
    password = "admin123"
    
    if len(sys.argv) > 1:
        email = sys.argv[1]
    if len(sys.argv) > 2:
        password = sys.argv[2]
    if len(sys.argv) > 3:
        api_url = sys.argv[3]
    
    print(f"🔐 Gerando token para {email} em {api_url}")
    
    token = gerar_token(api_url, email, password)
    
    if token:
        print(f"🎉 Token gerado com sucesso!")
        return 0
    else:
        print(f"❌ Falha ao gerar token")
        return 1

if __name__ == "__main__":
    sys.exit(main())