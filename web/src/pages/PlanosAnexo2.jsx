// Lista de Planos de Atividades (Anexo II)
import React, { useEffect, useState, useRef } from 'react'
import Layout from '../components/Layout'

const API_URL = (import.meta.env && import.meta.env.VITE_API_URL) || ''

export default function PlanosAnexo2() {
  const [user, setUser] = useState(null)
  const [planos, setPlanos] = useState([])
  const [estagios, setEstagios] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [filtroCurso, setFiltroCurso] = useState('')
  const [filtroExercicio, setFiltroExercicio] = useState(new Date().getFullYear().toString())
  const [filtroInstituicao, setFiltroInstituicao] = useState('')
  const [filtroUnidade, setFiltroUnidade] = useState('')
  const [filtroBusca, setFiltroBusca] = useState('')
  const [lastDuration, setLastDuration] = useState(null)
  const [stats, setStats] = useState({ total_planos: 0, total_atividades: 0, instituicoes: 0, unidades: 0 })
  
  // Catálogos para autocomplete
  const [cursos, setCursos] = useState([])
  const [instituicoes, setInstituicoes] = useState([])
  const [unidades, setUnidades] = useState([])
  
  const buscaTimer = useRef(null)

  const authHeaders = () => ({ 'Authorization': `Bearer ${localStorage.getItem('token')}` })

  useEffect(() => { 
    fetchUser()
    fetchCatalogos()
    fetchEstagios()
  }, [])

  useEffect(() => { fetchPlanos() }, [page, pageSize])

  useEffect(() => {
    setPage(1)
    if (buscaTimer.current) clearTimeout(buscaTimer.current)
    buscaTimer.current = setTimeout(() => fetchPlanos(), 400)
    return () => buscaTimer.current && clearTimeout(buscaTimer.current)
  }, [filtroCurso, filtroExercicio, filtroInstituicao, filtroUnidade, filtroBusca])

  const fetchUser = async () => {
    try { 
      const r = await fetch(`${API_URL}/auth/me`, { headers: authHeaders() })
      if (r.ok) setUser(await r.json())
    } catch {}
  }

  const fetchCatalogos = async () => {
    try {
      const [cursosRes, instRes, uniRes] = await Promise.all([
        fetch(`${API_URL}/cursos`, { headers: authHeaders() }),
        fetch(`${API_URL}/instituicoes?somente_ensino=1`, { headers: authHeaders() }),
        fetch(`${API_URL}/unidades`, { headers: authHeaders() })
      ])
      if (cursosRes.ok) setCursos(await cursosRes.json())
      if (instRes.ok) setInstituicoes(await instRes.json())
      if (uniRes.ok) setUnidades(await uniRes.json())
    } catch (e) {
      console.error('Erro ao carregar catálogos:', e)
    }
  }

  const fetchEstagios = async () => {
    try {
      const r = await fetch(`${API_URL}/estagios`, { headers: authHeaders() })
      if (r.ok) setEstagios(await r.json())
    } catch (e) {
      console.error('Erro ao carregar estágios:', e)
    }
  }

  const fetchPlanos = async () => {
    setLoading(true)
    setErro('')
    try {
      const start = performance.now()
      const params = new URLSearchParams()
      params.set('limit', String(pageSize))
      params.set('offset', String((page - 1) * pageSize))
      if (filtroCurso.trim()) params.set('curso', filtroCurso.trim())
      if (filtroExercicio.trim()) params.set('exercicio', filtroExercicio.trim())
      if (filtroInstituicao.trim()) params.set('instituicao', filtroInstituicao.trim())
      
      const r = await fetch(`${API_URL}/planos/search?${params.toString()}`, { headers: authHeaders() })
      if (!r.ok) throw new Error('Falha ao carregar planos')
      
      const data = await r.json()
      let items = data.items || []
      
      // Enriquecer planos com dados de estágios (unidade, supervisor)
      items = items.map(plano => {
        const estagio = estagios.find(e => e.id === plano.estagio_id)
        return {
          ...plano,
          estagio_nome: estagio?.nome || '-',
          unidade_nome: estagio?.unidade?.nome || '-',
          supervisor_nome: estagio?.supervisor?.nome || '-'
        }
      })
      
      // Aplicar filtros de unidade e busca no cliente (já que backend não tem esses filtros ainda)
      if (filtroUnidade.trim()) {
        const busca = filtroUnidade.trim().toLowerCase()
        items = items.filter(p => p.unidade_nome.toLowerCase().includes(busca))
      }
      if (filtroBusca.trim()) {
        const busca = filtroBusca.trim().toLowerCase()
        items = items.filter(p => 
          (p.estagio_nome || '').toLowerCase().includes(busca) ||
          (p.curso || '').toLowerCase().includes(busca) ||
          (p.instituicao_ensino || '').toLowerCase().includes(busca) ||
          (p.unidade_nome || '').toLowerCase().includes(busca) ||
          (p.supervisor_nome || '').toLowerCase().includes(busca)
        )
      }
      
      setPlanos(items)
      setTotal(items.length)
      setLastDuration(Math.round(performance.now() - start))
      
      // Calcular estatísticas
      const totalAtividades = items.reduce((sum, p) => sum + (p.atividades?.length || 0), 0)
      const instituicoesUnicas = new Set(items.map(p => p.instituicao_ensino).filter(Boolean)).size
      const unidadesUnicas = new Set(items.map(p => p.unidade_nome).filter(Boolean)).size
      setStats({
        total_planos: items.length,
        total_atividades: totalAtividades,
        instituicoes: instituicoesUnicas,
        unidades: unidadesUnicas
      })
      
    } catch (e) { 
      setErro('Erro ao carregar planos: ' + e.message)
    } finally { 
      setLoading(false)
    }
  }

  const abrirPDF = async (plano) => {
    try {
      const r = await fetch(`${API_URL}/relatorios/anexo2/${plano.estagio_id}?format=pdf`, { headers: authHeaders() })
      if (!r.ok) {
        const texto = await r.text().catch(()=> '')
        alert('Falha ao gerar PDF: ' + (texto || r.status))
        return
      }
      const blob = await r.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `plano-atividades-estagio-${plano.estagio_id}.pdf`
      a.click(); URL.revokeObjectURL(url)
    } catch(err) {
      alert('Erro de rede ao gerar PDF')
    }
  }

  const exportPagina = () => {
    const headers = ['estagio_id','curso','instituicao_ensino','exercicio','status','versao','num_atividades']
    const linhas = planos.map(p => headers.map(h => h==='num_atividades'? (p.atividades||[]).length : (p[h]||'')).map(v=> v.toString().replace(/;/g, ',')).join(';'))
    const csv = [headers.join(';'), ...linhas].join('\n')
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' })
    const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='planos_pagina.csv'; a.click(); URL.revokeObjectURL(url)
  }

  const exportTudo = async () => {
    const headers = ['estagio_id','curso','instituicao_ensino','exercicio','status','versao','num_atividades']
    let offset=0; const all=[]; const limit=500
    while(true){
      const p = new URLSearchParams(); p.set('limit',String(limit)); p.set('offset',String(offset))
      if (filtroCurso.trim()) p.set('curso', filtroCurso.trim())
      if (filtroExercicio.trim()) p.set('exercicio', filtroExercicio.trim())
      if (filtroInstituicao.trim()) p.set('instituicao', filtroInstituicao.trim())
      const r = await fetch(`${API_URL}/planos/search?${p.toString()}`, { headers: authHeaders() })
      if(!r.ok) break
      const data = await r.json(); (data.items||[]).forEach(p=> all.push(p))
      if (all.length >= (data.total||0) || (data.items||[]).length===0) break
      offset += limit
    }
    const linhas = all.map(p => headers.map(h => h==='num_atividades'? (p.atividades||[]).length : (p[h]||'')).map(v=> v.toString().replace(/;/g, ',')).join(';'))
    const csv = [headers.join(';'), ...linhas].join('\n')
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' })
    const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='planos_todos.csv'; a.click(); URL.revokeObjectURL(url)
  }

  const limparFiltros = () => {
    setFiltroCurso('')
    setFiltroExercicio(new Date().getFullYear().toString())
    setFiltroInstituicao('')
    setFiltroUnidade('')
    setFiltroBusca('')
    setSucesso('Filtros limpos')
    setTimeout(() => setSucesso(''), 2000)
  }

  if (loading && planos.length === 0) return <div className='loading'>Carregando Planos...</div>

  return (
    <Layout user={user}>
      <div className='page-header'>
        <h1>📋 Planos de Atividades (Anexo II)</h1>
        <button className='btn-primary' onClick={() => window.location.href = '/app/anexo2'}>
          ➕ Novo Plano
        </button>
      </div>

      {erro && <div className='alert alert-danger'>{erro}</div>}
      {sucesso && <div className='alert alert-success'>{sucesso}</div>}

      {/* Estatísticas */}
      <div className='dashboard-stats' style={{ marginBottom: '1.5rem' }}>
        <div className='stat-card'>
          <div className='stat-icon'>📋</div>
          <div className='stat-info'>
            <h3>{stats.total_planos}</h3>
            <p>Planos</p>
          </div>
        </div>
        <div className='stat-card'>
          <div className='stat-icon'>✅</div>
          <div className='stat-info'>
            <h3>{stats.total_atividades}</h3>
            <p>Atividades</p>
          </div>
        </div>
        <div className='stat-card'>
          <div className='stat-icon'>🎓</div>
          <div className='stat-info'>
            <h3>{stats.instituicoes}</h3>
            <p>Instituições de Ensino</p>
          </div>
        </div>
        <div className='stat-card'>
          <div className='stat-icon'>🏥</div>
          <div className='stat-info'>
            <h3>{stats.unidades}</h3>
            <p>Unidades de Saúde</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className='vagas-filters' style={{ marginBottom: '1.5rem' }}>
        <h3>🔍 Filtros</h3>
        <div className='filters-grid'>
          <div>
            <label>Busca Geral</label>
            <input
              type='text'
              placeholder='Nome, curso, instituição...'
              value={filtroBusca}
              onChange={e => setFiltroBusca(e.target.value)}
            />
          </div>
          <div>
            <label>Curso</label>
            <input
              type='text'
              list='cursos-list'
              placeholder='Selecione...'
              value={filtroCurso}
              onChange={e => setFiltroCurso(e.target.value)}
            />
            <datalist id='cursos-list'>
              {cursos.map(c => (
                <option key={c.id} value={c.nome} />
              ))}
            </datalist>
          </div>
          <div>
            <label>Instituição de Ensino</label>
            <input
              type='text'
              list='inst-list'
              placeholder='Selecione...'
              value={filtroInstituicao}
              onChange={e => setFiltroInstituicao(e.target.value)}
            />
            <datalist id='inst-list'>
              {instituicoes.map(i => (
                <option key={i.id} value={i.nome} />
              ))}
            </datalist>
          </div>
          <div>
            <label>Unidade de Saúde</label>
            <input
              type='text'
              list='uni-list'
              placeholder='Selecione...'
              value={filtroUnidade}
              onChange={e => setFiltroUnidade(e.target.value)}
            />
            <datalist id='uni-list'>
              {unidades.map(u => (
                <option key={u.id} value={u.nome} />
              ))}
            </datalist>
          </div>
          <div>
            <label>Exercício (Ano)</label>
            <input
              type='text'
              placeholder='2025'
              value={filtroExercicio}
              onChange={e => setFiltroExercicio(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
          <button className='btn-secondary' onClick={limparFiltros}>🔄 Limpar</button>
          <button className='btn-secondary' onClick={fetchPlanos}>♻️ Atualizar</button>
          <button className='btn-secondary' onClick={exportPagina}>💾 CSV Página</button>
          <button className='btn-secondary' onClick={exportTudo}>💾 CSV Completo</button>
        </div>
      </div>

      {/* Tabela */}
      <div className='table-container'>
        {loading && <div className='spinner'>⏳ Carregando...</div>}
        {!loading && lastDuration !== null && (
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>
            ⚡ Carregado em {lastDuration} ms
          </div>
        )}
        <table>
          <thead>
            <tr>
              <th>Estagiário</th>
              <th>Curso</th>
              <th>Instituição Ensino</th>
              <th>Unidade Saúde</th>
              <th>Supervisor</th>
              <th>Exercício</th>
              <th>Status</th>
              <th>Atividades</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {planos.map(p => (
              <tr key={p.id}>
                <td>{p.estagio_nome}</td>
                <td>{p.curso || '-'}</td>
                <td>{p.instituicao_ensino || '-'}</td>
                <td>{p.unidade_nome}</td>
                <td>{p.supervisor_nome}</td>
                <td>{p.exercicio || '-'}</td>
                <td>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.85rem',
                    fontWeight: '500',
                    background: p.status === 'final' ? '#d4edda' : '#fff3cd',
                    color: p.status === 'final' ? '#155724' : '#856404'
                  }}>
                    {p.status === 'final' ? '✓ Final' : '📝 Rascunho'}
                  </span>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <strong>{(p.atividades || []).length}</strong>
                </td>
                <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button
                    className='btn-small btn-info'
                    onClick={() => window.location.href = `/app/anexo2?estagio=${p.estagio_id}`}
                    title='Editar plano'
                  >
                    ✏️ Editar
                  </button>
                  <button
                    className='btn-small btn-secondary'
                    onClick={() => abrirPDF(p)}
                    title='Baixar PDF'
                  >
                    📥 PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {planos.length === 0 && !loading && (
          <div className='empty-state'>
            <p>📭 Nenhum plano encontrado com os filtros aplicados.</p>
            <p>Tente ajustar os filtros ou <button className='btn-primary' onClick={limparFiltros}>limpar tudo</button></p>
          </div>
        )}
        <div className='pagination' style={{ display: 'flex', gap: 12, marginTop: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className='btn-secondary'
          >
            ← Anterior
          </button>
          <span>
            Página <strong>{page}</strong> de <strong>{Math.max(1, Math.ceil(total / pageSize))}</strong>
            {' • '}
            {total} registro(s)
          </span>
          <button
            disabled={(page * pageSize) >= total}
            onClick={() => setPage(p => p + 1)}
            className='btn-secondary'
          >
            Próxima →
          </button>
          <select
            value={pageSize}
            onChange={(e) => { setPage(1); setPageSize(parseInt(e.target.value)) }}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            <option value={10}>10 por página</option>
            <option value={20}>20 por página</option>
            <option value={50}>50 por página</option>
            <option value={100}>100 por página</option>
          </select>
        </div>
      </div>
    </Layout>
  )
}
