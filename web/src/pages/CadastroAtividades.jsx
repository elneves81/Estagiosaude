import React, { useEffect, useMemo, useState } from 'react'
import { DESCRICOES_SUGERIDAS } from '../constants/descricoes'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import Modal from '../components/Modal'

const API_URL = (import.meta.env && import.meta.env.VITE_API_URL) || ''

function CadastroAtividades() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [estagios, setEstagios] = useState([])
  const [instituicoes, setInstituicoes] = useState([])
  const [cursos, setCursos] = useState([])
  const [unidades, setUnidades] = useState([])
  const [supervisores, setSupervisores] = useState([])
  const [atividades, setAtividades] = useState([]) // listadas da API /vagas
  const [stats, setStats] = useState({ total: 0, total_vagas: 0 })
  const [filters, setFilters] = useState({ q: '', unidade: '', supervisor: '', dia: '', exercicio: '' })
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null) // objeto da atividade (quando editar)

  const [formData, setFormData] = useState({
    estagio_id: '',
    unidade_setor: '',
    disciplina: '',
    descricao: '',
    nivel: '',
    data_inicio: '',
    data_fim: '',
    horario: '',
    dias_semana: '',
    quantidade_grupos: '',
    num_estagiarios_por_grupo: '',
    carga_horaria_individual: '',
    supervisor_nome: '',
    supervisor_conselho: '',
    valor: '',
  })

  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }
    
    fetchUserInfo(token)
    fetchData()
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
        const userData = await response.json()
        setUser(userData)
      } else {
        navigate('/login')
      }
    } catch (err) {
      console.error('Erro ao buscar dados do usuário:', err)
      navigate('/login')
    } finally {
      setLoading(false)
    }
  }

  const fetchData = async () => {
    try {
      const [estagiosRes, instituicoesRes, cursosRes, unidadesRes, supervisoresRes] = await Promise.all([
        fetch(`${API_URL}/estagios`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/instituicoes`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/cursos`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/unidades`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/supervisores`, { headers: getAuthHeaders() })
      ])

      const [estagiosData, instituicoesData, cursosData, unidadesData, supervisoresData] = await Promise.all([
        estagiosRes.ok ? estagiosRes.json() : [],
        instituicoesRes.ok ? instituicoesRes.json() : [],
        cursosRes.ok ? cursosRes.json() : [],
        unidadesRes.ok ? unidadesRes.json() : [],
        supervisoresRes.ok ? supervisoresRes.json() : []
      ])

      setEstagios(estagiosData)
      setInstituicoes(instituicoesData)
      setCursos(cursosData)
      setUnidades(unidadesData)
      setSupervisores(supervisoresData)
      await fetchAtividades() // carrega lista inicial
    } catch (err) {
      console.error('Erro ao buscar dados:', err)
    }
  }

  const fetchAtividades = async () => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v) })
    try {
      const res = await fetch(`${API_URL}/vagas?${params.toString()}`, { headers: getAuthHeaders() })
      if (res.ok) {
        const data = await res.json()
        setAtividades(data.items || [])
        setStats({ total: data.total || 0, total_vagas: data.total_vagas || 0 })
      }
    } catch (e) {
      console.error('Erro ao listar atividades:', e)
    }
  }

  // Helpers: horário
  const formatSegment = (digits) => {
    if (!digits) return ''
    const d = digits.slice(0, 4)
    if (d.length <= 2) return d
    if (d.length <= 4) return `${d.slice(0,2)}:${d.slice(2)}`
    return `${d.slice(0,2)}:${d.slice(2,4)}`
  }
  const maskHorario = (str) => {
    const digits = (str || '').replace(/\D/g, '').slice(0, 8)
    const part1 = digits.slice(0, 4)
    const part2 = digits.slice(4, 8)
    const s1 = formatSegment(part1)
    const s2 = formatSegment(part2)
    return part2.length ? `${s1} às ${s2}` : s1
  }
  const normalizarHora = (str) => {
    if (!str) return ''
    const s = (str || '')
      .toLowerCase()
      .normalize('NFD').replace(/\p{Diacritic}/gu, '')
      .replace(/\s*-\s*/g, ' as ')
      .replace(/\s*a\s*/g, ' as ')
      .replace(/\s+/g, ' ')
      .trim()
    const parts = s.split(/\sas\s/)
    const digits = (txt) => (txt.match(/\d+/g) || []).join('')
    const toHHMM = (txt) => {
      const d = digits(txt)
      let hh = 0, mm = 0
      if (d.length >= 4) { hh = parseInt(d.slice(0,2),10); mm = parseInt(d.slice(2,4),10) }
      else if (d.length === 3) { hh = parseInt(d[0],10); mm = parseInt(d.slice(1),10) }
      else if (d.length === 2) { hh = parseInt(d,10); mm = 0 }
      hh = Math.max(0, Math.min(23, isNaN(hh)?0:hh))
      mm = Math.max(0, Math.min(59, isNaN(mm)?0:mm))
      return `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`
    }
    if (parts.length === 2) {
      return `${toHHMM(parts[0])} às ${toHHMM(parts[1])}`
    }
    const all = digits(s)
    if (all.length >= 8) {
      const h1 = `${all.slice(0,2)}:${all.slice(2,4)}`
      const h2 = `${all.slice(4,6)}:${all.slice(6,8)}`
      return `${h1} às ${h2}`
    }
    return str.trim()
  }
  const horarioValido = (h) => {
    if (!h) return true
    const norm = (h || '')
      .toLowerCase()
      .normalize('NFD').replace(/\p{Diacritic}/gu, '')
      .replace(/\s*-\s*/g, ' as ')
      .replace(/\s*a\s*/g, ' as ')
      .replace(/\s+/g, ' ')
      .trim()
    const parts = norm.split(/\sas\s/)
    if (parts.length !== 2) return false
    const parseHHMM = (p) => {
      const pm = p.match(/(\d{1,2})[:h]?(\d{2})?/)
      if (!pm) return null
      let hh = parseInt(pm[1], 10)
      let mm = pm[2] !== undefined ? parseInt(pm[2], 10) : 0
      if (!pm[2]) {
        const digits = (p.match(/\d+/g) || []).join('')
        if (digits.length === 3) { hh = parseInt(digits[0],10); mm = parseInt(digits.slice(1),10) }
        if (digits.length === 4) { hh = parseInt(digits.slice(0,2),10); mm = parseInt(digits.slice(2),10) }
      }
      hh = Math.max(0, Math.min(23, isNaN(hh) ? 0 : hh))
      mm = Math.max(0, Math.min(59, isNaN(mm) ? 0 : mm))
      return hh*60 + mm
    }
    const ini = parseHHMM(parts[0])
    const fim = parseHHMM(parts[1])
    if (ini === null || fim === null) return false
    return ini < fim
  }

  // Preview simples baseado nos campos informados (não interfere no cálculo oficial do backend)
  const previewHoras = useMemo(() => {
    const g = parseInt(formData.quantidade_grupos || '0', 10)
    const p = parseInt(formData.num_estagiarios_por_grupo || '0', 10)
    const ch = parseFloat((formData.carga_horaria_individual || '0').toString().replace(',', '.'))
    if (!g || !p || !ch) return 0
    return g * p * ch
  }, [formData])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: name === 'horario' ? maskHorario(value) : value }))
  }

  const handleAddAtividade = () => {
    setFormData({
      estagio_id: '', unidade_setor: '', disciplina: '', descricao: '', nivel: '', data_inicio: '', data_fim: '', horario: '', dias_semana: '', quantidade_grupos: '', num_estagiarios_por_grupo: '', carga_horaria_individual: '', supervisor_nome: '', supervisor_conselho: '', valor: ''
    })
    setEditingItem(null)
    setShowModal(true)
  }

  const handleEditAtividade = (item) => {
    // item vem da lista /vagas; mapeia para formData
    setFormData({
      estagio_id: '', // desconhecido a partir da listagem de vagas
      unidade_setor: item.unidade_setor || '',
      disciplina: item.disciplina || '',
      descricao: item.descricao || '',
      nivel: item.nivel || '',
      data_inicio: item.data_inicio || '',
      data_fim: item.data_fim || '',
      horario: item.horario || '',
      dias_semana: item.dias_semana || '',
      quantidade_grupos: item.quantidade_grupos || '',
      num_estagiarios_por_grupo: item.num_estagiarios_por_grupo || '',
      carga_horaria_individual: (item.carga_horaria_individual ?? '').toString(),
      supervisor_nome: item.supervisor_nome || '',
      supervisor_conselho: item.supervisor_conselho || '',
      valor: item.valor || ''
    })
    setEditingItem(item)
    setShowModal(true)
  }

  const resolveAnexoId = async (estagioId) => {
    if (!estagioId) return null
    try {
      const res = await fetch(`${API_URL}/anexo2/${estagioId}`, { headers: getAuthHeaders() })
      if (res.ok) {
        const j = await res.json()
        return j.id || null
      }
    } catch {}
    return null
  }

  const handleSaveAtividade = async () => {
    // validações básicas
    if (!formData.unidade_setor || !formData.disciplina) {
      alert('Informe Unidade/Setor e Disciplina')
      return
    }
    if (formData.horario && !horarioValido(formData.horario)) {
      alert('Horário inválido. Use HH:MM às HH:MM e fim > início.')
      return
    }
    setSaving(true)
    try {
      const payload = { ...formData, horario: normalizarHora(formData.horario) }
      // incluir anexo2_id se possível
      const anexo2_id = await resolveAnexoId(formData.estagio_id)
      if (anexo2_id) payload.anexo2_id = anexo2_id

      if (editingItem?.id) {
        // editar: PATCH campos alteráveis
        const res = await fetch(`${API_URL}/anexo2/atividades/${editingItem.id}`, {
          method: 'PATCH', headers: getAuthHeaders(), body: JSON.stringify(payload)
        })
        if (!res.ok) throw new Error((await res.json().catch(()=>({}))).detail || 'Falha ao atualizar atividade')
      } else {
        // criar: POST com tratamento de duplicata (409)
        const doCreate = async (force = false) => {
          const body = force ? { ...payload, force_create: true } : payload
          const res = await fetch(`${API_URL}/anexo2/atividades`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(body) })
          if (res.status === 409) {
            const j = await res.json().catch(()=>({}))
            if (j && j.detail && j.detail.message) {
              const proceed = confirm(`${j.detail.message}.\nUnidade: ${j.detail.existing_vaga?.unidade}\nDisciplina: ${j.detail.existing_vaga?.disciplina}\nHorário: ${j.detail.existing_vaga?.horario}\n\nDeseja criar mesmo assim?`)
              if (proceed) return doCreate(true)
              return false
            }
          }
          if (!res.ok) throw new Error((await res.json().catch(()=>({}))).detail || 'Falha ao criar atividade')
          return true
        }
        const ok = await doCreate(false)
        if (!ok) return
      }
      setShowModal(false)
      setEditingItem(null)
      await fetchAtividades()
    } catch (e) {
      alert(e.message || 'Erro ao salvar atividade')
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveAtividade = async (item) => {
    if (!item?.id) return
    if (!confirm('Deseja remover esta atividade?')) return
    try {
      const res = await fetch(`${API_URL}/anexo2/atividades/${item.id}`, { method: 'DELETE', headers: getAuthHeaders() })
      if (!res.ok) throw new Error('Falha ao remover atividade')
      await fetchAtividades()
    } catch (e) {
      alert(e.message || 'Erro ao remover')
    }
  }

  // Sugestão autofill a partir da unidade
  const sugerirPorUnidade = async () => {
    const nome = formData.unidade_setor?.trim()
    if (!nome) return
    try {
      const res = await fetch(`${API_URL}/anexo2/atividades/suggest-autofill?unidade_setor=${encodeURIComponent(nome)}`, { headers: getAuthHeaders() })
      if (res.ok) {
        const j = await res.json()
        if (j.found && j.suggestions) {
          const s = j.suggestions
          setFormData(prev => ({
            ...prev,
            horario: s.horario || prev.horario,
            dias_semana: s.dias_semana || prev.dias_semana,
            supervisor_nome: s.supervisor_nome || prev.supervisor_nome,
            supervisor_conselho: s.supervisor_conselho || prev.supervisor_conselho,
            nivel: s.nivel || prev.nivel,
            quantidade_grupos: s.quantidade_grupos ?? prev.quantidade_grupos,
            num_estagiarios_por_grupo: s.num_estagiarios_por_grupo ?? prev.num_estagiarios_por_grupo,
            valor: s.valor ?? prev.valor
          }))
        }
      }
    } catch {}
  }

  if (loading) {
    return <div className="loading">Carregando...</div>
  }

  return (
    <Layout user={user}>
      <div className="page-header">
        <h1>Cadastro Manual de Atividades - Anexo II</h1>
        <p>Insira diretamente as informações das atividades de estágio</p>
      </div>

      <div className="cadastro-atividades">
        <div className="actions-header" style={{justifyContent:'space-between', flexWrap:'wrap'}}>
          <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
            <button onClick={handleAddAtividade} className="btn-primary">➕ Nova atividade</button>
          </div>
          <div className="vagas-stats">
            <span>Total atividades: {stats.total}</span>
            <span className="total-vagas">Vagas: {stats.total_vagas}</span>
          </div>
        </div>

        <div className="vagas-filters">
          <div className="filters-grid">
            <div className="filter-group">
              <label>Busca</label>
              <input value={filters.q} onChange={(e)=> setFilters(f=>({...f, q:e.target.value}))} onBlur={fetchAtividades} placeholder="Unidade, Disciplina, Descrição..." />
            </div>
            <div className="filter-group">
              <label>Unidade</label>
              <input list="unidades-list" value={filters.unidade} onChange={(e)=> setFilters(f=>({...f, unidade:e.target.value}))} onBlur={fetchAtividades} />
              <datalist id="unidades-list">{unidades.map(u=>(<option key={u.id} value={u.nome} />))}</datalist>
            </div>
            <div className="filter-group">
              <label>Supervisor</label>
              <input list="supervisores-list" value={filters.supervisor} onChange={(e)=> setFilters(f=>({...f, supervisor:e.target.value}))} onBlur={fetchAtividades} />
              <datalist id="supervisores-list">{supervisores.map(s=>(<option key={s.id} value={s.nome} />))}</datalist>
            </div>
            <div className="filter-group">
              <label>Dia</label>
              <input value={filters.dia} onChange={(e)=> setFilters(f=>({...f, dia:e.target.value}))} onBlur={fetchAtividades} placeholder="Seg, Ter..." />
            </div>
            <div className="filter-group">
              <label>Exercício</label>
              <input value={filters.exercicio} onChange={(e)=> setFilters(f=>({...f, exercicio:e.target.value}))} onBlur={fetchAtividades} placeholder="2025" />
            </div>
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Unidade/Setor</th>
                <th>Disciplina</th>
                <th>Descrição</th>
                <th>Dia</th>
                <th>Horário</th>
                <th>Grupos</th>
                <th>Por grupo</th>
                <th>Vagas</th>
                <th>CH Ind.</th>
                <th>Supervisor</th>
                <th>Valor</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {atividades.map((a)=>(
                <tr key={a.id}>
                  <td>{a.unidade_setor}</td>
                  <td>{a.disciplina}</td>
                  <td>{a.descricao}</td>
                  <td>{a.dias_semana}</td>
                  <td>{a.horario}</td>
                  <td style={{textAlign:'right'}}>{a.quantidade_grupos || 0}</td>
                  <td style={{textAlign:'right'}}>{a.num_estagiarios_por_grupo || 0}</td>
                  <td style={{textAlign:'right'}}>{a.vagas || 0}</td>
                  <td style={{textAlign:'right'}}>{a.carga_horaria_individual}</td>
                  <td>{a.supervisor_nome}</td>
                  <td style={{textAlign:'right'}}>{a.valor}</td>
                  <td>
                    <button className="btn-small btn-secondary" onClick={()=> handleEditAtividade(a)}>Editar</button>
                    <button className="btn-small btn-danger" onClick={()=> handleRemoveAtividade(a)}>Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {atividades.length === 0 && (
            <div className="empty-state"><p>Nenhuma atividade encontrada.</p></div>
          )}
        </div>
      </div>

      <Modal isOpen={showModal} onClose={()=> setShowModal(false)} title={editingItem ? 'Editar Atividade' : 'Nova Atividade'} size="large" closeOnOverlayClick={false} closeOnEsc={false}>
        <div style={{padding: '1rem'}}>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem'}}>
            <div className="form-group">
              <label>Estágio</label>
              <select name="estagio_id" value={formData.estagio_id} onChange={handleInputChange}>
                <option value="">Selecione...</option>
                {estagios.map(e => <option key={e.id} value={e.id}>{e.id} - {e.nome || e.email}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Unidade/Setor</label>
              <div style={{display: 'flex', gap: '4px'}}>
                <input name="unidade_setor" list="unidades-list-modal" value={formData.unidade_setor} onChange={handleInputChange} style={{flex: 1}} />
                <button type="button" onClick={sugerirPorUnidade} className="btn-small btn-secondary">Sugerir</button>
                <datalist id="unidades-list-modal">{unidades.map(u => <option key={u.id} value={u.nome} />)}</datalist>
              </div>
            </div>
            <div className="form-group">
              <label>Disciplina</label>
              <input name="disciplina" list="disciplinas-sugeridas" value={formData.disciplina} onChange={handleInputChange} />
              <datalist id="disciplinas-sugeridas">
                {['Saúde Coletiva','Cuidados Integrais','Cuidados Integrais I','Cuidados Integrais II','Urgência e Emergência','Saúde da Criança'].map(d => <option key={d} value={d} />)}
              </datalist>
            </div>
            <div className="form-group" style={{gridColumn: '1 / -1'}}>
              <label>Descrição (mínimo 5)</label>
              <input name="descricao" list="descricoes-sugeridas" value={formData.descricao} onChange={handleInputChange} placeholder="Sinais vitais, curativos, injeções, ..." />
              <datalist id="descricoes-sugeridas">{DESCRICOES_SUGERIDAS.map(d => <option key={d} value={d} />)}</datalist>
            </div>
            <div className="form-group">
              <label>Nível</label>
              <select name="nivel" value={formData.nivel} onChange={handleInputChange}>
                <option value="">Selecione...</option>
                <option value="G">G</option>
                <option value="I">I</option>
                <option value="PG">PG</option>
                <option value="M">M</option>
              </select>
            </div>
            <div className="form-group"><label>Início</label><input type="date" name="data_inicio" value={formData.data_inicio} onChange={handleInputChange} /></div>
            <div className="form-group"><label>Fim</label><input type="date" name="data_fim" value={formData.data_fim} onChange={handleInputChange} /></div>
            <div className="form-group"><label>Horário</label><input name="horario" value={formData.horario} onChange={handleInputChange} onBlur={e=> setFormData(p=>({...p, horario: normalizarHora(e.target.value)}))} placeholder="08:00 às 15:00" /></div>
            <div className="form-group"><label>Dias da semana</label><input name="dias_semana" value={formData.dias_semana} onChange={handleInputChange} placeholder="Seg, Ter, Qua" /></div>
            <div className="form-group"><label>Qtd grupos</label><input type="number" name="quantidade_grupos" value={formData.quantidade_grupos} onChange={handleInputChange} /></div>
            <div className="form-group"><label>Estagiários/Grupo</label><input type="number" name="num_estagiarios_por_grupo" value={formData.num_estagiarios_por_grupo} onChange={handleInputChange} /></div>
            <div className="form-group"><label>CH Individual</label><input name="carga_horaria_individual" value={formData.carga_horaria_individual} onChange={handleInputChange} placeholder="80" /></div>
            <div className="form-group"><label>Supervisor</label><input name="supervisor_nome" list="supervisores-list-modal" value={formData.supervisor_nome} onChange={handleInputChange} /></div>
            <div className="form-group"><label>Nº Conselho</label><input name="supervisor_conselho" value={formData.supervisor_conselho} onChange={handleInputChange} /></div>
            <datalist id="supervisores-list-modal">{supervisores.map(s=> <option key={s.id} value={s.nome} />)}</datalist>
            <div className="form-group"><label>Valor</label><input name="valor" value={formData.valor} onChange={handleInputChange} placeholder="R$ 400,00" /></div>
            <div className="form-group" style={{gridColumn: '1 / -1', background: '#f0f8ff', padding: '1rem', borderRadius: '4px', border: '2px solid #007bff'}}>
              <label>Preview Total Horas</label>
              <div style={{fontSize: '1.2rem', color: '#007bff', fontWeight: 'bold'}}>{previewHoras}h</div>
            </div>
          </div>
          <div className="modal-actions">
            <button className="btn-secondary" type="button" onClick={()=> setShowModal(false)}>Cancelar</button>
            <button className="btn-primary" type="button" onClick={handleSaveAtividade} disabled={saving}>{saving? 'Salvando...' : (editingItem? 'Atualizar' : 'Adicionar')}</button>
          </div>
        </div>
      </Modal>

      <style>{`
        .cadastro-atividades {
          max-width: 1200px;
          margin: 0 auto;
        }

        .actions-header {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          align-items: center;
        }

        .atividades-lista {
          background: white;
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-bottom: 2rem;
        }

        .atividades-lista h3 {
          margin-bottom: 1rem;
          color: #333;
        }

        .table-responsive {
          overflow-x: auto;
        }

        .table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 1rem;
        }

        .table th,
        .table td {
          padding: 0.75rem;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }

        .table th {
          background-color: #f8f9fa;
          font-weight: 600;
        }

        .total-horas {
          text-align: right;
          font-size: 1.2rem;
          color: #007bff;
          border-top: 2px solid #007bff;
          padding-top: 1rem;
        }

        .empty-state {
          text-align: center;
          padding: 3rem;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .empty-state p {
          color: #666;
          margin-bottom: 0.5rem;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 8px;
          width: 90%;
          max-height: 90%;
          overflow-y: auto;
        }

        .modal-large {
          max-width: 800px;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #ddd;
        }

        .modal-header h3 {
          margin: 0;
        }

        .btn-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #666;
        }

        .modal-body {
          padding: 1.5rem;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group label {
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #333;
        }

        .form-group input,
        .form-group select {
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
        }

        .calculo-preview {
          grid-column: 1 / -1;
          background: #f8f9fa;
          padding: 1rem;
          border-radius: 4px;
          border: 2px solid #007bff;
        }

        .calculo-resultado {
          font-size: 1.2rem;
          color: #007bff;
        }

        .calculo-resultado small {
          display: block;
          font-size: 0.9rem;
          color: #666;
          margin-top: 0.5rem;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          padding: 1.5rem;
          border-top: 1px solid #ddd;
        }

        .btn-sm {
          padding: 0.25rem 0.5rem;
          margin: 0 0.25rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.875rem;
        }

        .btn-primary {
          background: #007bff;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
        }

        .btn-success {
          background: #28a745;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
        }

        .btn-danger {
          background: #dc3545;
          color: white;
        }

        .btn-primary:hover {
          background: #0056b3;
        }

        .btn-secondary:hover {
          background: #545b62;
        }

        .btn-success:hover {
          background: #1e7e34;
        }

        .btn-danger:hover {
          background: #c82333;
        }

        .btn-primary:disabled,
        .btn-success:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
          
          .actions-header {
            flex-direction: column;
            align-items: stretch;
          }
          
          .modal-content {
            width: 95%;
            margin: 1rem;
          }
        }
      `}</style>
    </Layout>
  )
}

export default CadastroAtividades