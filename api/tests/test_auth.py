def test_login_admin(client):
    resp = client.post('/api/v1/auth/login', json={'email': 'admin@estagios.local', 'password': 'admin123'})
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert 'access_token' in data
    assert data['user_type'] == 'admin'

def test_login_invalido(client):
    resp = client.post('/api/v1/auth/login', json={'email': 'naoexiste@x.com', 'password': 'errado'})
    assert resp.status_code == 401
