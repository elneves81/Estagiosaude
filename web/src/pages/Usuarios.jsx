// Página de gestão de usuários
import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import Modal from '../components/Modal'

// Use Vite env like other pages to avoid undefined in build/runtime
const API_URL = (import.meta.env && import.meta.env.VITE_API_URL) || ''

function Usuarios() {
  const [user, setUser] = useState(null)
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editUser, setEditUser] = useState(null)
  const [deleteUser, setDeleteUser] = useState(null)
  const [instituicoes, setInstituicoes] = useState([])
  const [instLoading, setInstLoading] = useState(false)
  const [instFilter, setInstFilter] = useState('')
  
  const [formData, setFormData] = useState({
    email: '',
    nome: '',
    password: '',
    tipo: 'escola'
  })

  // Validação de email
  const validarEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(email)
  }

  // Validação de senha
  const validarSenha = (senha) => {
    return senha.length >= 6
  }

  useEffect(() => {
    fetchUserInfo()
    fetchUsuarios()
  }, [])

  // Carregar instituições quando abrir o modal de edição
  useEffect(() => {
    if (editUser) {
      fetchInstituicoes()
    }
  }, [editUser])

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

  const fetchUsuarios = async () => {
    try {
      const response = await fetch(`${API_URL}/usuarios`, {
        headers: getAuthHeaders()
      })
      if (response.ok) {
        const data = await response.json()
        setUsuarios(data)
      } else if (response.status === 403) {
        setError('Sem permissão para listar usuários')
      }
    } catch (err) {
      setError('Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }

  const fetchInstituicoes = async () => {
    try {
      setInstLoading(true)
      const res = await fetch(`${API_URL}/instituicoes`, { headers: getAuthHeaders() })
      if (res.ok) {
        const data = await res.json()
        setInstituicoes(Array.isArray(data) ? data : [])
      }
    } catch (e) {
      // silenciar no modal
    } finally {
      setInstLoading(false)
    }
  }

  const handleToggleAtivo = async (usuario, novoAtivo) => {
    setError(''); setSuccess('')
    try {
      const res = await fetch(`${API_URL}/usuarios/${usuario.id}/ativo`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ativo: !!novoAtivo })
      })
      if (!res.ok) {
        const j = await res.json().catch(()=>({}))
        throw new Error(j.detail || `Falha ao atualizar status (${res.status})`)
      }
      setSuccess(`Usuário ${novoAtivo ? 'ativado' : 'desativado'} com sucesso`)
      fetchUsuarios()
    } catch (e) {
      setError(e.message || 'Erro ao atualizar status')
    }
  }

  const submitEdit = async (e) => {
    e.preventDefault()
    if (!editUser) return
    setError(''); setSuccess('')
    const payload = {
      nome: editUser.nome,
      email: editUser.email,
      tipo: editUser.tipo,
      instituicao_id: editUser.tipo === 'escola' ? (editUser.instituicao_id || null) : null,
    }
    if (editUser.password && editUser.password.trim().length >= 6) {
      payload.password = editUser.password
    }
    try {
      const res = await fetch(`${API_URL}/usuarios/${editUser.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const j = await res.json().catch(()=>({}))
        throw new Error(j.detail || `Falha ao salvar (${res.status})`)
      }
      setSuccess('Usuário atualizado com sucesso!')
      setEditUser(null)
      fetchUsuarios()
    } catch (e) {
      setError(e.message || 'Erro ao salvar')
    }
  }

  const confirmDelete = async () => {
    if (!deleteUser) return
    setError(''); setSuccess('')
    try {
      const res = await fetch(`${API_URL}/usuarios/${deleteUser.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
      if (!res.ok) {
        const j = await res.json().catch(()=>({}))
        throw new Error(j.detail || `Falha ao remover (${res.status})`)
      }
      setSuccess('Usuário removido com sucesso!')
      setDeleteUser(null)
      fetchUsuarios()
    } catch (e) {
      setError(e.message || 'Erro ao remover')
    }
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

    if (!validarSenha(formData.password)) {
      setError('A senha deve ter pelo menos 6 caracteres')
      return
    }

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setSuccess('Usuário criado com sucesso!')
        setShowForm(false)
        setFormData({ email: '', nome: '', password: '', tipo: 'escola' })
        fetchUsuarios()
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'Erro ao criar usuário')
      }
    } catch (err) {
      setError('Erro de conexão')
    }
  }

  if (loading) return <div className="loading">Carregando usuários...</div>

  return (
    <Layout user={user}>
      <div className="page-header">
        <h1>Gestão de Usuários</h1>
        <button 
          className="btn-primary" 
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancelar' : '+ Novo Usuário'}
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {showForm && (
        <div className="form-container">
          <h3>Novo Usuário</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="required">Nome completo:</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  placeholder="Ex: João Silva"
                  required
                />
                <div className="form-help">Nome completo do usuário (obrigatório)</div>
              </div>
              <div className="form-group">
                <label className="required">E-mail:</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="Ex: usuario@instituicao.com"
                  required
                />
                <div className="form-help">E-mail que será usado para login (obrigatório)</div>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label className="required">Senha:</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="Mínimo 6 caracteres"
                  minLength="6"
                  required
                />
                <div className="form-help">Senha deve ter pelo menos 6 caracteres (obrigatório)</div>
              </div>
              <div className="form-group">
                <label className="required">Tipo de usuário:</label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                  required
                >
                  <option value="escola">Escola - Pode cadastrar estágios</option>
                  <option value="supervisor">Supervisor - Pode supervisionar estágios</option>
                  <option value="admin">Administrador - Acesso total ao sistema</option>
                </select>
                <div className="form-help">Define as permissões do usuário no sistema</div>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">Criar Usuário</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Tipo</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario) => (
              <tr key={usuario.id}>
                <td>{usuario.nome}</td>
                <td>{usuario.email}</td>
                <td>
                  <span className={`badge badge-${usuario.tipo}`}>
                    {usuario.tipo}
                  </span>
                </td>
                <td>
                  <span className={`badge ${usuario.ativo ? 'badge-success' : 'badge-danger'}`}>
                    {usuario.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    <button type="button" className="btn-small btn-secondary" onClick={(e) => { e.stopPropagation(); setEditUser({ ...usuario, password: '' }); }}>Editar</button>
                    {usuario.ativo ? (
                      <button type="button" className="btn-small btn-warning" onClick={(e) => { e.stopPropagation(); handleToggleAtivo(usuario, false); }}>Desativar</button>
                    ) : (
                      <button type="button" className="btn-small btn-success" onClick={(e) => { e.stopPropagation(); handleToggleAtivo(usuario, true); }}>Ativar</button>
                    )}
                    <button type="button" className="btn-small btn-danger" onClick={(e) => { e.stopPropagation(); setDeleteUser(usuario); }}>Remover</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={!!editUser} onClose={() => setEditUser(null)} title="Editar Usuário" closeOnOverlayClick>
        {editUser && (
          <form onSubmit={submitEdit} className="form-grid">
            <div className="form-row">
              <div className="form-group">
                <label>Nome</label>
                <input value={editUser.nome||''} onChange={(e)=> setEditUser({ ...editUser, nome: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>E-mail</label>
                <input type="email" value={editUser.email||''} onChange={(e)=> setEditUser({ ...editUser, email: e.target.value })} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Tipo</label>
                <select value={editUser.tipo||'escola'} onChange={(e)=> setEditUser({ ...editUser, tipo: e.target.value })}>
                  <option value="escola">Escola</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div className="form-group">
                <label>Nova senha (opcional)</label>
                <input type="password" value={editUser.password||''} onChange={(e)=> setEditUser({ ...editUser, password: e.target.value })} placeholder="Deixe em branco para não alterar" />
                <small className="form-help">Mínimo 6 caracteres para alterar</small>
              </div>
            </div>
            {editUser.tipo === 'escola' && (
              <div className="form-row">
                <div className="form-group">
                  <label>Instituição (usuário ESCOLA)</label>
                  <input
                    type="text"
                    value={instFilter}
                    onChange={(e)=> setInstFilter(e.target.value)}
                    placeholder="Digite para filtrar instituições"
                  />
                  <select
                    value={editUser.instituicao_id || ''}
                    onChange={(e)=> setEditUser({ ...editUser, instituicao_id: e.target.value ? Number(e.target.value) : null })}
                    disabled={instLoading || instituicoes.length === 0}
                  >
                    <option value="">-- Selecione a instituição --</option>
                    {(instituicoes || [])
                      .filter(i => !instFilter || (i.nome || '').toUpperCase().includes(instFilter.toUpperCase()))
                      .map(i => (
                        <option key={i.id} value={i.id}>{i.nome}</option>
                      ))}
                  </select>
                  <div className="form-help">
                    {instLoading ? 'Carregando instituições...' : (editUser.instituicao_id ? `Selecionada: ${(instituicoes.find(i=>i.id===editUser.instituicao_id)||{}).nome || '---'}` : 'Nenhuma selecionada')}
                  </div>
                </div>
              </div>
            )}
            <div className="form-actions">
              <button type="submit" className="btn-primary">Salvar</button>
              <button type="button" className="btn-secondary" onClick={()=> setEditUser(null)}>Cancelar</button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={!!deleteUser} onClose={() => setDeleteUser(null)} title="Remover Usuário" closeOnOverlayClick>
        {deleteUser && (
          <div>
            <p>Tem certeza que deseja remover o usuário <strong>{deleteUser.nome}</strong> ({deleteUser.email})?</p>
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
              <button className="btn-secondary" onClick={() => setDeleteUser(null)}>Cancelar</button>
              <button className="btn-danger" onClick={confirmDelete}>Remover</button>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  )
}

export default Usuarios