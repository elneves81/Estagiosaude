import asyncio
from app.main import app
from app import auth
import httpx

async def check():
    token = auth.create_access_token({"sub": "admin@estagios.local", "tipo": "admin"})
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        r = await client.get("/planos/search?limit=5&offset=0&exercicio=2025", headers={"Authorization": f"Bearer {token}"})
        print(r.status_code)
        try:
            print(r.json())
        except Exception as e:
            print("Non-JSON response:", r.text)

if __name__ == "__main__":
    asyncio.run(check())
