// Página de gestão de estágios
import React, { useState, useEffect, useRef } from 'react'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
import { DISCIPLINAS_EXPANDIDAS } from '../constants/disciplinas'

const API_URL = (import.meta.env && import.meta.env.VITE_API_URL) || ''

function Estagios() {
  const [user, setUser] = useState(null)
  const [estagios, setEstagios] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [sortField, setSortField] = useState('')
  const [sortDir, setSortDir] = useState('asc')
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState({ instituicao_id: '', curso_id: '', unidade_id: '', supervisor_id: '' })
  const [supervisores, setSupervisores] = useState([])
  const [instituicoes, setInstituicoes] = useState([])
  const [cursos, setCursos] = useState([])
  const [unidades, setUnidades] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastDuration, setLastDuration] = useState(null)
  const [dataSource, setDataSource] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [viewItem, setViewItem] = useState(null)
  const [editItem, setEditItem] = useState(null)
  const [deleteItem, setDeleteItem] = useState(null)
  
  // Stat cards
  const [stats, setStats] = useState({
    total_estagios: 0,
    total_instituicoes: 0,
    total_cursos: 0,
    total_supervisores: 0,
    total_unidades: 0,
    total_vagas: 0
  })
  
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    periodo: '',
    supervisor_id: '',
    instituicao_id: '',
    curso_id: '',
    unidade_id: '',
    disciplina: '',
    nivel: '',
  carga_horaria: '',
    salario: '',
    num_estagiarios: '',
    observacoes: ''
  })

  useEffect(() => {
    // Carregar preferências
    try {
      const raw = localStorage.getItem('prefs.estagios')
      if (raw) {
        const prefs = JSON.parse(raw)
        if (prefs.pageSize && [10,20,50,100].includes(prefs.pageSize)) setPageSize(prefs.pageSize)
        if (prefs.sortField) setSortField(prefs.sortField)
        if (prefs.sortDir && ['asc','desc'].includes(prefs.sortDir)) setSortDir(prefs.sortDir)
      }
    } catch {}
    fetchUserInfo()
  }, [])

  // Primeira carga com prefs
  useEffect(() => { fetchData() /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [pageSize, sortField, sortDir])

  const buscaTimer = useRef(null)

  useEffect(() => { fetchData() }, [page])

  useEffect(() => {
    setPage(1)
    if (buscaTimer.current) clearTimeout(buscaTimer.current)
    buscaTimer.current = setTimeout(() => { fetchData() }, 450)
    return () => buscaTimer.current && clearTimeout(buscaTimer.current)
  }, [busca, filtro])

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

  const fetchData = async () => {
    try {
      setError('') // Limpar erro anterior
      const params = new URLSearchParams()
      params.set('limit', String(pageSize))
      params.set('offset', String((page-1) * pageSize))
      if (busca.trim().length >= 2) params.set('q', busca.trim())
      if (filtro.instituicao_id) params.set('instituicao_id', filtro.instituicao_id)
      if (filtro.curso_id) params.set('curso_id', filtro.curso_id)
      if (filtro.unidade_id) params.set('unidade_id', filtro.unidade_id)
      if (filtro.supervisor_id) params.set('supervisor_id', filtro.supervisor_id)

      if (sortField) params.set('sort', `${sortField}:${sortDir}`)
      const start = performance.now()
      const [estagiosRes, supervisoresRes, instituicoesRes, cursosRes, unidadesRes, vagasRes] = await Promise.all([
        fetch(`${API_URL}/estagios/search?${params.toString()}`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/supervisores`, { headers: getAuthHeaders() }),
        // Listar apenas instituições de ensino previamente cadastradas (com oferta de cursos)
        fetch(`${API_URL}/instituicoes?somente_ensino=1`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/cursos`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/unidades`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/vagas?limit=1`, { headers: getAuthHeaders() })
      ])

      if (estagiosRes.ok) {
        const data = await estagiosRes.json()
        setEstagios(data.items || [])
        setTotal(data.total || 0)
        setDataSource(data.source || '')
        setStats(prev => ({ ...prev, total_estagios: data.total || 0 }))
      } else {
        console.error('Erro ao buscar estágios:', await estagiosRes.text())
        throw new Error(`Erro ao buscar estágios: ${estagiosRes.status}`)
      }
      
      if (supervisoresRes.ok) {
        const supervisoresData = await supervisoresRes.json()
        setSupervisores(supervisoresData)
        setStats(prev => ({ ...prev, total_supervisores: supervisoresData.length }))
      }
      if (instituicoesRes.ok) {
        const instituicoesData = await instituicoesRes.json()
        setInstituicoes(instituicoesData)
        setStats(prev => ({ ...prev, total_instituicoes: instituicoesData.length }))
      }
      if (cursosRes.ok) {
        const cursosData = await cursosRes.json()
        setCursos(cursosData)
        setStats(prev => ({ ...prev, total_cursos: cursosData.length }))
      }
      if (unidadesRes.ok) {
        const unidadesData = await unidadesRes.json()
        setUnidades(unidadesData)
        setStats(prev => ({ ...prev, total_unidades: unidadesData.length }))
      }
      if (vagasRes.ok) {
        const vagasData = await vagasRes.json()
        setStats(prev => ({ ...prev, total_vagas: vagasData.total || 0 }))
      }
      
      setLastDuration(Math.round(performance.now() - start))
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
      setError(`Erro ao carregar dados: ${err.message || 'Verifique se o backend está rodando'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Converter strings vazias para null nos campos numéricos
    const dataToSend = {
      ...formData,
      supervisor_id: formData.supervisor_id ? parseInt(formData.supervisor_id) : null,
      instituicao_id: formData.instituicao_id ? parseInt(formData.instituicao_id) : null,
      curso_id: formData.curso_id ? parseInt(formData.curso_id) : null,
      unidade_id: formData.unidade_id ? parseInt(formData.unidade_id) : null,
  carga_horaria: formData.carga_horaria ? parseInt(formData.carga_horaria, 10) : null,
      salario: formData.salario || null,
      num_estagiarios: formData.num_estagiarios ? parseInt(formData.num_estagiarios) : null,
    }

    try {
      const response = await fetch(`${API_URL}/estagios`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(dataToSend)
      })

      if (response.ok) {
        setSuccess('Estágio criado com sucesso!')
        setShowForm(false)
        setFormData({
          nome: '', email: '', telefone: '', periodo: '', supervisor_id: '',
          instituicao_id: '', curso_id: '', unidade_id: '', disciplina: '',
          nivel: '', carga_horaria: '', salario: '', num_estagiarios: '', observacoes: ''
        })
        fetchData()
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'Erro ao criar estágio')
      }
    } catch (err) {
      setError('Erro de conexão')
    }
  }

  const handleDelete = async (id) => {
    // If using modal, confirm separately

    try {
      const response = await fetch(`${API_URL}/estagios/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })

      if (response.ok) {
        setSuccess('Estágio removido com sucesso!')
        fetchData()
      } else {
        setError('Erro ao remover estágio')
      }
    } catch (err) {
      setError('Erro de conexão')
    }
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!editItem) return
    setError('')
    setSuccess('')
    const payload = {
      nome: editItem.nome || '',
      email: editItem.email || '',
      telefone: editItem.telefone || null,
      periodo: editItem.periodo || null,
      supervisor_id: editItem.supervisor_id ? parseInt(editItem.supervisor_id) : null,
      instituicao_id: editItem.instituicao_id ? parseInt(editItem.instituicao_id) : null,
      curso_id: editItem.curso_id ? parseInt(editItem.curso_id) : null,
      unidade_id: editItem.unidade_id ? parseInt(editItem.unidade_id) : null,
  disciplina: editItem.disciplina || null,
  carga_horaria: editItem.carga_horaria ? parseInt(editItem.carga_horaria, 10) : null,
  salario: editItem.salario || null,
      nivel: editItem.nivel || null,
      num_estagiarios: editItem.num_estagiarios ? parseInt(editItem.num_estagiarios) : null,
      observacoes: editItem.observacoes || null,
    }
    try {
      const res = await fetch(`${API_URL}/estagios/${editItem.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const data = await res.json().catch(()=>({}))
        throw new Error(data.detail || `Erro ${res.status}`)
      }
      setSuccess('Estágio atualizado com sucesso!')
      setEditItem(null)
      fetchData()
    } catch (err) {
      setError(err.message || 'Erro ao atualizar estágio')
    }
  }

  // Persistir prefs
  useEffect(() => {
    const prefs = { pageSize, sortField, sortDir }
    try { localStorage.setItem('prefs.estagios', JSON.stringify(prefs)) } catch {}
  }, [pageSize, sortField, sortDir])

  const toggleSort = (field) => {
    if (sortField !== field) {
      setSortField(field); setSortDir('asc')
    } else {
      if (sortDir === 'asc') setSortDir('desc')
      else if (sortDir === 'desc') { setSortField(''); setSortDir('asc') }
      else setSortDir('asc')
    }
    setPage(1)
  }

  const exportPagina = () => {
    const headers = ['id','nome','email','telefone','curso','instituicao','unidade','supervisor','periodo','disciplina','nivel','num_estagiarios','observacoes']
    const linhas = estagios.map(e => headers.map(h => {
      switch(h){
        case 'curso': return (e.curso?.nome||'')
        case 'instituicao': return (e.instituicao?.nome||'')
        case 'unidade': return (e.unidade?.nome||'')
        case 'supervisor': return (e.supervisor?.nome||'')
        default: return (e[h]||'')
      }
    }).map(v=> v.toString().replace(/;/g, ',')).join(';'))
    const csv = [headers.join(';'), ...linhas].join('\n')
    const blob = new Blob(['\ufeff' + csv], { type:'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob); const a=document.createElement('a')
    a.href=url; a.download=`estagios_pagina_${new Date().toISOString().split('T')[0]}.csv`; a.click(); URL.revokeObjectURL(url)
  }

  const exportTudo = async () => {
    const headers = ['id','nome','email','telefone','curso','instituicao','unidade','supervisor','periodo','disciplina','nivel','num_estagiarios','observacoes']
    let offset=0; const limit=500; const all=[]
    while (true) {
      const p = new URLSearchParams(); p.set('limit', String(limit)); p.set('offset', String(offset))
      if (busca.trim().length >= 2) p.set('q', busca.trim())
      if (filtro.instituicao_id) p.set('instituicao_id', filtro.instituicao_id)
      if (filtro.curso_id) p.set('curso_id', filtro.curso_id)
      if (filtro.unidade_id) p.set('unidade_id', filtro.unidade_id)
      if (filtro.supervisor_id) p.set('supervisor_id', filtro.supervisor_id)
      if (sortField) p.set('sort', `${sortField}:${sortDir}`)
      const r = await fetch(`${API_URL}/estagios/search?${p.toString()}`, { headers: getAuthHeaders() })
      if (!r.ok) break
      const data = await r.json(); (data.items||[]).forEach(e => all.push(e))
      if (all.length >= (data.total||0) || (data.items||[]).length === 0) break
      offset += limit
    }
    const linhas = all.map(e => headers.map(h => {
      switch(h){
        case 'curso': return (e.curso?.nome||'')
        case 'instituicao': return (e.instituicao?.nome||'')
        case 'unidade': return (e.unidade?.nome||'')
        case 'supervisor': return (e.supervisor?.nome||'')
        default: return (e[h]||'')
      }
    }).map(v=> v.toString().replace(/;/g, ',')).join(';'))
    const csv = [headers.join(';'), ...linhas].join('\n')
    const blob = new Blob(['\ufeff' + csv], { type:'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob); const a=document.createElement('a')
    a.href=url; a.download=`estagios_completo_${new Date().toISOString().split('T')[0]}.csv`; a.click(); URL.revokeObjectURL(url)
  }

  const sortIndicator = (field) => {
    if (sortField !== field) return ''
    return sortDir === 'asc' ? ' ▲' : ' ▼'
  }

  if (loading) return <div className="loading">Carregando estágios...</div>

  return (
    <Layout user={user}>
      <div className="page-header">
        <h1>📚 Estágios</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✖ Cancelar' : '➕ Novo Estágio'}
        </button>
      </div>

      {error && <div className="alert alert-danger">❌ {error}</div>}
      {success && <div className="alert alert-success">✅ {success}</div>}

      {/* Stat cards */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="stat-card" style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div className="stat-icon" style={{ fontSize: '32px', marginBottom: '8px' }}>📚</div>
          <div className="stat-label" style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Total de Estágios</div>
          <div className="stat-value" style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>{stats.total_estagios}</div>
        </div>
        <div className="stat-card" style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div className="stat-icon" style={{ fontSize: '32px', marginBottom: '8px' }}>🏢</div>
          <div className="stat-label" style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Instituições</div>
          <div className="stat-value" style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>{stats.total_instituicoes}</div>
        </div>
        <div className="stat-card" style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div className="stat-icon" style={{ fontSize: '32px', marginBottom: '8px' }}>🎓</div>
          <div className="stat-label" style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Cursos</div>
          <div className="stat-value" style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>{stats.total_cursos}</div>
        </div>
        <div className="stat-card" style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div className="stat-icon" style={{ fontSize: '32px', marginBottom: '8px' }}>👨‍⚕️</div>
          <div className="stat-label" style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Supervisores</div>
          <div className="stat-value" style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>{stats.total_supervisores}</div>
        </div>
        <div className="stat-card" style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div className="stat-icon" style={{ fontSize: '32px', marginBottom: '8px' }}>🏥</div>
          <div className="stat-label" style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Unidades</div>
          <div className="stat-value" style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>{stats.total_unidades}</div>
        </div>
        <div className="stat-card" style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div className="stat-icon" style={{ fontSize: '32px', marginBottom: '8px' }}>📋</div>
          <div className="stat-label" style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>Vagas</div>
          <div className="stat-value" style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>{stats.total_vagas}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="vagas-filters" style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '24px' }}>
        <div className="filters-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px', color: '#666' }}>🔍 Buscar</label>
            <input 
              type="search" 
              placeholder="Nome, e-mail ou disciplina" 
              value={busca} 
              onChange={(e)=> setBusca(e.target.value)} 
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px', color: '#666' }}>🏢 Instituição</label>
            <input 
              list="instituicoes-list" 
              value={instituicoes.find(i => i.id == filtro.instituicao_id)?.nome || ''} 
              onChange={(e) => {
                const inst = instituicoes.find(i => i.nome === e.target.value)
                setFiltro({...filtro, instituicao_id: inst ? inst.id : ''})
              }}
              placeholder="Selecione ou digite..."
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
            <datalist id="instituicoes-list">
              {instituicoes.map(i => <option key={i.id} value={i.nome} />)}
            </datalist>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px', color: '#666' }}>🏥 Unidade</label>
            <input 
              list="unidades-list" 
              value={unidades.find(u => u.id == filtro.unidade_id)?.nome || ''} 
              onChange={(e) => {
                const uni = unidades.find(u => u.nome === e.target.value)
                setFiltro({...filtro, unidade_id: uni ? uni.id : ''})
              }}
              placeholder="Selecione ou digite..."
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
            <datalist id="unidades-list">
              {unidades.map(u => <option key={u.id} value={u.nome} />)}
            </datalist>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px', color: '#666' }}>🎓 Curso</label>
            <input 
              list="cursos-list" 
              value={cursos.find(c => c.id == filtro.curso_id)?.nome || ''} 
              onChange={(e) => {
                const curso = cursos.find(c => c.nome === e.target.value)
                setFiltro({...filtro, curso_id: curso ? curso.id : ''})
              }}
              placeholder="Selecione ou digite..."
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
            <datalist id="cursos-list">
              {cursos.map(c => <option key={c.id} value={c.nome} />)}
            </datalist>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px', color: '#666' }}>👨‍⚕️ Supervisor</label>
            <input 
              list="supervisores-list" 
              value={supervisores.find(s => s.id == filtro.supervisor_id)?.nome || ''} 
              onChange={(e) => {
                const sup = supervisores.find(s => s.nome === e.target.value)
                setFiltro({...filtro, supervisor_id: sup ? sup.id : ''})
              }}
              placeholder="Selecione ou digite..."
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
            <datalist id="supervisores-list">
              {supervisores.map(s => <option key={s.id} value={s.nome} />)}
            </datalist>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn-secondary" onClick={()=> { setFiltro({instituicao_id:'', curso_id:'', unidade_id:'', supervisor_id:''}); setBusca(''); }}>
            🔄 Limpar Filtros
          </button>
          <button className="btn-secondary" onClick={exportPagina}>📥 CSV Página</button>
          <button className="btn-secondary" onClick={exportTudo}>📦 CSV Completo</button>
        </div>
      </div>

      {showForm && (
        <div className="form-container">
          <h3>Novo Estágio</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <h4>Dados do Estagiário</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Nome completo: *</label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    required
                    placeholder="Digite o nome completo do estagiário"
                  />
                </div>
                <div className="form-group">
                  <label>E-mail: *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                    placeholder="exemplo@email.com"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Telefone:</label>
                  <input
                    type="tel"
                    value={formData.telefone}
                    onChange={(e) => {
                      // Formatar telefone automaticamente
                      let valor = e.target.value.replace(/\D/g, '')
                      if (valor.length <= 11) {
                        if (valor.length <= 2) {
                          valor = valor.replace(/(\d{0,2})/, '($1)')
                        } else if (valor.length <= 7) {
                          valor = valor.replace(/(\d{2})(\d{0,5})/, '($1) $2')
                        } else {
                          valor = valor.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3')
                        }
                      }
                      setFormData({...formData, telefone: valor})
                    }}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="form-group">
                  <label>Período:</label>
                  <input
                    type="text"
                    value={formData.periodo}
                    onChange={(e) => setFormData({...formData, periodo: e.target.value})}
                    placeholder="Ex: 2025-10-10 A 2026-12-30 | SEG, TER | 08:00 ÁS 17:00"
                    list="periodos-criacao-sugeridos"
                    style={{ fontSize: '13px' }}
                  />
                  <datalist id="periodos-criacao-sugeridos">
                    <option value="SEG, TER, QUA, QUI, SEX | 08:00 ÁS 17:00" />
                    <option value="SEG, TER, QUA, QUI, SEX | 13:00 ÁS 22:00" />
                    <option value="SEG, TER, QUA, QUI, SEX | 07:00 ÁS 13:00" />
                    <option value="SEG, TER, QUA, QUI, SEX | 13:00 ÁS 19:00" />
                    <option value="SEG, TER, QUA, QUI, SEX | 19:00 ÁS 22:00" />
                    <option value="SEG, QUA, SEX | 08:00 ÁS 12:00" />
                    <option value="TER, QUI | 14:00 ÁS 18:00" />
                    <option value="Matutino" />
                    <option value="Vespertino" />
                    <option value="Noturno" />
                    <option value="Integral" />
                    <option value="2024/1" />
                    <option value="2024/2" />
                    <option value="2025/1" />
                    <option value="2025/2" />
                  </datalist>
                  <small className="form-help">
                    Formato: Data A Data | Dias | Horário ou apenas período (Ex: 2025/1, Matutino)
                  </small>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h4>Local do Estágio</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Instituição: *</label>
                  <select
                    value={formData.instituicao_id}
                    onChange={(e) => setFormData({...formData, instituicao_id: e.target.value})}
                    required
                  >
                    <option value="">Selecione a instituição...</option>
                    {instituicoes.map((inst) => (
                      <option key={inst.id} value={inst.id}>{inst.nome}</option>
                    ))}
                  </select>
                  <small className="form-help">Se não encontrar, será criada automaticamente na importação</small>
                </div>
                <div className="form-group">
                  <label>Unidade/Setor: *</label>
                  <select
                    value={formData.unidade_id}
                    onChange={(e) => setFormData({...formData, unidade_id: e.target.value})}
                    required
                  >
                    <option value="">Selecione a unidade...</option>
                    {unidades.map((unidade) => (
                      <option key={unidade.id} value={unidade.id}>{unidade.nome}</option>
                    ))}
                  </select>
                  <small className="form-help">Ex: UTI, Emergência, Clínica Médica</small>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h4>Dados Acadêmicos</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Curso: *</label>
                  <select
                    value={formData.curso_id}
                    onChange={(e) => setFormData({...formData, curso_id: e.target.value})}
                    required
                  >
                    <option value="">Selecione o curso...</option>
                    {cursos.map((curso) => (
                      <option key={curso.id} value={curso.id}>{curso.nome}</option>
                    ))}
                  </select>
                  <small className="form-help">Ex: Enfermagem, Medicina, Fisioterapia</small>
                </div>
                <div className="form-group">
                  <label>Disciplina:</label>
                  <input
                    type="text"
                    value={formData.disciplina}
                    onChange={(e) => setFormData({...formData, disciplina: e.target.value})}
                    placeholder="Ex: Estágio Supervisionado I"
                    list="disciplinas-sugeridas"
                  />
                  <datalist id="disciplinas-sugeridas">
                    {DISCIPLINAS_EXPANDIDAS.map((d) => (
                      <option key={d} value={d} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Nível: *</label>
                  <select
                    value={formData.nivel}
                    onChange={(e) => setFormData({...formData, nivel: e.target.value})}
                    required
                  >
                    <option value="">Selecione o nível...</option>
                    <option value="Técnico">Técnico</option>
                    <option value="Graduação">Graduação</option>
                    <option value="Pós-graduação Lato Sensu">Pós-graduação Lato Sensu</option>
                    <option value="Pós-graduação Stricto Sensu">Pós-graduação Stricto Sensu</option>
                    <option value="Residência">Residência</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Supervisor Responsável:</label>
                  <select
                    value={formData.supervisor_id}
                    onChange={(e) => setFormData({...formData, supervisor_id: e.target.value})}
                  >
                    <option value="">Selecione o supervisor...</option>
                    {supervisores.map((supervisor) => (
                      <option key={supervisor.id} value={supervisor.id}>
                        {supervisor.nome} {supervisor.especialidade ? `- ${supervisor.especialidade}` : ''}
                      </option>
                    ))}
                  </select>
                  <small className="form-help">Cadastre supervisores na página de Supervisores</small>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Número de estagiários:</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.num_estagiarios}
                    onChange={(e) => setFormData({...formData, num_estagiarios: e.target.value})}
                    placeholder="1"
                  />
                  <small className="form-help">Quantos estagiários nesta mesma vaga</small>
                </div>
                <div className="form-group">
                  <label>Carga Horária (h/semana):</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.carga_horaria}
                    onChange={(e) => setFormData({...formData, carga_horaria: e.target.value.replace(/[^0-9]/g,'')})}
                    placeholder="Ex: 20"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Salário (R$):</label>
                  <input
                    value={formData.salario}
                    onChange={(e) => setFormData({...formData, salario: e.target.value})}
                    placeholder="Ex: 800,00"
                  />
                  <small className="form-help">Se vazio, pode ser preenchido/atualizado depois</small>
                </div>
              </div>

              <div className="form-group">
                <label>Observações:</label>
                <textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                  rows="3"
                ></textarea>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">Criar Estágio</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="table-container" style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        {loading && <div className='spinner'>⏳ Carregando...</div>}
        {!loading && lastDuration !== null && (
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', display:'flex', gap:8, alignItems:'center' }}>
            <span>⚡ Carregado em {lastDuration}ms</span>
            {dataSource && (
              <span style={{ background:'#eef2ff', color:'#334155', border:'1px solid #c7d2fe', padding:'2px 6px', borderRadius:4, fontSize:12 }}>
                Fonte: {dataSource === 'integration' ? 'Integração externa' : 'Base local'}
              </span>
            )}
          </div>
        )}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                <th onClick={()=> toggleSort('nome')} style={{cursor:'pointer', padding: '12px', textAlign: 'left', fontWeight: '600', color: '#333'}}>
                  👤 Nome{sortIndicator('nome')}
                </th>
                <th onClick={()=> toggleSort('email')} style={{cursor:'pointer', padding: '12px', textAlign: 'left', fontWeight: '600', color: '#333'}}>
                  📧 E-mail{sortIndicator('email')}
                </th>
                <th onClick={()=> toggleSort('curso_nome')} style={{cursor:'pointer', padding: '12px', textAlign: 'left', fontWeight: '600', color: '#333'}}>
                  🎓 Curso{sortIndicator('curso_nome')}
                </th>
                <th onClick={()=> toggleSort('instituicao_nome')} style={{cursor:'pointer', padding: '12px', textAlign: 'left', fontWeight: '600', color: '#333'}}>
                  🏢 Instituição{sortIndicator('instituicao_nome')}
                </th>
                <th onClick={()=> toggleSort('unidade_nome')} style={{cursor:'pointer', padding: '12px', textAlign: 'left', fontWeight: '600', color: '#333'}}>
                  🏥 Unidade{sortIndicator('unidade_nome')}
                </th>
                <th onClick={()=> toggleSort('supervisor_nome')} style={{cursor:'pointer', padding: '12px', textAlign: 'left', fontWeight: '600', color: '#333'}}>
                  👨‍⚕️ Supervisor{sortIndicator('supervisor_nome')}
                </th>
                <th onClick={()=> toggleSort('periodo')} style={{cursor:'pointer', padding: '12px', textAlign: 'left', fontWeight: '600', color: '#333'}}>
                  📅 Período{sortIndicator('periodo')}
                </th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#333' }}>⚙️ Ações</th>
              </tr>
            </thead>
            <tbody>
              {estagios.map((estagio) => (
                <tr key={estagio.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                  <td style={{ padding: '12px' }}>{estagio.nome}</td>
                  <td style={{ padding: '12px', fontSize: '14px', color: '#666' }}>{estagio.email}</td>
                  <td style={{ padding: '12px' }}>
                    {estagio.curso?.nome || estagio.curso_nome || (typeof estagio.curso === 'string' ? estagio.curso : '') || (cursos.find(c => c.id == estagio.curso_id)?.nome) || '—'}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {estagio.instituicao?.nome || estagio.instituicao_nome || (typeof estagio.instituicao === 'string' ? estagio.instituicao : '') || (instituicoes.find(i => i.id == estagio.instituicao_id)?.nome) || '—'}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {estagio.unidade?.nome || estagio.unidade_nome || (typeof estagio.unidade === 'string' ? estagio.unidade : '') || (unidades.find(u => u.id == estagio.unidade_id)?.nome) || '—'}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {estagio.supervisor?.nome || estagio.supervisor_nome || (supervisores.find(s => s.id == estagio.supervisor_id)?.nome) || '—'}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {estagio.periodo ? (
                      <span style={{ background: '#e3f2fd', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '500' }}>
                        {estagio.periodo}
                      </span>
                    ) : '—'}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <button 
                      className="btn-small btn-info" 
                      onClick={()=> setViewItem(estagio)}
                      style={{ marginRight: '4px' }}
                    >
                      👁️ Ver
                    </button>
                    <button 
                      className="btn-small btn-secondary"
                      onClick={()=> setEditItem({ ...estagio })}
                      style={{ marginRight: '4px' }}
                    >
                      ✏️ Editar
                    </button>
                    <button 
                      className="btn-small btn-danger"
                      onClick={() => setDeleteItem(estagio)}
                    >
                      🗑️ Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, marginTop:16, paddingTop:16, borderTop: '1px solid #e0e0e0' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button disabled={page===1} onClick={()=> setPage(p=> Math.max(1, p-1))} className="btn-secondary">
              ◀ Anterior
            </button>
            <button disabled={(page*pageSize) >= total} onClick={()=> setPage(p=> p+1)} className="btn-secondary">
              Próxima ▶
            </button>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '14px', color: '#666' }}>
            <span>Página {page} de {Math.max(1, Math.ceil(total / pageSize))} • {total} registro(s)</span>
            <select value={pageSize} onChange={(e)=> { setPage(1); setPageSize(parseInt(e.target.value)) }} style={{ padding: '4px 8px', border: '1px solid #ddd', borderRadius: '4px' }}>
              <option value={10}>10 por página</option>
              <option value={20}>20 por página</option>
              <option value={50}>50 por página</option>
              <option value={100}>100 por página</option>
            </select>
          </div>
        </div>

        {estagios.length === 0 && (
          <div className="empty-state" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
            <p style={{ fontSize: '18px', marginBottom: '8px' }}>Nenhum estágio cadastrado ainda.</p>
            <p style={{ fontSize: '14px' }}>Clique em "➕ Novo Estágio" para começar.</p>
          </div>
        )}
      </div>

      {/* View Modal */}
      <Modal isOpen={!!viewItem} onClose={() => setViewItem(null)} title="Detalhes do Estágio" closeOnOverlayClick>
        {viewItem && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <strong>Nome:</strong><br/>{viewItem.nome}
            </div>
            <div>
              <strong>E-mail:</strong><br/>{viewItem.email}
            </div>
            <div>
              <strong>Telefone:</strong><br/>{viewItem.telefone || '—'}
            </div>
            <div>
              <strong>Período:</strong><br/>{viewItem.periodo || '—'}
            </div>
            <div>
              <strong>Carga Horária:</strong><br/>{viewItem.carga_horaria || '—'}
            </div>
            <div>
              <strong>Salário:</strong><br/>{viewItem.salario || '—'}
            </div>
            <div>
              <strong>Instituição:</strong><br/>{viewItem.instituicao?.nome || '—'}
            </div>
            <div>
              <strong>Curso:</strong><br/>{viewItem.curso?.nome || '—'}
            </div>
            <div>
              <strong>Unidade:</strong><br/>{viewItem.unidade?.nome || '—'}
            </div>
            <div>
              <strong>Supervisor:</strong><br/>{viewItem.supervisor?.nome || '—'}
            </div>
            <div style={{ gridColumn:'1 / -1' }}>
              <strong>Disciplina:</strong><br/>{viewItem.disciplina || '—'}
            </div>
            <div>
              <strong>Nível:</strong><br/>{viewItem.nivel || '—'}
            </div>
            <div>
              <strong># Estagiários:</strong><br/>{viewItem.num_estagiarios || '—'}
            </div>
            <div style={{ gridColumn:'1 / -1' }}>
              <strong>Observações:</strong><br/>{viewItem.observacoes || '—'}
            </div>
            <div style={{ gridColumn:'1 / -1', marginTop:8 }}>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                <button className="btn-primary" onClick={()=> { window.location.href = `/app/plano-atividades/${viewItem.id}` }}>Abrir Plano de Atividades</button>
                <a className="btn-secondary" href={`${API_URL}/estagios/${viewItem.id}/html?token=${encodeURIComponent(localStorage.getItem('token')||'')}&__t=${Date.now()}`} target="_blank" rel="noreferrer">Abrir Visualização HTML</a>
              </div>
            </div>
            <div style={{ gridColumn:'1 / -1' }}>
              <iframe title="preview-html" style={{ width:'100%', height: '380px', border:'1px solid #e0e0e0', borderRadius:8 }} src={`${API_URL}/estagios/${viewItem.id}/html?token=${encodeURIComponent(localStorage.getItem('token')||'')}&__t=${Date.now()}`}></iframe>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title="Editar Estágio" closeOnOverlayClick={false} closeOnEsc={false}>
        {editItem && (
          <form onSubmit={handleEditSubmit} className="form-grid">
            <div className="form-row">
              <div className="form-group">
                <label>Nome</label>
                <input value={editItem.nome||''} onChange={(e)=> setEditItem({...editItem, nome:e.target.value})} required />
              </div>
              <div className="form-group">
                <label>E-mail</label>
                <input type="email" value={editItem.email||''} onChange={(e)=> setEditItem({...editItem, email:e.target.value})} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Telefone</label>
                <input value={editItem.telefone||''} onChange={(e)=> setEditItem({...editItem, telefone:e.target.value})} />
              </div>
              <div className="form-group">
                <label>Período</label>
                <input 
                  value={editItem.periodo||''} 
                  onChange={(e)=> setEditItem({...editItem, periodo:e.target.value})} 
                  list="periodos-sugeridos"
                  placeholder="Ex: 2025-10-10 A 2026-12-30 | SEG, TER | 08:00 ÁS 17:00"
                  style={{ fontSize: '13px' }}
                />
                <datalist id="periodos-sugeridos">
                  <option value="SEG, TER, QUA, QUI, SEX | 08:00 ÁS 17:00" />
                  <option value="SEG, TER, QUA, QUI, SEX | 13:00 ÁS 22:00" />
                  <option value="SEG, TER, QUA, QUI, SEX | 07:00 ÁS 13:00" />
                  <option value="SEG, TER, QUA, QUI, SEX | 13:00 ÁS 19:00" />
                  <option value="SEG, TER, QUA, QUI, SEX | 19:00 ÁS 22:00" />
                  <option value="SEG, QUA, SEX | 08:00 ÁS 12:00" />
                  <option value="TER, QUI | 14:00 ÁS 18:00" />
                  <option value="Matutino" />
                  <option value="Vespertino" />
                  <option value="Noturno" />
                  <option value="Integral" />
                  <option value="M" />
                  <option value="V" />
                  <option value="N" />
                  <option value="I" />
                </datalist>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Instituição</label>
                <select value={editItem.instituicao_id||''} onChange={(e)=> setEditItem({...editItem, instituicao_id:e.target.value})}>
                  <option value="">Selecione...</option>
                  {instituicoes.map(i=> <option key={i.id} value={i.id}>{i.nome}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Curso</label>
                <select value={editItem.curso_id||''} onChange={(e)=> setEditItem({...editItem, curso_id:e.target.value})}>
                  <option value="">Selecione...</option>
                  {cursos.map(c=> <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Unidade</label>
                <select value={editItem.unidade_id||''} onChange={(e)=> setEditItem({...editItem, unidade_id:e.target.value})}>
                  <option value="">Selecione...</option>
                  {unidades.map(u=> <option key={u.id} value={u.id}>{u.nome}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Supervisor</label>
                <select value={editItem.supervisor_id||''} onChange={(e)=> setEditItem({...editItem, supervisor_id:e.target.value})}>
                  <option value="">Selecione...</option>
                  {supervisores.map(s=> <option key={s.id} value={s.id}>{s.nome}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Disciplina</label>
                <input value={editItem.disciplina||''} onChange={(e)=> setEditItem({...editItem, disciplina:e.target.value})} list="disciplinas-sugeridas" />
              </div>
              <div className="form-group">
                <label>Nível</label>
                <select value={editItem.nivel||''} onChange={(e)=> setEditItem({...editItem, nivel:e.target.value})}>
                  <option value="">Selecione...</option>
                  <option value="Técnico">Técnico</option>
                  <option value="Graduação">Graduação</option>
                  <option value="Pós-graduação Lato Sensu">Pós-graduação Lato Sensu</option>
                  <option value="Pós-graduação Stricto Sensu">Pós-graduação Stricto Sensu</option>
                  <option value="Residência">Residência</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Carga Horária (h/semana)</label>
                <input type="number" min="0" step="1" value={editItem.carga_horaria||''} onChange={(e)=> setEditItem({...editItem, carga_horaria:e.target.value.replace(/[^0-9]/g,'')})} placeholder="Ex: 20" />
              </div>
              <div className="form-group">
                <label>Salário (R$)</label>
                <input value={editItem.salario||''} onChange={(e)=> setEditItem({...editItem, salario:e.target.value})} placeholder="Ex: 800,00" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label># Estagiários</label>
                <input type="number" min="1" max="10" value={editItem.num_estagiarios||''} onChange={(e)=> setEditItem({...editItem, num_estagiarios:e.target.value})} />
              </div>
              <div className="form-group">
                <label>Observações</label>
                <input value={editItem.observacoes||''} onChange={(e)=> setEditItem({...editItem, observacoes:e.target.value})} />
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary">Salvar</button>
              <button type="button" onClick={()=> setEditItem(null)} className="btn-secondary">Cancelar</button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal isOpen={!!deleteItem} onClose={()=> setDeleteItem(null)} title="Confirmar remoção" closeOnOverlayClick>
        {deleteItem && (
          <div>
            <p>Tem certeza que deseja remover o estágio de <strong>{deleteItem.nome}</strong>?</p>
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
              <button className="btn-secondary" onClick={()=> setDeleteItem(null)}>Cancelar</button>
              <button className="btn-danger" onClick={async ()=> { await handleDelete(deleteItem.id); setDeleteItem(null) }}>Remover</button>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  )
}

export default Estagios