import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const API_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) || process.env.VITE_API_URL || 'http://localhost:8001'

function Dashboard() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [maintDryRun, setMaintDryRun] = useState(true)
  const [maintLog, setMaintLog] = useState('')
  const [maintRunning, setMaintRunning] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    fetchUserInfo(token)
  }, [navigate])

  // Load persisted dry-run preference on first render
  useEffect(() => {
    const saved = localStorage.getItem('maintDryRun')
    if (saved !== null) {
      try { setMaintDryRun(JSON.parse(saved)) } catch {}
    }
  }, [])

  // Persist dry-run preference on change
  useEffect(() => {
    try { localStorage.setItem('maintDryRun', JSON.stringify(maintDryRun)) } catch {}
  }, [maintDryRun])

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

  const runMaintenance = async (action) => {
    const token = localStorage.getItem('token')
    if (!token) {
      alert('Sessão expirada. Faça login novamente.')
      navigate('/login')
      return
    }

    setMaintRunning(true)
    setMaintLog(`Executando ação "${action}" com dry-run=${maintDryRun} ...\n`)
    try {
      const resp = await fetch(`${API_URL}/maintenance/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ action, dry_run: maintDryRun })
      })

      if (!resp.ok) {
        let detail = ''
        try { const err = await resp.json(); detail = err.detail || JSON.stringify(err) } catch {}
        throw new Error(detail || `Falha HTTP ${resp.status}`)
      }

      const data = await resp.json()
      setMaintLog(data.log || '— sem saída —')
    } catch (e) {
      setMaintLog(`Erro ao executar manutenção: ${e?.message || e}`)
    } finally {
      setMaintRunning(false)
    }
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

          {user?.tipo === 'admin' && (
            <div className="card" style={{ gridColumn: '1 / -1' }}>
              <h3>Manutenção (Admin)</h3>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" checked={maintDryRun} onChange={e=> setMaintDryRun(e.target.checked)} /> Dry-run
                </label>
                <button disabled={maintRunning} onClick={()=> runMaintenance('unidades_sem_cnes')} className="btn-primary">{maintRunning ? 'Executando...' : 'Remover Unidades sem CNES'}</button>
                <button disabled={maintRunning} onClick={()=> runMaintenance('unidades_cnes_dup')} className="btn-secondary">Deduplicar Unidades por CNES</button>
                <button disabled={maintRunning} onClick={()=> runMaintenance('cursos_dup')} className="btn-secondary">Deduplicar Cursos por Nome</button>
                <button disabled={maintRunning} onClick={()=> runMaintenance('instituicoes_dup')} className="btn-secondary">Deduplicar Instituições por Nome</button>
              </div>
              <pre style={{ marginTop: 12, maxHeight: 300, overflow: 'auto', background: '#111', color: '#0f0', padding: 12, borderRadius: 6 }}>
{maintLog || '— saída aparecerá aqui —'}
              </pre>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default Dashboard