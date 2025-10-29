// Página de relatórios avançados
import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import Modal from '../components/Modal'

const API_URL = (import.meta.env && import.meta.env.VITE_API_URL) || ''

function Relatorios() {
  const [user, setUser] = useState(null)
  const [dados, setDados] = useState({
    estagios: [],
    supervisores: [],
    cursos: [],
    unidades: [],
    instituicoes: []
  })
  const [vagasFiltros, setVagasFiltros] = useState({
    q: '',
    unidade: '',
    supervisor: '',
    dia: '',
    exercicio: new Date().getFullYear().toString()
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [resumo, setResumo] = useState(null)
  const [showResumo, setShowResumo] = useState(false)
  const [groupBy, setGroupBy] = useState('unidade')
  const [stats, setStats] = useState({ estagios: 0, supervisores: 0, instituicoes: 0, cursos: 0, unidades: 0, vagas_total: 0 })
  const [vagasData, setVagasData] = useState({ items: [], total: 0, total_vagas: 0 })

  // Desestrutura dados para uso direto no JSX e nas funções de geração
  const { estagios, supervisores, cursos, unidades, instituicoes } = dados

  useEffect(() => {
    fetchUserInfo()
    fetchDados()
    fetchStats()
    fetchVagas()
  }, [])

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  })

  const fetchUserInfo = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: getAuthHeaders()
      })
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      }
    } catch (err) {
      console.error('Erro ao buscar dados do usuário:', err)
    }
  }

  const fetchDados = async () => {
    setLoading(true)
    try {
      // Buscar todos os dados necessários para os relatórios
      const [estagiosRes, supervisoresRes, cursosRes, unidadesRes, instituicoesRes] = await Promise.all([
        fetch(`${API_URL}/estagios`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/supervisores`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/cursos`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/unidades`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/instituicoes`, { headers: getAuthHeaders() })
      ])

      const [estagios, supervisores, cursos, unidades, instituicoes] = await Promise.all([
        estagiosRes.ok ? estagiosRes.json() : [],
        supervisoresRes.ok ? supervisoresRes.json() : [],
        cursosRes.ok ? cursosRes.json() : [],
        unidadesRes.ok ? unidadesRes.json() : [],
        instituicoesRes.ok ? instituicoesRes.json() : []
      ])

      setDados({ estagios, supervisores, cursos, unidades, instituicoes })
    } catch (err) {
      setError('Erro ao carregar dados para relatórios')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/dashboard/metrics?exercicio=${vagasFiltros.exercicio}&top=5`, { headers: getAuthHeaders() })
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
      }
    } catch (err) {
      console.error('Erro ao buscar estatísticas:', err)
    }
  }

  const fetchVagas = async () => {
    try {
      const qs = buildQuery({ ...vagasFiltros, limit: 100, offset: 0 })
      const res = await fetch(`${API_URL}/vagas?${qs}`, { headers: getAuthHeaders() })
      if (res.ok) {
        const data = await res.json()
        setVagasData(data)
      }
    } catch (err) {
      console.error('Erro ao buscar vagas:', err)
    }
  }

  const buildQuery = (params) => {
    const usp = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && String(v).trim() !== '') usp.append(k, v)
    })
    return usp.toString()
  }

  const carregarResumoVagas = async () => {
    try {
      setError('')
      const qs = buildQuery({ ...vagasFiltros, group_by: groupBy, top: 50 })
      const res = await fetch(`${API_URL}/vagas/resumo?${qs}`, { headers: getAuthHeaders() })
      if (!res.ok) throw new Error('Falha ao carregar resumo')
      const data = await res.json()
      setResumo(data)
      setShowResumo(true)
    } catch (e) {
      setError('Erro ao carregar resumo de vagas')
    }
  }

  const baixarCsvVagas = async () => {
    try {
      setError('')
      const qs = buildQuery(vagasFiltros)
      const res = await fetch(`${API_URL}/vagas/csv?${qs}`, { headers: getAuthHeaders() })
      if (!res.ok) throw new Error('Falha ao gerar CSV')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'vagas.csv'
      a.click()
      window.URL.revokeObjectURL(url)
      setSuccess('CSV gerado com sucesso!')
    } catch (e) {
      setError('Erro ao gerar CSV de vagas')
    }
  }

  const gerarAnexo2 = async (estagioId, format = 'html') => {
    try {
      const response = await fetch(`${API_URL}/relatorios/anexo2/${estagioId}?format=${format}`, {
        headers: getAuthHeaders()
      })

      if (response.ok) {
        if (format === 'pdf') {
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `plano-atividades-estagio-${estagioId}.pdf`
          a.click()
          window.URL.revokeObjectURL(url)
        } else {
          const html = await response.text()
          const newWindow = window.open()
          newWindow.document.write(html)
          newWindow.document.close()
        }
        setSuccess('Relatório gerado com sucesso!')
      } else {
        setError('Erro ao gerar relatório')
      }
    } catch (err) {
      setError('Erro de conexão')
    }
  }

  const gerarRelatorioGeral = () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Relatório Geral de Estágios</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 30px; background: #f5f5f5; }
          .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #667eea; padding-bottom: 20px; }
          .header h1 { color: #333; margin: 0 0 10px 0; }
          .header p { color: #666; font-size: 1rem; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px 8px; text-align: left; }
          th { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-weight: 600; }
          tbody tr:nth-child(even) { background-color: #f9f9f9; }
          tbody tr:hover { background-color: #f0f0ff; }
          .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin: 20px 0 30px 0; }
          .stat-box { text-align: center; padding: 20px 15px; border: 2px solid #667eea; border-radius: 8px; background: #f8f9ff; }
          .stat-box h3 { margin: 0; font-size: 2rem; color: #667eea; }
          .stat-box p { margin: 5px 0 0 0; color: #555; font-size: 0.9rem; }
          @media print { body { background: white; } .container { box-shadow: none; } }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Relatório Geral de Estágios</h1>
            <p>Gerado em: ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
          </div>
          
          <div class="stats">
            <div class="stat-box">
              <h3>${stats.estagios}</h3>
              <p>Estágios</p>
            </div>
            <div class="stat-box">
              <h3>${stats.instituicoes}</h3>
              <p>Instituições</p>
            </div>
            <div class="stat-box">
              <h3>${stats.cursos}</h3>
              <p>Cursos</p>
            </div>
            <div class="stat-box">
              <h3>${stats.supervisores}</h3>
              <p>Supervisores</p>
            </div>
            <div class="stat-box">
              <h3>${stats.unidades}</h3>
              <p>Unidades</p>
            </div>
            <div class="stat-box">
              <h3>${stats.vagas_total}</h3>
              <p>Vagas</p>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Curso</th>
                <th>Instituição</th>
                <th>Supervisor</th>
                <th>Período</th>
              </tr>
            </thead>
            <tbody>
              ${estagios.map(estagio => `
                <tr>
                  <td>${estagio.nome || 'N/A'}</td>
                  <td>${estagio.email || 'N/A'}</td>
                  <td>${estagio.curso?.nome || 'N/A'}</td>
                  <td>${estagio.instituicao?.nome || 'N/A'}</td>
                  <td>${estagio.supervisor?.nome || 'N/A'}</td>
                  <td>${estagio.periodo || 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </body>
      </html>
    `

    const newWindow = window.open()
    if (newWindow && newWindow.document) {
      newWindow.document.write(html)
      newWindow.document.close()
    } else {
      // Fallback: abre em mesma aba
      document.open()
      document.write(html)
      document.close()
    }
  }

  if (loading) return <div className="loading">Carregando relatórios...</div>

  return (
    <Layout user={user}>
      <div className="page-header">
        <h1>Relatórios</h1>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Seção: Vagas e Resumos */}
      <div className="vagas-filters" style={{ marginBottom: '1.5rem' }}>
        <h3>Vagas e Resumos</h3>
        <div className="filters-grid">
          <div>
            <label>Busca</label>
            <input
              type="text"
              value={vagasFiltros.q}
              placeholder="Unidade, disciplina, dia..."
              onChange={e => setVagasFiltros({ ...vagasFiltros, q: e.target.value })}
            />
          </div>
          <div>
            <label>Unidade</label>
            <input
              type="text"
              list="unidades-list"
              value={vagasFiltros.unidade}
              onChange={e => setVagasFiltros({ ...vagasFiltros, unidade: e.target.value })}
            />
            <datalist id="unidades-list">
              {dados.unidades.map(u => (
                <option key={u.id} value={u.nome} />
              ))}
            </datalist>
          </div>
          <div>
            <label>Supervisor</label>
            <input
              type="text"
              list="supervisores-list"
              value={vagasFiltros.supervisor}
              onChange={e => setVagasFiltros({ ...vagasFiltros, supervisor: e.target.value })}
            />
            <datalist id="supervisores-list">
              {dados.supervisores.map(s => (
                <option key={s.id} value={s.nome} />
              ))}
            </datalist>
          </div>
          <div>
            <label>Dia</label>
            <input
              type="text"
              placeholder="Segunda, Terça..."
              value={vagasFiltros.dia}
              onChange={e => setVagasFiltros({ ...vagasFiltros, dia: e.target.value })}
            />
          </div>
          <div>
            <label>Exercício</label>
            <input
              type="text"
              placeholder="2025"
              value={vagasFiltros.exercicio}
              onChange={e => setVagasFiltros({ ...vagasFiltros, exercicio: e.target.value })}
            />
          </div>
          <div>
            <label>Agrupar por</label>
            <select value={groupBy} onChange={e => setGroupBy(e.target.value)}>
              <option value="unidade">Unidade</option>
              <option value="supervisor">Supervisor</option>
              <option value="disciplina">Disciplina</option>
              <option value="dia">Dia da semana</option>
              <option value="unidade_dia">Unidade + Dia</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
          <button className="btn-primary" onClick={carregarResumoVagas}>Carregar Resumo</button>
          <button className="btn-secondary" onClick={baixarCsvVagas}>Baixar CSV</button>
        </div>
      </div>

      {/* Estatísticas do Sistema */}
      <div className="dashboard-stats" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-info">
            <h3>{stats.estagios}</h3>
            <p>Estágios</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏢</div>
          <div className="stat-info">
            <h3>{stats.instituicoes}</h3>
            <p>Instituições</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎓</div>
          <div className="stat-info">
            <h3>{stats.cursos}</h3>
            <p>Cursos</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👨‍⚕️</div>
          <div className="stat-info">
            <h3>{stats.supervisores}</h3>
            <p>Supervisores</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏥</div>
          <div className="stat-info">
            <h3>{stats.unidades}</h3>
            <p>Unidades</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-info">
            <h3>{stats.vagas_total}</h3>
            <p>Vagas Totais</p>
          </div>
        </div>
      </div>

      <div className="reports-container">
        <div className="report-section">
          <h3>📊 Relatórios Gerais</h3>
          <div className="report-cards">
            <div className="report-card">
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📄</div>
              <h4>Relatório Geral de Estágios</h4>
              <p>Visão geral de todos os estágios cadastrados com estatísticas consolidadas.</p>
              <button 
                className="btn-primary"
                onClick={gerarRelatorioGeral}
                style={{ marginTop: '1rem' }}
              >
                📊 Gerar Relatório
              </button>
            </div>

            <div className="report-card">
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📈</div>
              <h4>Resumo de Vagas</h4>
              <p>Agregação de vagas por unidade, supervisor, disciplina ou dia da semana.</p>
              <button 
                className="btn-primary"
                onClick={carregarResumoVagas}
                style={{ marginTop: '1rem' }}
              >
                📊 Ver Resumo
              </button>
            </div>

            <div className="report-card">
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💾</div>
              <h4>Exportar Vagas (CSV)</h4>
              <p>Baixe todas as vagas aplicando filtros em formato CSV para análise externa.</p>
              <button 
                className="btn-secondary"
                onClick={baixarCsvVagas}
                style={{ marginTop: '1rem' }}
              >
                💾 Baixar CSV
              </button>
            </div>
          </div>
        </div>

        <div className="report-section">
          <h3>📑 Relatórios Individuais (Plano de Atividades - Anexo II)</h3>
          <p>Gere o Plano de Atividades (Anexo II) para cada estágio individual:</p>
          
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Curso</th>
                  <th>Instituição</th>
                  <th>Período</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {estagios.map((estagio) => (
                  <tr key={estagio.id}>
                    <td>{estagio.nome}</td>
                    <td>{estagio.curso?.nome || 'N/A'}</td>
                    <td>{estagio.instituicao?.nome || 'N/A'}</td>
                    <td>{estagio.periodo || 'N/A'}</td>
                    <td style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button 
                        className="btn-small btn-info"
                        onClick={() => gerarAnexo2(estagio.id, 'html')}
                        title="Visualizar no navegador"
                      >
                        👁️ HTML
                      </button>
                      <button 
                        className="btn-small btn-primary"
                        onClick={() => gerarAnexo2(estagio.id, 'pdf')}
                        title="Baixar como PDF"
                      >
                        📥 PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {estagios.length === 0 && (
              <div className="empty-state">
                <p>📭 Nenhum estágio disponível para relatórios.</p>
                <p>Cadastre estágios primeiro para gerar relatórios individuais.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Resumo de Vagas */}
      <Modal isOpen={showResumo} onClose={() => setShowResumo(false)} title={`Resumo de Vagas (${groupBy})`} size="large">
        {!resumo ? (
          <div>Carregando...</div>
        ) : (
          <div>
            <div style={{ marginBottom: '0.75rem', color: '#555' }}>
              Total grupos: {resumo.total_grupos} | Total de vagas: {resumo.total_vagas}
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Chave</th>
                    <th>Atividades</th>
                    <th>Vagas</th>
                  </tr>
                </thead>
                <tbody>
                  {resumo.items.map((r, i) => (
                    <tr key={`${r.chave}-${i}`}>
                      <td>{r.chave}</td>
                      <td>{r.atividades}</td>
                      <td>{r.vagas}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {resumo.items.length === 0 && (
                <div className="empty-state" style={{ marginTop: '0.75rem' }}>
                  Nenhum resultado encontrado com os filtros atuais.
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  )
}

export default Relatorios