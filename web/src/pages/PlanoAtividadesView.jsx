import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
import '../styles/PlanoAtividadesView.css'

const API_URL = (import.meta.env && import.meta.env.VITE_API_URL) || ''

export default function PlanoAtividadesView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const estagioId = parseInt(id || '0', 10)

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [plano, setPlano] = useState(null) // { id, instituicao_ensino, curso, exercicio, status, atividades: [] }
  const [reportHtml, setReportHtml] = useState('')
  const [viewMode, setViewMode] = useState('quadro') // 'quadro' | 'tabela' | 'relatorio'
  const [filtro, setFiltro] = useState({ unidade: '', curso: '', supervisor: '', busca: '' })
  const [editingActivity, setEditingActivity] = useState(null)
  const [catalogos, setCatalogos] = useState({ unidades: [], supervisores: [] })

  // Modais e formulários
  const [showHeaderModal, setShowHeaderModal] = useState(false)
  const [headerForm, setHeaderForm] = useState({ instituicao_ensino: '', curso: '', exercicio: '', status: 'final' })
  const [showCloneModal, setShowCloneModal] = useState(false)
  const [cloneSel, setCloneSel] = useState({ todas: false, instituicoes: [], replace: false })
  const [showNovaAtvModal, setShowNovaAtvModal] = useState(false)
  const [novaAtv, setNovaAtv] = useState({ unidade_setor: '', disciplina: '', nivel: '', data_inicio: '', data_fim: '', horario: '', dias_semana: '', quantidade_grupos: '', num_estagiarios_por_grupo: '', carga_horaria_individual: '', supervisor_nome: '', supervisor_conselho: '', territorio: '' })
  const [rowError, setRowError] = useState('')
  const [savingRow, setSavingRow] = useState(false)

  // Catálogos de instituições e cursos (para datalists no cabeçalho)
  const [catInstituicoes, setCatInstituicoes] = useState([])
  const [catCursos, setCatCursos] = useState([])
  const [catCursosFiltrados, setCatCursosFiltrados] = useState([])

  const [showStatsModal, setShowStatsModal] = useState(false)

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  })

  useEffect(() => {
    if (!estagioId || Number.isNaN(estagioId)) {
      setError('ID de estágio inválido.')
      setLoading(false)
      return
    }
    const init = async () => {
      setLoading(true)
      setError('')
      try {
        // Fetch user
        try {
          const me = await fetch(`${API_URL}/auth/me`, { headers: getAuthHeaders() })
          if (me.ok) setUser(await me.json())
        } catch {}

        // Fetch plano
        const res = await fetch(`${API_URL}/anexo2/${estagioId}`, { headers: getAuthHeaders() })
        if (res.ok) {
          const data = await res.json()
          setPlano(data)
        } else if (res.status === 404) {
          setPlano(null)
        } else {
          const t = await res.text().catch(()=>'')
          throw new Error(t || `Falha ao carregar plano (HTTP ${res.status})`)
        }

        // Fetch HTML report for inline preview
        try {
          const rep = await fetch(`${API_URL}/relatorios/anexo2/${estagioId}?format=html`, { headers: getAuthHeaders() })
          if (rep.ok) setReportHtml(await rep.text())
        } catch {}

        // Fetch catálogos para autocomplete (unidades, supervisores, instituições, cursos)
        try {
          const [uniRes, supRes, instRes, cursosRes] = await Promise.all([
            fetch(`${API_URL}/unidades`, { headers: getAuthHeaders() }),
            fetch(`${API_URL}/supervisores`, { headers: getAuthHeaders() }),
            fetch(`${API_URL}/instituicoes`, { headers: getAuthHeaders() }),
            fetch(`${API_URL}/cursos`, { headers: getAuthHeaders() })
          ])
          const unidades = uniRes.ok ? await uniRes.json() : []
          const supervisores = supRes.ok ? await supRes.json() : []
          const instituicoes = instRes?.ok ? await instRes.json() : []
          const cursos = cursosRes?.ok ? await cursosRes.json() : []
          setCatalogos({ unidades, supervisores })
          setCatInstituicoes(instituicoes)
          setCatCursos(cursos)
          setCatCursosFiltrados((cursos || []).map(c => c?.nome || '').filter(Boolean))
        } catch {}
      } catch (e) {
        setError(e?.message || 'Erro ao carregar dados')
      } finally {
        setLoading(false)
      }
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estagioId])

  const exportCSV = () => {
    if (!plano?.atividades?.length) return
  const headers = ['disciplina','descricao','nivel','unidade_setor','data_inicio','data_fim','horario','dias_semana','quantidade_grupos','num_estagiarios_por_grupo','carga_horaria_individual','supervisor_nome','supervisor_conselho','territorio','valor']
    const linhas = plano.atividades.map(a => headers.map(h => (a[h] ?? '')).map(v => v.toString().replace(/;/g, ',')).join(';'))
    const csv = [headers.join(';'), ...linhas].join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `plano_atividades_estagio_${estagioId}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  // Atualiza a lista de cursos conforme instituição selecionada no modal de cabeçalho
  useEffect(() => {
    const nomeSel = (headerForm?.instituicao_ensino || '').trim().toLowerCase()
    if (!nomeSel) {
      setCatCursosFiltrados((catCursos || []).map(c => c?.nome || '').filter(Boolean))
      return
    }
    try {
      const inst = (catInstituicoes || []).find(i => (i?.nome || '').trim().toLowerCase() === nomeSel)
      if (!inst) {
        setCatCursosFiltrados((catCursos || []).map(c => c?.nome || '').filter(Boolean))
        return
      }
      const filtrados = (catCursos || []).filter(c => (
        (c?.instituicao_id && c.instituicao_id === inst.id) ||
        ((c?.instituicao_nome || '').trim().toLowerCase() === nomeSel)
      )).map(c => c?.nome || '').filter(Boolean)
      setCatCursosFiltrados(filtrados.length ? filtrados : (catCursos || []).map(c => c?.nome || '').filter(Boolean))
    } catch {
      setCatCursosFiltrados((catCursos || []).map(c => c?.nome || '').filter(Boolean))
    }
  }, [headerForm?.instituicao_ensino, catCursos, catInstituicoes])

  const formatHorario = (input) => {
    const digits = String(input || '').replace(/\D/g, '').slice(0, 8)
    if (digits.length <= 2) return digits
    if (digits.length <= 4) return `${digits.slice(0,2)}:${digits.slice(2)}`
    if (digits.length <= 6) return `${digits.slice(0,2)}:${digits.slice(2,4)} às ${digits.slice(4,6)}`
    return `${digits.slice(0,2)}:${digits.slice(2,4)} às ${digits.slice(4,6)}:${digits.slice(6,8)}`
  }

  const openHeaderModal = () => {
    setHeaderForm({
      instituicao_ensino: plano?.instituicao_ensino || '',
      curso: plano?.curso || '',
      exercicio: plano?.exercicio || '',
      status: plano?.status || 'final',
    })
    setShowHeaderModal(true)
  }

  const salvarCabecalho = async () => {
    if (!plano?.id) return
    try {
      // Validar instituição de ensino conforme catálogo
      const instNome = (headerForm.instituicao_ensino || '').trim()
      if (instNome) {
        const instOk = (catInstituicoes || []).some(i => (i.nome || '').trim().toLowerCase() === instNome.toLowerCase())
        if (!instOk) {
          throw new Error('Selecione uma Instituição de Ensino válida (presente no cadastro).')
        }
      }

      // Montar payload completo para não perder atividades
      const atividades = (plano.atividades || []).map(a => ({
        disciplina: a.disciplina,
        descricao: a.descricao,
        nivel: a.nivel,
        unidade_setor: a.unidade_setor,
        data_inicio: a.data_inicio,
        data_fim: a.data_fim,
        horario: a.horario,
        dias_semana: a.dias_semana,
        quantidade_grupos: a.quantidade_grupos,
        num_estagiarios_por_grupo: a.num_estagiarios_por_grupo,
        carga_horaria_individual: a.carga_horaria_individual,
        supervisor_nome: a.supervisor_nome,
        supervisor_conselho: a.supervisor_conselho,
        valor: a.valor,
        territorio: a.territorio,
      }))
      const payload = {
        estagio_id: plano?.estagio_id || estagioId,
        instituicao_ensino: headerForm.instituicao_ensino,
        curso: headerForm.curso,
        exercicio: headerForm.exercicio,
        status: headerForm.status || 'final',
        versao: plano?.versao || 1,
        logo_url: plano?.logo_url || null,
        atividades,
      }
      const res = await fetch(`${API_URL}/anexo2/${plano.id}`, { method:'PUT', headers: getAuthHeaders(), body: JSON.stringify(payload) })
      if (!res.ok) {
        const j = await res.json().catch(()=>({}))
        throw new Error(j?.detail || 'Falha ao salvar cabeçalho')
      }
      const pr = await fetch(`${API_URL}/anexo2/${estagioId}`, { headers: getAuthHeaders() })
      if (pr.ok) setPlano(await pr.json())
      setShowHeaderModal(false)
    } catch (e) {
      alert(e?.message || 'Erro ao salvar cabeçalho')
    }
  }

  // Salva apenas campos do cabeçalho informados em "partial", preservando o restante do plano
  const salvarCabecalhoParcial = async (partial) => {
    if (!plano?.id) return
    try {
      const atividades = (plano.atividades || []).map(a => ({
        disciplina: a.disciplina,
        descricao: a.descricao,
        nivel: a.nivel,
        unidade_setor: a.unidade_setor,
        data_inicio: a.data_inicio,
        data_fim: a.data_fim,
        horario: a.horario,
        dias_semana: a.dias_semana,
        quantidade_grupos: a.quantidade_grupos,
        num_estagiarios_por_grupo: a.num_estagiarios_por_grupo,
        carga_horaria_individual: a.carga_horaria_individual,
        supervisor_nome: a.supervisor_nome,
        supervisor_conselho: a.supervisor_conselho,
        valor: a.valor,
        territorio: a.territorio,
      }))
      const payload = {
        estagio_id: plano?.estagio_id || estagioId,
        instituicao_ensino: partial.instituicao_ensino ?? plano?.instituicao_ensino ?? '',
        curso: partial.curso ?? plano?.curso ?? '',
        exercicio: partial.exercicio ?? plano?.exercicio ?? '',
        status: partial.status ?? plano?.status ?? 'final',
        versao: plano?.versao || 1,
        logo_url: plano?.logo_url || null,
        atividades,
      }
      const res = await fetch(`${API_URL}/anexo2/${plano.id}`, { method:'PUT', headers: getAuthHeaders(), body: JSON.stringify(payload) })
      if (!res.ok) {
        const j = await res.json().catch(()=>({}))
        throw new Error(j?.detail || 'Falha ao salvar alterações do cabeçalho')
      }
      const pr = await fetch(`${API_URL}/anexo2/${estagioId}`, { headers: getAuthHeaders() })
      if (pr.ok) setPlano(await pr.json())
    } catch (e) {
      alert(e?.message || 'Erro ao salvar alterações do cabeçalho')
    }
  }

  const atividadesFiltradas = () => {
    let arr = (plano?.atividades || [])
    if (filtro.unidade) arr = arr.filter(a => (a.unidade_setor||'').toLowerCase().includes(filtro.unidade.toLowerCase()))
    if (filtro.curso) arr = arr.filter(() => (plano?.curso||'').toLowerCase().includes(filtro.curso.toLowerCase()))
    if (filtro.supervisor) arr = arr.filter(a => (a.supervisor_nome||'').toLowerCase().includes(filtro.supervisor.toLowerCase()))
    if (filtro.busca) {
      const q = filtro.busca.toLowerCase()
      arr = arr.filter(a => (
        (a.disciplina||'').toLowerCase().includes(q) ||
        (a.descricao||'').toLowerCase().includes(q) ||
        (a.unidade_setor||'').toLowerCase().includes(q) ||
        (a.dias_semana||'').toLowerCase().includes(q) ||
        (a.horario||'').toLowerCase().includes(q)
      ))
    }
    return arr
  }

  const totalVagas = (list) => {
    return list.reduce((acc, a) => acc + ((parseInt(a.quantidade_grupos||0,10)||0) * (parseInt(a.num_estagiarios_por_grupo||0,10)||0)), 0)
  }

  const periodLabel = (horario) => {
    if (!horario) return '—'
    const m = String(horario).match(/(\d{2}):(\d{2}).+?(\d{2}):(\d{2})/)
    if (!m) return '—'
    const sh = parseInt(m[1], 10)
    const eh = parseInt(m[3], 10)
    const isMorning = sh < 12 && eh <= 13
    const isAfternoon = sh >= 12 && eh <= 19
    if (isMorning && !isAfternoon) return 'Manhã'
    if (!isMorning && isAfternoon) return 'Tarde'
    return 'Manhã e Tarde'
  }

  const badgeColorBy = (a) => {
    const p = periodLabel(a?.horario)
    if (p === 'Manhã') return '#E3F2FD'
    if (p === 'Tarde') return '#FFF3E0'
    if (p === 'Manhã e Tarde') return '#EDE7F6'
    return '#F5F5F5'
  }

  const gruposPorUnidade = () => {
    const map = {}
    atividadesFiltradas().forEach(a => {
      const k = a.unidade_setor || '—'
      if (!map[k]) map[k] = []
      map[k].push(a)
    })
    return Object.entries(map).sort((a,b) => a[0].localeCompare(b[0]))
  }

  const patchAtividade = async (id, field, value) => {
    try {
      const res = await fetch(`${API_URL}/anexo2/atividades/${id}`, { method:'PATCH', headers: getAuthHeaders(), body: JSON.stringify({ [field]: value }) })
      if (!res.ok) {
        const j = await res.json().catch(()=>({}))
        throw new Error(j?.detail?.message || j?.detail || `Falha ao atualizar campo ${field}`)
      }
      const pr = await fetch(`${API_URL}/anexo2/${estagioId}`, { headers: getAuthHeaders() })
      if (pr.ok) setPlano(await pr.json())
    } catch (e) {
      alert(e?.message || 'Erro ao salvar campo')
    }
  }

  const deletarAtividade = async (atividadeId) => {
    if (!confirm('Remover esta atividade?')) return
    try {
      const res = await fetch(`${API_URL}/anexo2/atividades/${atividadeId}`, { method:'DELETE', headers: getAuthHeaders() })
      if (!res.ok) {
        const j = await res.json().catch(()=>({}))
        throw new Error(j?.detail || 'Falha ao remover atividade')
      }
      const pr = await fetch(`${API_URL}/anexo2/${estagioId}`, { headers: getAuthHeaders() })
      if (pr.ok) setPlano(await pr.json())
    } catch (e) {
      alert(e?.message || 'Erro ao remover atividade')
    }
  }

  const limparAtividade = async (a) => {
    try {
      const payload = {
        disciplina: '', descricao: '', nivel: '', data_inicio: '', data_fim: '', horario: '', dias_semana: '',
        quantidade_grupos: null, num_estagiarios_por_grupo: null, carga_horaria_individual: null,
        supervisor_nome: '', supervisor_conselho: '', valor: '', territorio: '',
      }
      const res = await fetch(`${API_URL}/anexo2/atividades/${a.id}`, { method:'PATCH', headers: getAuthHeaders(), body: JSON.stringify(payload) })
      if (!res.ok) {
        const j = await res.json().catch(()=>({}))
        throw new Error(j?.detail || 'Falha ao limpar atividade')
      }
      const pr = await fetch(`${API_URL}/anexo2/${estagioId}`, { headers: getAuthHeaders() })
      if (pr.ok) setPlano(await pr.json())
    } catch (e) {
      alert(e?.message || 'Erro ao limpar atividade')
    }
  }

  const salvarNovaAtividade = async () => {
    if (!plano?.id) return
    setRowError('')
    setSavingRow(true)
    try {
      const unidadeVal = (novaAtv.unidade_setor || '').trim()
      if (!unidadeVal || unidadeVal === '—') {
        throw new Error('Selecione uma Unidade válida (existente no sistema)')
      }
      const unidadeExiste = (catalogos.unidades || []).some(u => (u.nome || '').trim().toLowerCase() === unidadeVal.toLowerCase())
      if (!unidadeExiste) {
        throw new Error(`Unidade "${unidadeVal}" não encontrada. Verifique o nome ou cadastre a unidade primeiro.`)
      }
      const payload = {
        ...novaAtv,
        anexo2_id: plano.id,
        quantidade_grupos: novaAtv.quantidade_grupos ? parseInt(novaAtv.quantidade_grupos,10) : null,
        num_estagiarios_por_grupo: novaAtv.num_estagiarios_por_grupo ? parseInt(novaAtv.num_estagiarios_por_grupo,10) : null,
      }
      const res = await fetch(`${API_URL}/anexo2/atividades`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(payload) })
      if (!res.ok) {
        const j = await res.json().catch(()=>({}))
        throw new Error(j?.detail?.message || j?.detail || `Falha ao criar atividade (HTTP ${res.status})`)
      }
      const pr = await fetch(`${API_URL}/anexo2/${estagioId}`, { headers: getAuthHeaders() })
      if (pr.ok) setPlano(await pr.json())
      setNovaAtv({ unidade_setor: '', disciplina: '', nivel: '', data_inicio: '', data_fim: '', horario: '', dias_semana: '', quantidade_grupos: '', num_estagiarios_por_grupo: '', carga_horaria_individual: '', supervisor_nome: '', supervisor_conselho: '', territorio: '' })
    } catch (e) {
      setRowError(e?.message || 'Erro ao salvar atividade')
    } finally {
      setSavingRow(false)
    }
  }
  const calcularEstatisticas = () => {
    const atividades = plano?.atividades || []
    const unidades = [...new Set(atividades.map(a => a.unidade_setor).filter(Boolean))]
    const supervisores = [...new Set(atividades.map(a => a.supervisor_nome).filter(Boolean))]
    const disciplinas = [...new Set(atividades.map(a => a.disciplina).filter(Boolean))]
    return {
      totalAtividades: atividades.length,
      totalVagas: totalVagas(atividades),
      totalUnidades: unidades.length,
      totalSupervisores: supervisores.length,
      totalDisciplinas: disciplinas.length,
    }
  }

  const abrirHTML = async () => {
    try {
      const res = await fetch(`${API_URL}/relatorios/anexo2/${estagioId}?format=html`, { headers: getAuthHeaders() })
      const html = await res.text()
      const w = window.open()
      w.document.write(html)
      w.document.close()
    } catch {}
  }

  const baixarPDF = async () => {
    try {
      const res = await fetch(`${API_URL}/relatorios/anexo2/${estagioId}?format=pdf`, { headers: getAuthHeaders() })
      if (!res.ok) return
      const blob = await res.blob()
      const dl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = dl
      a.download = `plano-atividades-estagio-${estagioId}.pdf`
      a.click()
      window.URL.revokeObjectURL(dl)
    } catch {}
  }

  const stats = calcularEstatisticas()

  const Header = () => (
    <div className="page-header">
      <h1>📄 Plano de Atividades — Estágio #{estagioId}</h1>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className="btn-secondary" onClick={() => navigate('/estagios')}>⟵ Voltar</button>
        <button className="btn-secondary" onClick={exportCSV} disabled={!plano?.atividades?.length}>📥 Exportar CSV</button>
        <button className="btn-secondary" onClick={abrirHTML}>🖥️ Visualizar HTML</button>
        <button className="btn-primary" onClick={baixarPDF}>📄 Baixar PDF</button>
        <button className="btn-primary" onClick={() => navigate(`/anexo2?estagio_id=${estagioId}`)}>✏️ Editar no Anexo II</button>
        <button className="btn-secondary" onClick={openHeaderModal}>🛠️ Editar cabeçalho</button>
        <button className="btn-secondary" onClick={()=> setShowCloneModal(true)}>🧩 Clonar para outras instituições</button>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button className={viewMode==='quadro'?'btn-primary':'btn-secondary'} onClick={()=> setViewMode('quadro')}>📊 Quadro</button>
          <button className={viewMode==='tabela'?'btn-primary':'btn-secondary'} onClick={()=> setViewMode('tabela')}>🗂️ Tabela</button>
          <button className={viewMode==='relatorio'?'btn-primary':'btn-secondary'} onClick={()=> setViewMode('relatorio')}>🧾 Relatório</button>
        </div>
      </div>
    </div>
  )


  if (loading) return <Layout user={user}><div className="loading">Carregando plano...</div></Layout>

  return (
    <Layout user={user}>
      <Header />
      {error && <div className="alert alert-danger">❌ {error}</div>}

      {!plano && !error && (
        <div className="empty-state" style={{ background: '#fff', padding: 20, borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: 18, marginBottom: 8 }}>Nenhum Plano de Atividades foi cadastrado para este estágio.</div>
          <div style={{ color: '#666', marginBottom: 12 }}>Acesse "✏️ Editar no Anexo II" para criar o plano e depois volte aqui.</div>
        </div>
      )}

      {plano && viewMode === 'quadro' && (
        <div className="report-section" style={{ display: 'grid', gap: 16 }}>
          <div className="stat-card" style={{ background: '#fff', padding: 16, borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.1)', position:'relative' }}>
            <button
              className="btn-secondary"
              title="Editar cabeçalho"
              onClick={openHeaderModal}
              style={{ position:'absolute', right:12, top:12, padding:'4px 8px', fontSize:12 }}
            >✏️ Editar</button>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
              <div style={{ cursor:'pointer' }} onClick={openHeaderModal} title="Clique para editar">
                <div style={{ color: '#666', fontSize: 12 }}>Instituição de Ensino</div>
                <div style={{ fontWeight: 600 }}>{plano.instituicao_ensino || '—'}</div>
              </div>
              <div style={{ cursor:'pointer' }} onClick={openHeaderModal} title="Clique para editar (filtra cursos pela instituição)">
                <div style={{ color: '#666', fontSize: 12 }}>Curso</div>
                <div style={{ fontWeight: 600 }}>{plano.curso || '—'}</div>
              </div>
              <div style={{ cursor:'pointer' }} onClick={openHeaderModal} title="Clique para editar (AAAA)">
                <div style={{ color: '#666', fontSize: 12 }}>Exercício</div>
                <div style={{ fontWeight: 600 }}>{plano.exercicio || '—'}</div>
              </div>
              <div>
                <div style={{ color: '#666', fontSize: 12 }}>Status</div>
                <button
                  className="btn-secondary"
                  title="Alternar status rapidamente"
                  onClick={() => {
                    const next = (plano.status === 'final') ? 'rascunho' : 'final'
                    salvarCabecalhoParcial({ status: next })
                  }}
                  style={{
                    padding:'2px 8px',
                    borderRadius: 12,
                    background: plano.status === 'final' ? '#E3F2FD' : '#FFF3E0',
                    border: '1px solid #ddd',
                    fontWeight: 600
                  }}
                >{plano.status || '—'}</button>
              </div>
            </div>
            <div style={{ marginTop:8, fontSize:12, color:'#777' }}>Dica: clique em qualquer campo para editar. O curso é sugerido conforme a instituição.</div>
          </div>

          {/* Filtros rápidos */}
          <div className="vagas-filters" style={{ background: '#fff', padding: 16, borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <div className="filters-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px,1fr))', gap:12 }}>
              <div>
                <label style={{ fontSize:12, color:'#666' }}>🔎 Buscar</label>
                <input value={filtro.busca} onChange={e=> setFiltro({...filtro, busca: e.target.value})} placeholder="Disciplina, descrição, horário..." style={{ width:'100%', padding:8, border:'1px solid #ddd', borderRadius:4 }} />
              </div>
              <div>
                <label style={{ fontSize:12, color:'#666' }}>🏥 Unidade</label>
                <input value={filtro.unidade} onChange={e=> setFiltro({...filtro, unidade: e.target.value})} placeholder="Ex.: UTI, Clínica..." style={{ width:'100%', padding:8, border:'1px solid #ddd', borderRadius:4 }} />
              </div>
              <div>
                <label style={{ fontSize:12, color:'#666' }}>🎓 Curso</label>
                <input value={filtro.curso} onChange={e=> setFiltro({...filtro, curso: e.target.value})} placeholder="Filtrar por curso" style={{ width:'100%', padding:8, border:'1px solid #ddd', borderRadius:4 }} />
              </div>
              <div>
                <label style={{ fontSize:12, color:'#666' }}>🧑‍⚕️ Supervisor</label>
                <input value={filtro.supervisor} onChange={e=> setFiltro({...filtro, supervisor: e.target.value})} placeholder="Nome do supervisor" style={{ width:'100%', padding:8, border:'1px solid #ddd', borderRadius:4 }} />
              </div>
            </div>
            <div style={{ marginTop: 10, display:'flex', gap:8, flexWrap:'wrap' }}>
              <button className="btn-secondary" onClick={()=> setFiltro({ unidade:'', curso:'', supervisor:'', busca:'' })}>🔄 Limpar</button>
              <div style={{ marginLeft:'auto', fontSize:12, color:'#666' }}>Atividades filtradas: {atividadesFiltradas().length} • Total de estagiários: {totalVagas(atividadesFiltradas())}</div>
            </div>
          </div>

          {/* Quadro por Unidade (estilo planilha) */}
          <div className="report-section" style={{ display:'grid', gap:12 }}>
            {gruposPorUnidade().map(([unidade, lista], idx) => (
              <div key={unidade+idx} style={{ background:'#fff', borderRadius:8, boxShadow:'0 2px 6px rgba(0,0,0,0.08)', overflow:'hidden' }}>
                <div style={{ background:'#e8f5e9', padding:'10px 14px', fontWeight:700, borderBottom:'1px solid #d0e8d2', display:'flex', justifyContent:'space-between', alignItems:'center', gap:8 }}>
                  <div>🏥 {unidade}</div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginLeft:'auto' }}>
                    <div style={{ fontSize:12, color:'#2e7d32' }}>Total de estagiários nesta unidade: <strong>{totalVagas(lista)}</strong></div>
                    <button className="btn-secondary" style={{ padding:'4px 6px', fontSize:12 }} onClick={()=> {
                      // Abre modal sempre; preenche unidade se for válida
                      const u = (unidade || '').trim()
                      setNovaAtv({ ...novaAtv, unidade_setor: (u && u !== '—') ? u : '' })
                      setRowError('')
                      setShowNovaAtvModal(true)
                    }}>➕ Nova linha</button>
                  </div>
                </div>
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead>
                      <tr style={{ background:'#fafafa', borderBottom:'1px solid #eee' }}>
                        <th style={{ padding:8, textAlign:'left' }}>Instituição</th>
                        <th style={{ padding:8, textAlign:'left' }}>Curso</th>
                        <th style={{ padding:8, textAlign:'left' }}>Nível</th>
                        <th style={{ padding:8, textAlign:'left' }}>Início</th>
                        <th style={{ padding:8, textAlign:'left' }}>Fim</th>
                        <th style={{ padding:8, textAlign:'left' }}>Horário</th>
                        <th style={{ padding:8, textAlign:'left' }}>Período</th>
                        <th style={{ padding:8, textAlign:'left' }}>Supervisor</th>
                        <th style={{ padding:8, textAlign:'left' }}>Disciplina</th>
                        <th style={{ padding:8, textAlign:'left' }}>Território</th>
                        <th style={{ padding:8, textAlign:'right' }}>Nº de estagiários</th>
                        <th style={{ padding:8, textAlign:'center' }}>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lista.map((a,i) => {
                        const grupos = parseInt(a.quantidade_grupos||0,10)||0
                        const porGrupo = parseInt(a.num_estagiarios_por_grupo||0,10)||0
                        const vagas = grupos*porGrupo
                        return (
                          <tr key={i} style={{ borderBottom:'1px solid #f0f0f0' }}>
                            <td style={{ padding:8 }}>{plano.instituicao_ensino || '—'}</td>
                            <td style={{ padding:8 }}><input value={plano.curso || ''} readOnly style={{ width:'100%', background:'#f9f9f9', border:'1px dashed #ddd' }} /></td>
                            <td style={{ padding:8 }}><input value={a.nivel || ''} onChange={e=> patchAtividade(a.id,'nivel', e.target.value)} style={{ width:'100%', background: badgeColorBy(a), border:'1px solid #ddd' }} /></td>
                            <td style={{ padding:8 }}><input type="date" value={a.data_inicio || ''} onChange={e=> patchAtividade(a.id,'data_inicio', e.target.value)} style={{ width:'100%', border:'1px solid #ddd' }} /></td>
                            <td style={{ padding:8 }}><input type="date" value={a.data_fim || ''} onChange={e=> patchAtividade(a.id,'data_fim', e.target.value)} style={{ width:'100%', border:'1px solid #ddd' }} /></td>
                            <td style={{ padding:8 }}>
                              <input
                                placeholder="08:00 às 12:00"
                                value={a.horario || ''}
                                onChange={e=> patchAtividade(a.id,'horario', formatHorario(e.target.value))}
                                style={{ width:'100%', border:'1px solid #ddd' }}
                              />
                            </td>
                            <td style={{ padding:8 }}><span style={{ background: badgeColorBy(a), padding:'2px 6px', borderRadius:4 }}>{periodLabel(a.horario)}</span></td>
                            <td style={{ padding:8 }}>
                              <input list="lista-supervisores" value={a.supervisor_nome || ''} onChange={e=> patchAtividade(a.id,'supervisor_nome', e.target.value)} style={{ width:'100%', border:'1px solid #ddd' }} />
                            </td>
                            <td style={{ padding:8 }}><input value={a.disciplina || ''} onChange={e=> patchAtividade(a.id,'disciplina', e.target.value)} style={{ width:'100%', border:'1px solid #ddd' }} /></td>
                            <td style={{ padding:8 }}><input value={a.territorio || ''} onChange={e=> patchAtividade(a.id,'territorio', e.target.value)} style={{ width:'100%', border:'1px solid #ddd' }} placeholder="Território" /></td>
                            <td style={{ padding:8, textAlign:'right', fontWeight:600 }}>{vagas || '—'}</td>
                            <td style={{ padding:8, textAlign:'center' }}>
                              <div className="table-actions" style={{ display:'flex', gap:6, justifyContent:'center' }}>
                                <button className="btn-secondary" style={{ padding:'4px 6px', fontSize:12, lineHeight:1 }} onClick={()=> setNovaAtv({ ...novaAtv, unidade_setor: unidade, disciplina: a.disciplina, nivel: a.nivel, horario: a.horario, dias_semana: a.dias_semana, supervisor_nome: a.supervisor_nome, territorio: a.territorio })}>📄 Duplicar</button>
                                <button className="btn-secondary" style={{ padding:'4px 6px', fontSize:12, lineHeight:1 }} onClick={()=> limparAtividade(a)}>🧹 Limpar</button>
                                <button className="btn-secondary" style={{ padding:'4px 6px', fontSize:12, lineHeight:1 }} onClick={()=> deletarAtividade(a.id)}>🗑️ Remover</button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                      {/* Subtotais por período */}
                      {['Manhã','Tarde','Manhã e Tarde'].map(p => {
                        const subset = lista.filter(a => periodLabel(a.horario)===p)
                        if (!subset.length) return null
                        return (
                          <tr key={'subtotal-'+p} style={{ background:'#f7f7f7' }}>
                            <td colSpan={9} style={{ padding:8, textAlign:'right', fontWeight:600 }}>{p} subtotal</td>
                            <td style={{ padding:8, textAlign:'right', fontWeight:700 }}>{totalVagas(subset)}</td>
                            <td></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                {/* Rodapé de métricas por unidade */}
                <div style={{ display:'flex', gap:12, justifyContent:'flex-end', padding:'10px 14px', borderTop:'1px solid #eee', fontSize:13, color:'#555' }}>
                  <div>Atividades: <strong>{lista.length}</strong></div>
                  <div>Total estagiários: <strong>{totalVagas(lista)}</strong></div>
                </div>
              </div>
            ))}
          </div>

          {/* Linha de inclusão rápida */}
          <div className="stat-card quick-add">
            <div className="quick-add-title">Adicionar atividade rapidamente</div>
            {rowError && <div className="alert alert-danger quick-add-error">❌ {rowError}</div>}
            <div className="quick-add-grid">
              <input placeholder="Unidade/Setor" list="lista-unidades" value={novaAtv.unidade_setor} onChange={e=> setNovaAtv({...novaAtv, unidade_setor:e.target.value})} />
              <input placeholder="Disciplina" value={novaAtv.disciplina} onChange={e=> setNovaAtv({...novaAtv, disciplina:e.target.value})} />
              <input placeholder="Nível" value={novaAtv.nivel} onChange={e=> setNovaAtv({...novaAtv, nivel:e.target.value})} />
              <input type="date" placeholder="Início" value={novaAtv.data_inicio} onChange={e=> setNovaAtv({...novaAtv, data_inicio:e.target.value})} />
              <input type="date" placeholder="Fim" value={novaAtv.data_fim} onChange={e=> setNovaAtv({...novaAtv, data_fim:e.target.value})} />
              <input placeholder="Horário (08:00 às 12:00)" value={novaAtv.horario} onChange={e=> setNovaAtv({...novaAtv, horario: formatHorario(e.target.value) })} />
              <input placeholder="Dias semana (Seg, Ter...)" value={novaAtv.dias_semana} onChange={e=> setNovaAtv({...novaAtv, dias_semana:e.target.value})} />
              <input type="number" placeholder="Qtd Grupos" value={novaAtv.quantidade_grupos} onChange={e=> setNovaAtv({...novaAtv, quantidade_grupos:e.target.value})} />
              <input type="number" placeholder="Est./Grupo" value={novaAtv.num_estagiarios_por_grupo} onChange={e=> setNovaAtv({...novaAtv, num_estagiarios_por_grupo:e.target.value})} />
              <input placeholder="Supervisor" list="lista-supervisores" value={novaAtv.supervisor_nome} onChange={e=> setNovaAtv({...novaAtv, supervisor_nome:e.target.value})} />
              <input placeholder="Conselho" value={novaAtv.supervisor_conselho} onChange={e=> setNovaAtv({...novaAtv, supervisor_conselho:e.target.value})} />
              <input placeholder="Território" value={novaAtv.territorio} onChange={e=> setNovaAtv({...novaAtv, territorio:e.target.value})} />
            </div>
            <div className="quick-add-actions">
              <button className="btn-primary" onClick={salvarNovaAtividade} disabled={savingRow}>
                {savingRow ? 'Salvando...' : '➕ Adicionar' }
              </button>
              <span className="quick-add-hint">Dica: Unidade e Supervisor devem existir no sistema para validar.</span>
            </div>
          </div>

            {/* Datalists para autocomplete */}
            <datalist id="lista-unidades">
              {catalogos.unidades.map(u => (
                <option key={u.id} value={u.nome} />
              ))}
            </datalist>
            <datalist id="lista-supervisores">
              {catalogos.supervisores.map(s => (
                <option key={s.id} value={s.nome} />
              ))}
            </datalist>
            <datalist id="lista-instituicoes">
              {catInstituicoes.map(i => (
                <option key={i.id} value={i.nome} />
              ))}
            </datalist>
            <datalist id="lista-cursos">
              {catCursos.map(c => (
                <option key={c.id} value={c.nome} />
              ))}
            </datalist>
            <datalist id="lista-cursos-filtrados">
              {catCursosFiltrados.map((nome, idx) => (
                <option key={idx} value={nome} />
              ))}
            </datalist>

          {/* Relatório inline é renderizado fora quando viewMode==='relatorio' */}
        </div>
      )}

      {plano && viewMode === 'tabela' && (
        <div className="report-section" style={{ display:'grid', gap:16 }}>
          {/* Tabela plana com todas as atividades */}
          <div className="stat-card" style={{ background:'#fff', padding:16, borderRadius:8, boxShadow:'0 2px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
              <div style={{ fontWeight:600 }}>Todas as atividades</div>
              <div style={{ marginLeft:'auto', fontSize:12, color:'#666' }}>Total: {atividadesFiltradas().length} • Estagiários: {totalVagas(atividadesFiltradas())}</div>
            </div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ background:'#fafafa', borderBottom:'1px solid #eee' }}>
                    <th style={{ padding:8, textAlign:'left' }}>Unidade</th>
                    <th style={{ padding:8, textAlign:'left' }}>Disciplina</th>
                    <th style={{ padding:8, textAlign:'left' }}>Descrição</th>
                    <th style={{ padding:8, textAlign:'left' }}>Nível</th>
                    <th style={{ padding:8, textAlign:'left' }}>Início</th>
                    <th style={{ padding:8, textAlign:'left' }}>Fim</th>
                    <th style={{ padding:8, textAlign:'left' }}>Horário</th>
                    <th style={{ padding:8, textAlign:'left' }}>Dias</th>
                    <th style={{ padding:8, textAlign:'left' }}>Supervisor</th>
                    <th style={{ padding:8, textAlign:'right' }}>Grupos</th>
                    <th style={{ padding:8, textAlign:'right' }}>Est./Grupo</th>
                    <th style={{ padding:8, textAlign:'right' }}>Total Est.</th>
                    <th style={{ padding:8, textAlign:'left' }}>Território</th>
                    <th style={{ padding:8, textAlign:'center' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {atividadesFiltradas().map((a, i) => {
                    const grupos = parseInt(a.quantidade_grupos||0,10)||0
                    const porGrupo = parseInt(a.num_estagiarios_por_grupo||0,10)||0
                    const vagas = grupos*porGrupo
                    return (
                      <tr key={a.id || i} style={{ borderBottom:'1px solid #f0f0f0' }}>
                        <td style={{ padding:8 }}><input value={a.unidade_setor || ''} onChange={e=> patchAtividade(a.id,'unidade_setor', e.target.value)} style={{ width:'100%', border:'1px solid #ddd' }} /></td>
                        <td style={{ padding:8 }}><input value={a.disciplina || ''} onChange={e=> patchAtividade(a.id,'disciplina', e.target.value)} style={{ width:'100%', border:'1px solid #ddd' }} /></td>
                        <td style={{ padding:8 }}><input value={a.descricao || ''} onChange={e=> patchAtividade(a.id,'descricao', e.target.value)} style={{ width:'100%', border:'1px solid #ddd' }} /></td>
                        <td style={{ padding:8 }}><input value={a.nivel || ''} onChange={e=> patchAtividade(a.id,'nivel', e.target.value)} style={{ width:'100%', border:'1px solid #ddd' }} /></td>
                        <td style={{ padding:8 }}><input type="date" value={a.data_inicio || ''} onChange={e=> patchAtividade(a.id,'data_inicio', e.target.value)} style={{ width:'100%', border:'1px solid #ddd' }} /></td>
                        <td style={{ padding:8 }}><input type="date" value={a.data_fim || ''} onChange={e=> patchAtividade(a.id,'data_fim', e.target.value)} style={{ width:'100%', border:'1px solid #ddd' }} /></td>
                        <td style={{ padding:8 }}><input value={a.horario || ''} onChange={e=> patchAtividade(a.id,'horario', formatHorario(e.target.value))} style={{ width:'100%', border:'1px solid #ddd' }} /></td>
                        <td style={{ padding:8 }}><input value={a.dias_semana || ''} onChange={e=> patchAtividade(a.id,'dias_semana', e.target.value)} style={{ width:'100%', border:'1px solid #ddd' }} /></td>
                        <td style={{ padding:8 }}><input list="lista-supervisores" value={a.supervisor_nome || ''} onChange={e=> patchAtividade(a.id,'supervisor_nome', e.target.value)} style={{ width:'100%', border:'1px solid #ddd' }} /></td>
                        <td style={{ padding:8, textAlign:'right' }}><input type="number" value={a.quantidade_grupos || ''} onChange={e=> patchAtividade(a.id,'quantidade_grupos', e.target.value)} style={{ width:'100%', border:'1px solid #ddd' }} /></td>
                        <td style={{ padding:8, textAlign:'right' }}><input type="number" value={a.num_estagiarios_por_grupo || ''} onChange={e=> patchAtividade(a.id,'num_estagiarios_por_grupo', e.target.value)} style={{ width:'100%', border:'1px solid #ddd' }} /></td>
                        <td style={{ padding:8, textAlign:'right', fontWeight:600 }}>{vagas || '—'}</td>
                        <td style={{ padding:8 }}><input value={a.territorio || ''} onChange={e=> patchAtividade(a.id,'territorio', e.target.value)} style={{ width:'100%', border:'1px solid #ddd' }} /></td>
                        <td style={{ padding:8, textAlign:'center' }}>
                          <div style={{ display:'flex', gap:6, justifyContent:'center' }}>
                            <button className="btn-secondary" style={{ padding:'4px 6px', fontSize:12, lineHeight:1 }} onClick={()=> deletarAtividade(a.id)}>🗑️ Remover</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {plano && viewMode === 'relatorio' && (
        <div className="report-section" style={{ background:'#fff', padding:12, borderRadius:8, boxShadow:'0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:8 }}>
            <div style={{ fontWeight:600 }}>Relatório (visualização inline)</div>
            <div style={{ marginLeft:'auto', display:'flex', gap:6 }}>
              <button className="btn-secondary" onClick={async ()=>{
                try {
                  const rep = await fetch(`${API_URL}/relatorios/anexo2/${estagioId}?format=html`, { headers: getAuthHeaders() })
                  if (rep.ok) setReportHtml(await rep.text())
                } catch {}
              }}>🔄 Atualizar</button>
              <button className="btn-secondary" onClick={abrirHTML}>🖥️ Abrir nova aba</button>
              <button className="btn-primary" onClick={baixarPDF}>📄 Baixar PDF</button>
            </div>
          </div>
          {reportHtml ? (
            <iframe title="relatorio-anexo2" srcDoc={reportHtml} style={{ width:'100%', height:'70vh', border:'1px solid #eee', borderRadius:6 }} />
          ) : (
            <div style={{ color:'#666' }}>Sem conteúdo de relatório no momento.</div>
          )}
        </div>
      )}

      {/* Modal de edição de cabeçalho */}
      <Modal isOpen={showHeaderModal} onClose={()=> setShowHeaderModal(false)} title="Editar cabeçalho" size="large">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:12 }}>
          <div>
            <label style={{ fontSize:12, color:'#666' }}>Instituição de Ensino</label>
            <input list="lista-instituicoes" value={headerForm.instituicao_ensino} onChange={e=> setHeaderForm({ ...headerForm, instituicao_ensino: e.target.value })} />
            <div style={{ fontSize:11, color:'#888', marginTop:4 }}>Escolha da lista — validamos com o cadastro de instituições.</div>
          </div>
          <div>
            <label style={{ fontSize:12, color:'#666' }}>Curso</label>
            <input list="lista-cursos-filtrados" value={headerForm.curso} onChange={e=> setHeaderForm({ ...headerForm, curso: e.target.value })} />
            <div style={{ fontSize:11, color:'#888', marginTop:4 }}>A lista de cursos é filtrada pela instituição selecionada.</div>
          </div>
          <div>
            <label style={{ fontSize:12, color:'#666' }}>Exercício</label>
            <input placeholder="AAAA" value={headerForm.exercicio} onChange={e=> {
              const digits = String(e.target.value || '').replace(/\D/g, '').slice(0,4)
              setHeaderForm({ ...headerForm, exercicio: digits })
            }} />
          </div>
          <div>
            <label style={{ fontSize:12, color:'#666' }}>Status</label>
            <select value={headerForm.status} onChange={e=> setHeaderForm({ ...headerForm, status: e.target.value })}>
              <option value="final">final</option>
              <option value="rascunho">rascunho</option>
            </select>
          </div>
        </div>
        <div style={{ marginTop:12, display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button className="btn-secondary" onClick={()=> setShowHeaderModal(false)}>Cancelar</button>
          <button className="btn-primary" onClick={salvarCabecalho}>Salvar</button>
        </div>
      </Modal>

      {/* Modal: Clonar plano para outras instituições */}
      <Modal isOpen={showCloneModal} onClose={()=> setShowCloneModal(false)} title="Clonar plano para outras instituições" size="large">
        <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:10 }}>
          <label style={{ display:'flex', gap:8, alignItems:'center' }}>
            <input type="checkbox" checked={cloneSel.todas} onChange={e=> setCloneSel({ ...cloneSel, todas: e.target.checked })} />
            Clonar para todas as instituições (exceto a atual)
          </label>
          {!cloneSel.todas && (
            <div>
              <div style={{ fontSize:12, color:'#666', marginBottom:4 }}>Escolha instituições</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {catInstituicoes.map(i => (
                  <label key={i.id} style={{ border:'1px solid #ddd', padding:'4px 8px', borderRadius:6, cursor:'pointer' }}>
                    <input type="checkbox" checked={cloneSel.instituicoes.includes(i.id)} onChange={e=> {
                      const has = cloneSel.instituicoes.includes(i.id)
                      setCloneSel({ ...cloneSel, instituicoes: has ? cloneSel.instituicoes.filter(x=>x!==i.id) : [...cloneSel.instituicoes, i.id] })
                    }} /> {i.nome}
                  </label>
                ))}
              </div>
            </div>
          )}
          <label style={{ display:'flex', gap:8, alignItems:'center' }}>
            <input type="checkbox" checked={cloneSel.replace} onChange={e=> setCloneSel({ ...cloneSel, replace: e.target.checked })} />
            Substituir plano existente no destino (se houver)
          </label>
        </div>
        <div style={{ marginTop:12, display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button className="btn-secondary" onClick={()=> setShowCloneModal(false)}>Cancelar</button>
          <button className="btn-primary" onClick={async ()=>{
            try {
              const body = { todas: cloneSel.todas, instituicao_ids: cloneSel.instituicoes, replace: cloneSel.replace, exercicio: headerForm.exercicio || plano.exercicio, status: headerForm.status || plano.status }
              const res = await fetch(`${API_URL}/anexo2/${plano.estagio_id}/clone`, { method:'POST', headers: getAuthHeaders(), body: JSON.stringify(body) })
              if (!res.ok) {
                const j = await res.json().catch(()=>({}))
                throw new Error(j?.detail || 'Falha ao clonar')
              }
              const j = await res.json()
              alert(`Clonagem concluída. Criados: ${j.created}, Atualizados: ${j.updated}, Ignorados: ${j.skipped}`)
              setShowCloneModal(false)
              // Após clonar, levar usuário para a lista de planos para visualizar os novos registros
              navigate('/planos-anexo2')
            } catch (e) {
              alert(e?.message || 'Erro ao clonar plano')
            }
          }}>Clonar</button>
        </div>
      </Modal>

      {/* Modal: Nova atividade (Unidade obrigatória e existente) */}
      <Modal isOpen={showNovaAtvModal} onClose={()=> setShowNovaAtvModal(false)} title="Nova atividade" size="large">
        {rowError && <div className="alert alert-danger" style={{ marginBottom:10 }}>❌ {rowError}</div>}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:10 }}>
          <div>
            <label style={{ fontSize:12, color:'#666' }}>Unidade/Setor</label>
            <input required list="lista-unidades" placeholder="Selecione uma unidade válida" value={novaAtv.unidade_setor} onChange={e=> setNovaAtv({ ...novaAtv, unidade_setor: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize:12, color:'#666' }}>Disciplina</label>
            <input value={novaAtv.disciplina} onChange={e=> setNovaAtv({ ...novaAtv, disciplina: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize:12, color:'#666' }}>Nível</label>
            <input value={novaAtv.nivel} onChange={e=> setNovaAtv({ ...novaAtv, nivel: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize:12, color:'#666' }}>Início</label>
            <input type="date" value={novaAtv.data_inicio} onChange={e=> setNovaAtv({ ...novaAtv, data_inicio: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize:12, color:'#666' }}>Fim</label>
            <input type="date" value={novaAtv.data_fim} onChange={e=> setNovaAtv({ ...novaAtv, data_fim: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize:12, color:'#666' }}>Horário</label>
            <input placeholder="08:00 às 12:00" value={novaAtv.horario} onChange={e=> setNovaAtv({ ...novaAtv, horario: formatHorario(e.target.value) })} />
          </div>
          <div>
            <label style={{ fontSize:12, color:'#666' }}>Dias da semana</label>
            <input value={novaAtv.dias_semana} onChange={e=> setNovaAtv({ ...novaAtv, dias_semana: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize:12, color:'#666' }}>Qtd Grupos</label>
            <input type="number" value={novaAtv.quantidade_grupos} onChange={e=> setNovaAtv({ ...novaAtv, quantidade_grupos: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize:12, color:'#666' }}>Est./Grupo</label>
            <input type="number" value={novaAtv.num_estagiarios_por_grupo} onChange={e=> setNovaAtv({ ...novaAtv, num_estagiarios_por_grupo: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize:12, color:'#666' }}>Supervisor</label>
            <input list="lista-supervisores" value={novaAtv.supervisor_nome} onChange={e=> setNovaAtv({ ...novaAtv, supervisor_nome: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize:12, color:'#666' }}>Conselho</label>
            <input value={novaAtv.supervisor_conselho} onChange={e=> setNovaAtv({ ...novaAtv, supervisor_conselho: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize:12, color:'#666' }}>Território</label>
            <input value={novaAtv.territorio} onChange={e=> setNovaAtv({ ...novaAtv, territorio: e.target.value })} />
          </div>
        </div>
        <div style={{ marginTop:12, display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button className="btn-secondary" onClick={()=> setShowNovaAtvModal(false)}>Cancelar</button>
          <button className="btn-primary" onClick={async ()=>{ await salvarNovaAtividade(); if (!rowError) setShowNovaAtvModal(false) }}>Salvar</button>
        </div>
      </Modal>
    </Layout>
  )
}
