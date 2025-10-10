import os, sys, tempfile
import pytest
from fastapi.testclient import TestClient

# Ajustar caminho para import da app
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
APP_DIR = os.path.join(BASE_DIR, 'app')
if APP_DIR not in sys.path:
    sys.path.append(APP_DIR)

from app.main import app  # noqa

@pytest.fixture(scope="session")
def client(tmp_path_factory):
    # Usa banco isolado (arquivo temporário)
    tmp_dir = tmp_path_factory.mktemp("data")
    db_path = os.path.join(BASE_DIR, 'estagios.db')
    if os.path.exists(db_path):
        os.remove(db_path)
    yield TestClient(app)
