def auth_token(client):
    r = client.post('/api/v1/auth/login', json={'email': 'admin@estagios.local', 'password': 'admin123'})
    return r.json()['access_token']

def test_criar_listar_estagio_basico(client):
    token = auth_token(client)
    headers = {'Authorization': f'Bearer {token}'}
    payload = {"nome": "Aluno Teste", "email": "aluno.teste@example.com"}
    r_create = client.post('/api/v1/estagios', json=payload, headers=headers)
    assert r_create.status_code == 200, r_create.text
    estagio = r_create.json()
    assert estagio['nome'] == 'Aluno Teste'

    r_list = client.get('/api/v1/estagios', headers=headers)
    assert r_list.status_code == 200
    lista = r_list.json()
    assert any(e['email'] == 'aluno.teste@example.com' for e in lista)
