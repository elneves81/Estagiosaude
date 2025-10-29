// Página de gestão de supervisores
import React, { useState, useEffect, useRef } from 'react'
import Layout from '../components/Layout'
import Modal from '../components/Modal'

const API_URL = (import.meta.env && import.meta.env.VITE_API_URL) || ''

function Supervisores() {
  const [user, setUser] = useState(null)
  const [supervisores, setSupervisores] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [sortField, setSortField] = useState('')
  const [sortDir, setSortDir] = useState('asc')
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)
  const [lastDuration, setLastDuration] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editItem, setEditItem] = useState(null)
  
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    especialidade: '',
    numero_conselho: ''
  })

  // Formatação automática de telefone
  const formatarTelefone = (valor) => {
    const apenas_numeros = valor.replace(/\D/g, '')
    
    if (apenas_numeros.length <= 2) {
      return apenas_numeros
    } else if (apenas_numeros.length <= 6) {
      return `(${apenas_numeros.slice(0, 2)}) ${apenas_numeros.slice(2)}`
    } else if (apenas_numeros.length <= 10) {
      return `(${apenas_numeros.slice(0, 2)}) ${apenas_numeros.slice(2, 6)}-${apenas_numeros.slice(6)}`
    } else {
      return `(${apenas_numeros.slice(0, 2)}) ${apenas_numeros.slice(2, 7)}-${apenas_numeros.slice(7, 11)}`
    }
  }

  // Validação de email
  const validarEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(email)
  }

  // Carregar preferências salvas
  useEffect(() => {
    try {
      const raw = localStorage.getItem('prefs.supervisores')
      if (raw) {
        const prefs = JSON.parse(raw)
        if (prefs.pageSize && [10,20,50,100].includes(prefs.pageSize)) setPageSize(prefs.pageSize)
        if (prefs.sortField) setSortField(prefs.sortField)
        if (prefs.sortDir && ['asc','desc'].includes(prefs.sortDir)) setSortDir(prefs.sortDir)
      }
    } catch {}
    fetchUserInfo()
  }, [])

  // Primeira carga após aplicar prefs
  useEffect(() => {
    fetchSupervisores()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSize, sortField, sortDir])

  // Debounce de busca
  const buscaTimer = useRef(null)

  useEffect(() => {
    fetchSupervisores()
  }, [page])

  useEffect(() => {
    // Reinicia página e agenda busca quando termo muda
    setPage(1)
    if (buscaTimer.current) clearTimeout(buscaTimer.current)
    buscaTimer.current = setTimeout(() => {
      fetchSupervisores()
    }, 400)
    return () => buscaTimer.current && clearTimeout(buscaTimer.current)
  }, [busca])

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

  const fetchSupervisores = async () => {
    try {
      setLoading(true)
      const start = performance.now()
      const params = new URLSearchParams()
      params.set('limit', String(pageSize))
      params.set('offset', String((page-1) * pageSize))
      if (busca.trim().length >= 2) params.set('q', busca.trim())
      if (sortField) params.set('sort', `${sortField}:${sortDir}`)
      const response = await fetch(`${API_URL}/supervisores/search?${params.toString()}`, { headers: getAuthHeaders() })
      if (response.ok) {
        const data = await response.json()
        setSupervisores(data.items || [])
        setTotal(data.total || 0)
      }
      setLastDuration(Math.round(performance.now() - start))
    } catch (err) {
      setError('Erro ao carregar supervisores')
    } finally {
      setLoading(false)
    }
  }

  const exportPagina = () => {
    const headers = ['id','nome','email','telefone','especialidade','numero_conselho']
    const linhas = supervisores.map(s=> headers.map(h=> (s[h]||'').toString().replace(/;/g, ',')).join(';'))
    const csv = [headers.join(';'), ...linhas].join('\n')
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href=url; a.download='supervisores_pagina.csv'; a.click(); URL.revokeObjectURL(url)
  }

  const exportTudo = async () => {
    const headers = ['id','nome','email','telefone','especialidade','numero_conselho']
    let offset = 0; const limit = 500; const rows = []
    while (true) {
      const p = new URLSearchParams(); p.set('limit', String(limit)); p.set('offset', String(offset))
      if (busca.trim().length >= 2) p.set('q', busca.trim())
      if (sortField) p.set('sort', `${sortField}:${sortDir}`)
      const r = await fetch(`${API_URL}/supervisores/search?${p.toString()}`, { headers: getAuthHeaders() })
      if (!r.ok) break
      const data = await r.json(); (data.items||[]).forEach(s=> rows.push(s))
      if (rows.length >= (data.total||0) || (data.items||[]).length === 0) break
      offset += limit
    }
    const linhas = rows.map(s=> headers.map(h=> (s[h]||'').toString().replace(/;/g, ',')).join(';'))
    const csv = [headers.join(';'), ...linhas].join('\n')
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href=url; a.download='supervisores_todos.csv'; a.click(); URL.revokeObjectURL(url)
  }

  // Persistir preferências em mudanças
  useEffect(() => {
    const prefs = { pageSize, sortField, sortDir }
    try { localStorage.setItem('prefs.supervisores', JSON.stringify(prefs)) } catch {}
  }, [pageSize, sortField, sortDir])

  const toggleSort = (field) => {
    if (sortField !== field) {
      setSortField(field)
      setSortDir('asc')
    } else {
      // alterna asc -> desc -> none
      if (sortDir === 'asc') setSortDir('desc')
      else if (sortDir === 'desc') { setSortField(''); setSortDir('asc') }
      else setSortDir('asc')
    }
    setPage(1)
  }

  const sortIndicator = (field) => {
    if (sortField !== field) return ''
    return sortDir === 'asc' ? ' ▲' : ' ▼'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Validações
    if (!formData.nome.trim()) {
      setError('Nome é obrigatório')
      return
    }

    if (!validarEmail(formData.email)) {
      setError('E-mail inválido')
      return
    }

    try {
      const response = await fetch(`${API_URL}/supervisores`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setSuccess('Supervisor criado com sucesso!')
        setShowForm(false)
  setFormData({ nome: '', email: '', telefone: '', especialidade: '', numero_conselho: '' })
        fetchSupervisores()
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'Erro ao criar supervisor')
      }
    } catch (err) {
      setError('Erro de conexão')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja remover este supervisor?')) return

    try {
      const response = await fetch(`${API_URL}/supervisores/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })

      if (response.ok) {
        setSuccess('Supervisor removido com sucesso!')
        fetchSupervisores()
      } else {
        setError('Erro ao remover supervisor')
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
    // validações básicas
    if (!editItem.nome || !editItem.nome.trim()) {
      setError('Nome é obrigatório')
      return
    }
    const payload = {
      nome: editItem.nome,
      email: editItem.email,
      telefone: editItem.telefone || null,
      especialidade: editItem.especialidade || null,
      numero_conselho: editItem.numero_conselho || null,
    }
    try {
      const res = await fetch(`${API_URL}/supervisores/${editItem.id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const data = await res.json().catch(()=>({}))
        throw new Error(data.detail || `Erro ${res.status}`)
      }
      setSuccess('Supervisor atualizado com sucesso!')
      setEditItem(null)
      fetchSupervisores()
    } catch (err) {
      setError(err.message || 'Erro ao atualizar supervisor')
    }
  }

  if (loading) return <div className="loading">Carregando supervisores...</div>

  return (
    <Layout user={user}>
      <div className="page-header">
        <h1>Supervisores</h1>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <input
            type="search"
            placeholder="Buscar nome, e-mail ou especialidade..."
            value={busca}
            onChange={(e)=> setBusca(e.target.value)}
            style={{ padding: 8, minWidth: 260 }}
          />
          <button className="btn-secondary" onClick={()=> { setPage(1); fetchSupervisores() }}>Atualizar</button>
          <button className="btn-secondary" onClick={exportPagina}>CSV Página</button>
          <button className="btn-secondary" onClick={exportTudo}>CSV Tudo</button>
          <button 
          className="btn-primary" 
          onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancelar' : '+ Novo Supervisor'}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {showForm && (
        <div className="form-container">
          <h3>Novo Supervisor</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="required">Nome completo:</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  placeholder="Ex: Dr. João Silva"
                  required
                />
                <div className="form-help">Nome completo do supervisor (obrigatório)</div>
              </div>
              <div className="form-group">
                <label className="required">E-mail:</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="Ex: supervisor@instituicao.com"
                  required
                />
                <div className="form-help">E-mail institucional ou profissional (obrigatório)</div>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Telefone:</label>
                <input
                  type="tel"
                  value={formData.telefone}
                  onChange={(e) => setFormData({...formData, telefone: formatarTelefone(e.target.value)})}
                  placeholder="(11) 99999-9999"
                  maxLength="15"
                />
                <div className="form-help">Telefone para contato (opcional)</div>
              </div>
              <div className="form-group">
                <label>Especialidade:</label>
                <input
                  type="text"
                  value={formData.especialidade}
                  onChange={(e) => setFormData({...formData, especialidade: e.target.value})}
                  placeholder="Ex: Psicologia Clínica, Enfermagem, etc."
                />
                <div className="form-help">Área de especialização ou formação (opcional)</div>
              </div>
              <div className="form-group">
                <label>Nº Conselho:</label>
                <input
                  type="text"
                  value={formData.numero_conselho}
                  onChange={(e) => setFormData({...formData, numero_conselho: e.target.value})}
                  placeholder="Ex: COREN 123456"
                />
                <div className="form-help">Número do conselho profissional (opcional)</div>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">Criar Supervisor</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="table-container">
        {loading && <div className='spinner'>Carregando...</div>}
        {!loading && lastDuration !== null && <div style={{ fontSize:12, opacity:.7, marginBottom:4 }}>Carregado em {lastDuration} ms</div>}
        <table>
          <thead>
            <tr>
              <th onClick={()=> toggleSort('nome')} style={{cursor:'pointer'}}>Nome{sortIndicator('nome')}</th>
              <th onClick={()=> toggleSort('email')} style={{cursor:'pointer'}}>E-mail{sortIndicator('email')}</th>
              <th>Telefone</th>
              <th onClick={()=> toggleSort('especialidade')} style={{cursor:'pointer'}}>Especialidade{sortIndicator('especialidade')}</th>
              <th onClick={()=> toggleSort('numero_conselho')} style={{cursor:'pointer'}}>Nº Conselho{sortIndicator('numero_conselho')}</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {supervisores.map((supervisor) => (
              <tr key={supervisor.id}>
                <td>{supervisor.nome}</td>
                <td>{supervisor.email}</td>
                <td>{supervisor.telefone || 'Não informado'}</td>
                <td>{supervisor.especialidade || 'Não informado'}</td>
                <td>{supervisor.numero_conselho || 'Não informado'}</td>
                <td>
                  <button type="button" className="btn-small btn-secondary" onClick={(e)=> { e.stopPropagation(); setEditItem({ ...supervisor }) }}>Editar</button>
                  <button 
                    type="button"
                    className="btn-small btn-danger"
                    onClick={(e) => { e.stopPropagation(); handleDelete(supervisor.id) }}
                  >
                    Remover
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="pagination" style={{ display:'flex', alignItems:'center', gap:12, marginTop:12 }}>
          <button disabled={page===1} onClick={()=> setPage(p=> Math.max(1, p-1))} className="btn-secondary">Anterior</button>
          <span>Página {page} de {Math.max(1, Math.ceil(total / pageSize))} • {total} registro(s)</span>
          <button disabled={(page*pageSize) >= total} onClick={()=> setPage(p=> p+1)} className="btn-secondary">Próxima</button>
          <select value={pageSize} onChange={(e)=> { setPage(1); setPageSize(parseInt(e.target.value)) }}>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        {supervisores.length === 0 && (
          <div className="empty-state">
            <p>Nenhum supervisor cadastrado ainda.</p>
            <p>Clique em "Novo Supervisor" para começar.</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Modal isOpen={!!editItem} onClose={()=> setEditItem(null)} title="Editar Supervisor" size="medium" closeOnOverlayClick>
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
                <input value={editItem.telefone||''} onChange={(e)=> setEditItem({...editItem, telefone: formatarTelefone(e.target.value)})} />
              </div>
              <div className="form-group">
                <label>Especialidade</label>
                <input value={editItem.especialidade||''} onChange={(e)=> setEditItem({...editItem, especialidade:e.target.value})} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Nº Conselho</label>
                <input value={editItem.numero_conselho||''} onChange={(e)=> setEditItem({...editItem, numero_conselho:e.target.value})} />
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary">Salvar</button>
              <button type="button" className="btn-secondary" onClick={()=> setEditItem(null)}>Cancelar</button>
            </div>
          </form>
        )}
      </Modal>
    </Layout>
  )
}

export default Supervisores