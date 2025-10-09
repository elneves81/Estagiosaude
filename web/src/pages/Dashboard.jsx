import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const API_URL = process.env.VITE_API_URL || 'http://localhost:8001'

function Dashboard() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    fetchUserInfo(token)
  }, [navigate])

  const fetchUserInfo = async (token) => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      } else {
        localStorage.removeItem('token')
        localStorage.removeItem('userType')
        navigate('/login')
      }
    } catch (err) {
      console.error('Erro ao buscar dados do usuário:', err)
      localStorage.removeItem('token')
      localStorage.removeItem('userType')
      navigate('/login')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userType')
    navigate('/login')
  }

  if (loading) {
    return <div className="loading">Carregando...</div>
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Sistema de Estágios</h1>
        <div className="user-info">
          <span>Olá, {user?.nome} ({user?.tipo})</span>
          <button onClick={handleLogout}>Sair</button>
        </div>
      </header>

      <main className="dashboard-content">
        <div className="dashboard-cards">
          <div className="card">
            <h3>API Status</h3>
            <p>Backend conectado em {API_URL}</p>
          </div>
          
          <div className="card">
            <h3>Bem-vindo!</h3>
            <p>Sistema funcionando corretamente.</p>
            <p>Você está logado como: <strong>{user?.tipo}</strong></p>
          </div>
          
          <div className="card">
            <h3>Próximos passos</h3>
            <ul>
              <li>Adicionar páginas de gestão</li>
              <li>Implementar cadastros</li>
              <li>Criar relatórios</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Dashboard