// Página de gestão de Unidades / Setores
import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout'

const API_URL = (import.meta.env && import.meta.env.VITE_API_URL) || ''

function Unidades() {
  const [user, setUser] = useState(null)
  const [unidades, setUnidades] = useState([])
  const [nome, setNome] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const headers = () => ({ 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type':'application/json' })

  const fetchUser = async () => {
    try {
      const r = await fetch(`${API_URL}/auth/me`, { headers: headers() })
      if (r.ok) setUser(await r.json())
    } catch(e) { console.error(e) }
  }

  const fetchUnidades = async () => {
    try {
      setLoading(true)
      const r = await fetch(`${API_URL}/unidades`, { 
        headers: headers(),
        cache: 'no-cache' // Força o servidor a validar o ETag
      })
      if (r.ok) {
        const data = await r.json()
        setUnidades(data)
      } else {
        setError(`Erro ${r.status}: ${r.statusText}`)
      }
    } catch(e) { 
      console.error('Erro ao carregar unidades:', e)
      setError('Falha ao carregar unidades') 
    }
    finally { setLoading(false) }
  }

  useEffect(()=> { fetchUser(); fetchUnidades() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setError(''); setSuccess('')
    if (!nome.trim()) { setError('Nome é obrigatório'); return }
    try {
      const r = await fetch(`${API_URL}/unidades`, { method:'POST', headers: headers(), body: JSON.stringify({ nome: nome.trim() }) })
      if (r.ok) { setSuccess('Unidade criada'); setNome(''); fetchUnidades() } else { setError('Erro ao criar') }
    } catch(e) { setError('Erro de rede') }
  }

  const handleDelete = async (id) => {
    if(!confirm('Remover esta unidade?')) return
    try {
      const r = await fetch(`${API_URL}/unidades/${id}`, { method:'DELETE', headers: headers() })
      if (r.ok) { setSuccess('Removida'); fetchUnidades() } else setError('Erro ao remover')
    } catch(e) { setError('Erro de rede') }
  }

  if (loading) return <div className='loading'>Carregando unidades...</div>

  return (
    <Layout user={user}>
      <div className='page-header'>
        <h1>Unidades / Setores</h1>
        <form onSubmit={handleCreate} style={{ display:'flex', gap:8 }}>
          <input value={nome} onChange={e=> setNome(e.target.value)} placeholder='Nova unidade...' />
          <button className='btn-primary' type='submit'>Adicionar</button>
        </form>
      </div>
      {error && <div className='alert alert-danger'>{error}</div>}
      {success && <div className='alert alert-success'>{success}</div>}

      <div className='table-container'>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>Criada em</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {unidades.map(u => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.nome}</td>
                <td>{new Date(u.created_at).toLocaleString()}</td>
                <td>
                  <button className='btn-small btn-danger' onClick={()=> handleDelete(u.id)}>Remover</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {unidades.length===0 && <div className='empty-state'>Nenhuma unidade cadastrada/importada ainda.</div>}
      </div>
      <p style={{ marginTop:24, fontSize:13, opacity:.8 }}>As unidades exibidas aqui podem ter sido criadas manualmente ou durante importações de Planos (Anexo II). Use esta página para conferir o ID preciso a ser referenciado em estágios.</p>
    </Layout>
  )
}

export default Unidades
