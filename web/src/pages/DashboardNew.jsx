import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'

const API_URL = (import.meta.env && import.meta.env.VITE_API_URL) || ''

function Dashboard() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ 
    estagios: 0, 
    supervisores: 0, 
    instituicoes: 0, 
    cursos: 0, 
    unidades: 0, 
    vagas_total: 0 
  })
  const [topUnidades, setTopUnidades] = useState([])
  const [topSupervisores, setTopSupervisores] = useState([])
  const [recentPlans, setRecentPlans] = useState([])
  const [exercicio, setExercicio] = useState('')
  const [topN, setTopN] = useState(5)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }
    fetchUserInfo(token)
    fetchStats()
    fetchRecentPlans()
  }, [navigate])

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  })

  const fetchUserInfo = async (token) => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        setUser(await response.json())
      } else {
        localStorage.removeItem('token')
        localStorage.removeItem('userType')
        navigate('/login')
      }
    } catch (err) {
      console.error('Erro ao buscar dados do usuário:', err)
      localStorage.removeItem('token')
      navigate('/login')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const qs = new URLSearchParams()
      if (exercicio) qs.set('exercicio', exercicio)
      if (topN) qs.set('top', String(topN))
      const res = await fetch(`${API_URL}/dashboard/metrics?${qs.toString()}`, { headers: getAuthHeaders() })
      if (res.ok) {
        const data = await res.json()
        setStats({
          estagios: data.counts?.estagios || 0,
          supervisores: data.counts?.supervisores || 0,
          instituicoes: data.counts?.instituicoes || 0,
          cursos: data.counts?.cursos || 0,
          unidades: data.counts?.unidades || 0,
          vagas_total: data.vagas_total || 0,
        })
        setTopUnidades(data.top_unidades || [])
        setTopSupervisores(data.top_supervisores || [])
      }
    } catch (err) {
      console.error('Erro ao buscar estatísticas:', err)
    }
  }

  const fetchRecentPlans = async () => {
    try {
      const url = `${API_URL}/planos/search?limit=5&offset=0`
      const res = await fetch(url, { headers: getAuthHeaders() })
      if (res.ok) {
        const data = await res.json()
        setRecentPlans(data.items || [])
      }
    } catch (e) {
      console.error('Erro ao buscar planos recentes:', e)
    }
  }

  if (loading) {
    return <div className="loading">Carregando...</div>
  }

  return (
    <Layout user={user}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '1rem' }}>
        
        {/* Cabeçalho com boas-vindas */}
        <div style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
          color: 'white', 
          padding: '2rem', 
          borderRadius: 12, 
          marginBottom: '1.5rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 700 }}>
            👋 Olá, {user?.nome}!
          </h1>
          <p style={{ margin: '0.5rem 0 0', opacity: 0.95, fontSize: '1.1rem' }}>
            Bem-vindo ao Sistema de Gestão de Estágios • <strong>{user?.tipo}</strong>
          </p>
        </div>

        {/* Filtros rápidos */}
        <div style={{ 
          background: '#fff', 
          padding: '1rem', 
          borderRadius: 8, 
          boxShadow: '0 2px 6px rgba(0,0,0,0.08)', 
          marginBottom: '1.5rem',
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <input 
            placeholder="Filtrar por exercício (ex: 2025)" 
            value={exercicio} 
            onChange={e=>setExercicio(e.target.value)} 
            style={{ flex: '1 1 200px', padding: 8, border: '1px solid #ddd', borderRadius: 6 }}
          />
          <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            Top:
            <input 
              type="number" 
              min={1} 
              max={20} 
              style={{ width: 60, padding: 8, border: '1px solid #ddd', borderRadius: 6 }} 
              value={topN} 
              onChange={e=>setTopN(parseInt(e.target.value||'5',10))} 
            />
          </label>
          <button 
            className="btn-primary" 
            onClick={fetchStats}
            style={{ 
              background: '#667eea', 
              border: 'none', 
              padding: '10px 20px', 
              borderRadius: 6, 
              color: 'white', 
              fontWeight: 600, 
              cursor: 'pointer' 
            }}
          >
            🔄 Atualizar
          </button>
        </div>

        {/* Cards de Métricas Principais */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem', 
          marginBottom: '1.5rem' 
        }}>
          <MetricCard icon="📋" value={stats.estagios} label="Estágios" color="#667eea" onClick={() => navigate('/estagios')} />
          <MetricCard icon="👨‍💼" value={stats.supervisores} label="Supervisores" color="#f093fb" onClick={() => navigate('/supervisores')} />
          <MetricCard icon="🏥" value={stats.unidades} label="Unidades" color="#4facfe" onClick={() => navigate('/unidades')} />
          <MetricCard icon="🎓" value={stats.instituicoes} label="Instituições" color="#43e97b" onClick={() => navigate('/instituicoes')} />
          <MetricCard icon="📚" value={stats.cursos} label="Cursos" color="#fa709a" onClick={() => navigate('/cursos')} />
          <MetricCard icon="🎯" value={stats.vagas_total} label="Vagas (Anexo II)" color="#ffb347" onClick={() => navigate('/vagas')} />
        </div>

        {/* Ações Rápidas */}
        <div style={{ 
          background: '#fff', 
          padding: '1.5rem', 
          borderRadius: 8, 
          boxShadow: '0 2px 6px rgba(0,0,0,0.08)', 
          marginBottom: '1.5rem' 
        }}>
          <h2 style={{ 
            margin: '0 0 1rem', 
            fontSize: '1.3rem', 
            fontWeight: 600, 
            color: '#333',
            borderBottom: '2px solid #667eea',
            paddingBottom: 8
          }}>⚡ Ações Rápidas</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <ActionCard icon="📝" title="Novo Plano" desc="Criar Plano de Atividades" onClick={() => navigate('/anexo2')} color="#667eea" />
            <ActionCard icon="🎯" title="Nova Vaga" desc="Cadastrar nova vaga" onClick={() => navigate('/vagas')} color="#f093fb" />
            <ActionCard icon="📥" title="Importar Excel" desc="Importação de atividades" onClick={() => navigate('/importacao')} color="#4facfe" />
            <ActionCard icon="📄" title="Relatórios" desc="Gerar relatórios PDF" onClick={() => navigate('/relatorios')} color="#43e97b" />
            <ActionCard icon="🧩" title="Clone em Massa" desc="Clonar planos" onClick={() => navigate('/planos-anexo2')} color="#fa709a" />
            <ActionCard icon="📊" title="Dashboard Vagas" desc="Visão geral de vagas" onClick={() => navigate('/vagas')} color="#ffb347" />
          </div>
        </div>

        {/* Grade de Conteúdo */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
          
          {/* Planos Recentes */}
          <ContentCard title="📋 Planos Recentes" icon="📋">
            {recentPlans.length === 0 ? (
              <p style={{ color: '#999', textAlign: 'center', padding: '1rem' }}>Nenhum plano encontrado.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                      <th style={{ padding: 8, textAlign: 'left' }}>Instituição</th>
                      <th style={{ padding: 8, textAlign: 'left' }}>Curso</th>
                      <th style={{ padding: 8, textAlign: 'center' }}>Exercício</th>
                      <th style={{ padding: 8, textAlign: 'center' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPlans.map((p) => (
                      <tr key={p.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: 8 }}>{p.instituicao_ensino || '-'}</td>
                        <td style={{ padding: 8 }}>{p.curso || '-'}</td>
                        <td style={{ padding: 8, textAlign: 'center' }}>{p.exercicio || '-'}</td>
                        <td style={{ padding: 8, textAlign: 'center' }}>
                          <button 
                            onClick={() => navigate(`/plano-atividades/${p.estagio_id}`)}
                            style={{ 
                              background: '#667eea', 
                              color: 'white', 
                              border: 'none', 
                              padding: '4px 12px', 
                              borderRadius: 4, 
                              cursor: 'pointer', 
                              fontSize: '0.85rem' 
                            }}
                          >
                            Ver
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
              <button 
                onClick={() => navigate('/planos-anexo2')} 
                style={{ 
                  background: '#f8f9fa', 
                  border: '1px solid #dee2e6', 
                  padding: '8px 16px', 
                  borderRadius: 6, 
                  cursor: 'pointer', 
                  fontWeight: 600 
                }}
              >
                Ver todos os planos →
              </button>
            </div>
          </ContentCard>

          {/* Top Unidades */}
          <ContentCard title="🏥 Top Unidades por Vagas" icon="🏥">
            {topUnidades.length === 0 ? <p style={{ color: '#999', textAlign: 'center' }}>Nenhum dado disponível</p> : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {topUnidades.map((u, i) => (
                  <li 
                    key={i} 
                    style={{ 
                      padding: '10px', 
                      borderBottom: '1px solid #f0f0f0', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center' 
                    }}
                  >
                    <button 
                      onClick={() => navigate(`/vagas?unidade=${encodeURIComponent(u.chave)}`)}
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: '#667eea', 
                        cursor: 'pointer', 
                        fontSize: '1rem', 
                        fontWeight: 600, 
                        textAlign: 'left' 
                      }}
                    >
                      {i + 1}. {u.chave}
                    </button>
                    <span style={{ 
                      background: '#667eea', 
                      color: 'white', 
                      padding: '4px 12px', 
                      borderRadius: 12, 
                      fontSize: '0.9rem', 
                      fontWeight: 600 
                    }}>
                      {u.vagas} vagas
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </ContentCard>

          {/* Top Supervisores */}
          <ContentCard title="👨‍⚕️ Top Supervisores por Vagas" icon="👨‍⚕️">
            {topSupervisores.length === 0 ? <p style={{ color: '#999', textAlign: 'center' }}>Nenhum dado disponível</p> : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {topSupervisores.map((s, i) => (
                  <li 
                    key={i} 
                    style={{ 
                      padding: '10px', 
                      borderBottom: '1px solid #f0f0f0', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center' 
                    }}
                  >
                    <button 
                      onClick={() => navigate(`/vagas?supervisor=${encodeURIComponent(s.chave)}`)}
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: '#f093fb', 
                        cursor: 'pointer', 
                        fontSize: '1rem', 
                        fontWeight: 600, 
                        textAlign: 'left' 
                      }}
                    >
                      {i + 1}. {s.chave}
                    </button>
                    <span style={{ 
                      background: '#f093fb', 
                      color: 'white', 
                      padding: '4px 12px', 
                      borderRadius: 12, 
                      fontSize: '0.9rem', 
                      fontWeight: 600 
                    }}>
                      {s.vagas} vagas
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </ContentCard>

          {/* Módulos do Sistema */}
          <ContentCard title="🎛️ Módulos do Sistema" icon="🎛️">
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <ModuleLink icon="📋" label="Estágios" desc="Gerenciar estágios" onClick={() => navigate('/estagios')} />
              <ModuleLink icon="👨‍💼" label="Supervisores" desc="Cadastro de supervisores" onClick={() => navigate('/supervisores')} />
              <ModuleLink icon="🏥" label="Unidades" desc="Unidades de saúde (CNES)" onClick={() => navigate('/unidades')} />
              <ModuleLink icon="🎓" label="Instituições" desc="Instituições de ensino" onClick={() => navigate('/instituicoes')} />
              <ModuleLink icon="📚" label="Cursos" desc="Cursos disponíveis" onClick={() => navigate('/cursos')} />
              <ModuleLink icon="📝" label="Planos Anexo II" desc="Planos de atividades" onClick={() => navigate('/planos-anexo2')} />
              <ModuleLink icon="🎯" label="Vagas" desc="Gestão de vagas" onClick={() => navigate('/vagas')} />
              <ModuleLink icon="📄" label="Relatórios" desc="Relatórios e exportações" onClick={() => navigate('/relatorios')} />
            </div>
          </ContentCard>

        </div>
      </div>
    </Layout>
  )
}

// Componente auxiliar: Card de Métrica
function MetricCard({ icon, value, label, color, onClick }) {
  return (
    <div 
      onClick={onClick}
      style={{ 
        background: 'white', 
        padding: '1.5rem', 
        borderRadius: 8, 
        boxShadow: '0 2px 6px rgba(0,0,0,0.08)', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '1rem',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        borderLeft: `4px solid ${color}`
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.08)'
      }}
    >
      <div style={{ fontSize: '2.5rem' }}>{icon}</div>
      <div>
        <h3 style={{ margin: 0, fontSize: '2rem', fontWeight: 700, color: '#333' }}>{value}</h3>
        <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>{label}</p>
      </div>
    </div>
  )
}

// Componente auxiliar: Card de Ação Rápida
function ActionCard({ icon, title, desc, onClick, color }) {
  return (
    <div 
      onClick={onClick}
      style={{ 
        background: 'white', 
        padding: '1rem', 
        borderRadius: 8, 
        boxShadow: '0 2px 6px rgba(0,0,0,0.08)', 
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        borderTop: `3px solid ${color}`,
        textAlign: 'center'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.08)'
      }}
    >
      <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{icon}</div>
      <h4 style={{ margin: '0 0 0.25rem', fontSize: '1rem', fontWeight: 600, color: '#333' }}>{title}</h4>
      <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>{desc}</p>
    </div>
  )
}

// Componente auxiliar: Card de Conteúdo
function ContentCard({ title, icon, children }) {
  return (
    <div style={{ 
      background: '#fff', 
      padding: '1.5rem', 
      borderRadius: 8, 
      boxShadow: '0 2px 6px rgba(0,0,0,0.08)' 
    }}>
      <h2 style={{ 
        margin: '0 0 1rem', 
        fontSize: '1.2rem', 
        fontWeight: 600, 
        color: '#333',
        borderBottom: '2px solid #667eea',
        paddingBottom: 8,
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }}>
        <span>{icon}</span> {title}
      </h2>
      {children}
    </div>
  )
}

// Componente auxiliar: Link de Módulo
function ModuleLink({ icon, label, desc, onClick }) {
  return (
    <button 
      onClick={onClick}
      style={{ 
        background: '#f8f9fa', 
        border: '1px solid #dee2e6', 
        padding: '0.75rem', 
        borderRadius: 6, 
        cursor: 'pointer',
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        transition: 'all 0.2s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = '#e9ecef'
        e.currentTarget.style.borderColor = '#adb5bd'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = '#f8f9fa'
        e.currentTarget.style.borderColor = '#dee2e6'
      }}
    >
      <span style={{ fontSize: '1.5rem' }}>{icon}</span>
      <div>
        <div style={{ fontWeight: 600, color: '#333', fontSize: '0.95rem' }}>{label}</div>
        <div style={{ fontSize: '0.8rem', color: '#666' }}>{desc}</div>
      </div>
    </button>
  )
}

export default Dashboard
