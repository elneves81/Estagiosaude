// Páginas de gestão de catálogos (Instituições, Cursos, Unidades)
import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import Modal from '../components/Modal'

const API_URL = (import.meta.env && import.meta.env.VITE_API_URL) || ''

function CatalogoPage({ type, title, apiEndpoint }) {
  const [user, setUser] = useState(null)
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editItem, setEditItem] = useState(null)
  
  const [formData, setFormData] = useState({
    nome: ''
  })
  const [csvFile, setCsvFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchUserInfo()
    fetchItems()
  }, [apiEndpoint, page, pageSize, q])

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

  const fetchItems = async () => {
    try {
      if (apiEndpoint === '/cursos') {
        const params = new URLSearchParams()
        params.set('limit', String(pageSize))
        params.set('offset', String((page-1)*pageSize))
        if (q.trim()) params.set('q', q.trim())
  const response = await fetch(`${API_URL}/cursos/search?${params.toString()}`, { headers: getAuthHeaders() })
        if (response.ok) {
          const data = await response.json()
          setItems(data.items || [])
          setTotal(data.total || 0)
        }
      } else {
  const response = await fetch(`${API_URL}${apiEndpoint}`, { headers: getAuthHeaders() })
        if (response.ok) {
          const data = await response.json()
          setItems(data)
          setTotal((data||[]).length)
        }
      }
    } catch (err) {
      setError(`Erro ao carregar ${type}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`${API_URL}${apiEndpoint}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setSuccess(`${type} criado com sucesso!`)
        setShowForm(false)
        setFormData({ nome: '' })
        fetchItems()
      } else {
        const errorData = await response.json()
        setError(errorData.detail || `Erro ao criar ${type}`)
      }
    } catch (err) {
      setError('Erro de conexão')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm(`Tem certeza que deseja remover este ${type}?`)) return

    try {
      const response = await fetch(`${API_URL}${apiEndpoint}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })

      if (response.ok) {
        setSuccess(`${type} removido com sucesso!`)
        fetchItems()
      } else {
        setError(`Erro ao remover ${type}`)
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
    
    if (!editItem.nome || !editItem.nome.trim()) {
      setError('Nome é obrigatório')
      return
    }
    
    const payload = { nome: editItem.nome }
    
    try {
      const res = await fetch(`${API_URL}${apiEndpoint}/${editItem.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      })
      
      if (!res.ok) {
        const data = await res.json().catch(()=>({}))
        throw new Error(data.detail || `Erro ${res.status}`)
      }
      
      setSuccess(`${type} atualizado com sucesso!`)
      setEditItem(null)
      fetchItems()
    } catch (err) {
      setError(err.message || `Erro ao atualizar ${type}`)
    }
  }

  const handleCSVUpload = async (e) => {
    e.preventDefault()
    if (!csvFile) return
    if (user?.tipo !== 'admin') {
      setError('Apenas administradores podem substituir catálogos')
      return
    }
    setUploading(true)
    setError('')
    setSuccess('')
    try {
      const form = new FormData()
      form.append('tipo', type === 'instituição' ? 'instituicoes' : 'unidades')
      form.append('file', csvFile)
      const res = await fetch(`${API_URL}/admin/catalogos/upload-cnes`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: form
      })
      if (res.ok) {
        const data = await res.json()
        setSuccess(data.message || 'Catálogo substituído com sucesso')
        setCsvFile(null)
        fetchItems()
      } else {
        const err = await res.json()
        setError(err.detail || 'Falha ao importar CSV')
      }
    } catch (err) {
      setError('Erro de conexão ao enviar CSV')
    } finally {
      setUploading(false)
    }
  }

  if (loading) return <div className="loading">Carregando {type}...</div>

  return (
    <Layout user={user}>
      <div className="page-header">
        <h1>{title}</h1>
        {user?.tipo === 'admin' && (
          <button 
            className="btn-primary" 
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancelar' : `+ Novo ${type}`}
          </button>
        )}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

  {user?.tipo === 'admin' && showForm && (
        <div className="form-container">
          <h3>Novo {type}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nome:</label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({...formData, nome: e.target.value})}
                required
                placeholder={`Digite o nome ${type === 'curso' ? 'do curso' : type === 'instituição' ? 'da instituição' : 'da unidade'}`}
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">Criar {type}</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                Cancelar
              </button>
            </div>
          </form>
          {user?.tipo === 'admin' && (
            <div className="csv-upload">
              <h4>Substituir {type === 'instituição' ? 'Instituições' : 'Unidades'} via CSV (CNES)</h4>
              <p className="hint">Envie um CSV contendo ao menos a coluna com o nome. Delimitadores ; ou , são aceitos.</p>
              <form onSubmit={handleCSVUpload}>
                <input type="file" accept=".csv" onChange={(e) => setCsvFile(e.target.files?.[0] || null)} />
                <button type="submit" className="btn-secondary" disabled={!csvFile || uploading}>
                  {uploading ? 'Processando...' : 'Substituir via CSV'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      <div className="table-container">
        {apiEndpoint === '/cursos' && (
          <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:12 }}>
            <input type="search" placeholder="Buscar curso..." value={q} onChange={e=> { setPage(1); setQ(e.target.value) }} />
            <div style={{ marginLeft:'auto', display:'flex', gap:8, alignItems:'center' }}>
              <button disabled={page===1} onClick={()=> setPage(p=> Math.max(1, p-1))}>◀</button>
              <span>Página {page} de {Math.max(1, Math.ceil(total / pageSize))}</span>
              <button disabled={(page*pageSize)>=total} onClick={()=> setPage(p=> p+1)}>▶</button>
              <select value={pageSize} onChange={e=> { setPage(1); setPageSize(parseInt(e.target.value)) }}>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        )}
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              {(type === 'instituição' || type === 'unidade') && (<><th>CNES</th><th>Razão Social</th></>)}
              <th>Data de Criação</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.nome}</td>
                {(type === 'instituição' || type === 'unidade') && (<><td>{item.cnes || '-'}</td><td>{item.razao_social || '-'}</td></>)}
                <td>{new Date(item.created_at).toLocaleDateString('pt-BR')}</td>
                <td>
                  {user?.tipo === 'admin' ? (
                    <>
                      <button 
                        type="button"
                        className="btn-small btn-secondary"
                        onClick={(e) => { e.stopPropagation(); setEditItem({ ...item }) }}
                      >
                        Editar
                      </button>
                      <button 
                        type="button"
                        className="btn-small btn-danger"
                        onClick={(e) => { e.stopPropagation(); handleDelete(item.id) }}
                      >
                        Remover
                      </button>
                    </>
                  ) : (
                    <span>-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {items.length === 0 && (
          <div className="empty-state">
            <p>Nenhum {type} cadastrado ainda.</p>
            <p>Clique em "Novo {type}" para começar.</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Modal isOpen={!!editItem} onClose={()=> setEditItem(null)} title={`Editar ${type}`} size="small">
        {editItem && (
          <form onSubmit={handleEditSubmit}>
            <div className="form-group">
              <label>Nome:</label>
              <input 
                type="text"
                value={editItem.nome || ''} 
                onChange={(e)=> setEditItem({...editItem, nome: e.target.value})} 
                required 
                placeholder={`Nome ${type === 'curso' ? 'do curso' : type === 'instituição' ? 'da instituição' : 'da unidade'}`}
              />
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

// Componentes específicos para cada tipo de catálogo
export function Instituicoes() {
  const [selected, setSelected] = React.useState(null)
  const [items, setItems] = React.useState([])
  const [user, setUser] = React.useState(null)
  const API_URL = (import.meta.env && import.meta.env.VITE_API_URL) || ''

  const getAuthHeaders = () => ({ 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' })
  const loadUser = async () => { const r = await fetch(`${API_URL}/auth/me`, { headers: getAuthHeaders() }); if (r.ok) setUser(await r.json()) }
  const loadItems = async () => {
    const r = await fetch(`${API_URL}/instituicoes?somente_ensino=1`)
    if (r.ok) setItems(await r.json())
  }
  React.useEffect(() => { loadUser(); loadItems() }, [])

  async function loadCursos(instId) {
    const r = await fetch(`${API_URL}/instituicoes/${instId}/cursos`)
    if (r.ok) {
      const cursos = await r.json()
      setSelected(prev => ({ ...(prev||{}), cursos }))
    }
  }

  const [novoCurso, setNovoCurso] = React.useState({ curso_id: '', nivel: 'superior' })
  const [cursosCatalogo, setCursosCatalogo] = React.useState([])
  React.useEffect(() => { (async () => { const r = await fetch(`${API_URL}/cursos`); if (r.ok) setCursosCatalogo(await r.json()) })() }, [])

  async function addOferta() {
    if (!selected) return
    const payload = { instituicao_id: selected.id, curso_id: Number(novoCurso.curso_id), nivel: novoCurso.nivel }
    const r = await fetch(`${API_URL}/instituicoes/${selected.id}/cursos`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(payload) })
    if (r.ok) { await loadCursos(selected.id); setNovoCurso({ curso_id: '', nivel: 'superior' }) }
  }

  async function delOferta(relId) {
    if (!selected) return
    const r = await fetch(`${API_URL}/instituicoes/${selected.id}/cursos/${relId}`, { method: 'DELETE', headers: getAuthHeaders() })
    if (r.ok) { await loadCursos(selected.id) }
  }

  return (
    <Layout user={user}>
      <div className="page-header">
        <h1>Instituições de Ensino</h1>
      </div>
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="table-container">
          <table>
            <thead>
              <tr><th>Nome</th><th>Razão Social</th></tr>
            </thead>
            <tbody>
              {items.map(inst => (
                <tr key={inst.id} className={selected?.id===inst.id ? 'active' : ''} onClick={() => { setSelected(inst); loadCursos(inst.id) }}>
                  <td>{inst.nome}</td>
                  <td>{inst.razao_social || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card">
          {selected ? (
            <div>
              <h3>Cursos ofertados por "{selected.nome}"</h3>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <select value={novoCurso.curso_id} onChange={e=>setNovoCurso({ ...novoCurso, curso_id: e.target.value })}>
                  <option value="">Selecione um curso</option>
                  {cursosCatalogo.map(c => (<option key={c.id} value={c.id}>{c.nome}</option>))}
                </select>
                <select value={novoCurso.nivel} onChange={e=>setNovoCurso({ ...novoCurso, nivel: e.target.value })}>
                  <option value="superior">Superior</option>
                  <option value="tecnico">Técnico</option>
                </select>
                <button onClick={addOferta} disabled={!novoCurso.curso_id}>Adicionar</button>
              </div>
              <table className="striped">
                <thead>
                  <tr><th>Curso</th><th>Nível</th><th>Ações</th></tr>
                </thead>
                <tbody>
                  {(selected.cursos||[]).map(rel => (
                    <tr key={rel.id}>
                      <td>{rel.curso_nome}</td>
                      <td>{rel.nivel || '-'}</td>
                      <td><button className="btn-small btn-danger" onClick={()=>delOferta(rel.id)}>Remover</button></td>
                    </tr>
                  ))}
                  {(!selected.cursos || selected.cursos.length===0) && (
                    <tr><td colSpan={3}>Nenhum curso vinculado ainda.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div>Selecione uma instituição para ver/editar os cursos ofertados.</div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export function Cursos() {
  return (
    <CatalogoPage 
      type="curso"
      title="Cursos"
      apiEndpoint="/cursos"
    />
  )
}

export function Unidades() {
  return (
    <CatalogoPage 
      type="unidade"
      title="Unidades"
      apiEndpoint="/unidades"
    />
  )
}

export default CatalogoPage