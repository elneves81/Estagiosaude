import React, { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
import { DISCIPLINAS_EXPANDIDAS } from '../constants/disciplinas'
import { DESCRICOES_SUGERIDAS } from '../constants/descricoes'

const apiBase = (import.meta.env && import.meta.env.VITE_API_URL) || ''

export default function Vagas() {
  const [user, setUser] = useState(null)
  const [density, setDensity] = useState('cozy') // compact | cozy | comfortable
  const [q, setQ] = useState('')
  const [unidade, setUnidade] = useState('')
  const [supervisor, setSupervisor] = useState('')
  const [dia, setDia] = useState('')
  const [rows, setRows] = useState([])
  const [totalVagas, setTotalVagas] = useState(0)
  const [finance, setFinance] = useState({ valor_hora: 0, arredondamento: 'round', moeda: 'BRL' })
  const [exercicio, setExercicio] = useState('')
  const [saving, setSaving] = useState({})
  const [errors, setErrors] = useState({}) // { [id]: { horario?: string, dias_semana?: string } }
  const [supervisores, setSupervisores] = useState([])
  
  // Modal states
  const [showUnidadeModal, setShowUnidadeModal] = useState(false)
  const [showSupervisorModal, setShowSupervisorModal] = useState(false)
  const [showNovaVagaModal, setShowNovaVagaModal] = useState(false)
  const [currentEditingRow, setCurrentEditingRow] = useState(null)
  const [unidades, setUnidades] = useState([])
  const [unidadeSearch, setUnidadeSearch] = useState('')
  const [supervisorSearch, setSupervisorSearch] = useState('')
  
  // Nova vaga form
  const [novaVaga, setNovaVaga] = useState({
    unidade_setor: '',
    disciplina: '',
    descricao: '',
    nivel: 'M',
    data_inicio: '',
    data_fim: '',
    horario: '',
  dias_semana: '',
  instituicao_ensino: '',
  curso: '',
    estudante_nome: '',
    supervisor: '',
    supervisor_conselho: '',
    quantidade_grupos: 0,
    num_estagiarios_por_grupo: 0,
    carga_horaria_individual: '',
    valor: ''
  })
  // Seletor auxiliar para Instituição e Cursos
  const [selectedInstituicaoId, setSelectedInstituicaoId] = useState(null)
  // Chips de dias da semana (para a Nova Vaga)
  const [selectedDias, setSelectedDias] = useState([])
  const [novaVagaError, setNovaVagaError] = useState('')
  const [novaVagaSuccess, setNovaVagaSuccess] = useState('')
  
  // Templates
  const [templates, setTemplates] = useState([])
  const [showTemplatesModal, setShowTemplatesModal] = useState(false)
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false)
  const [templateNome, setTemplateNome] = useState('')
  const [templateDescricao, setTemplateDescricao] = useState('')
  
  // Duplicate detection
  const [duplicateWarning, setDuplicateWarning] = useState(null)
  const [forceCreate, setForceCreate] = useState(false)
  
  // Bulk import
  const [showImportModal, setShowImportModal] = useState(false)
  const [importFile, setImportFile] = useState(null)
  const [importResults, setImportResults] = useState(null)
  // Criar Estágio a partir da vaga
  const [showCreateEstagio, setShowCreateEstagio] = useState(false)
  const [vagaSelecionada, setVagaSelecionada] = useState(null)
  const [novoEstagio, setNovoEstagio] = useState({ nome: '', email: '', periodo: '' })
  const [creatingEstagio, setCreatingEstagio] = useState(false)
  const [createEstagioError, setCreateEstagioError] = useState('')
  const [createEstagioSuccess, setCreateEstagioSuccess] = useState('')

  // Helpers (espelhando lógica do Anexo II)
  const normalizeString = (s) => {
    if (!s) return ''
    return s
      .toString()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu,'')
      .toLowerCase()
      .replace(/\s+/g,' ')
      .trim()
  }
  const normalizeToCatalogName = (input, list, key = 'nome') => {
    const val = (input || '').toString().trim()
    if (!val) return val
    const norm = normalizeString(val)
    if (!Array.isArray(list) || list.length === 0) return val
    let best = null
    for (const item of list) {
      const name = (item?.[key] || '').toString()
      const n = normalizeString(name)
      if (!n) continue
      if (n === norm) return name
      if (n.includes(norm) || norm.includes(n)) best = name
    }
    return best || val
  }
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
    const nums = (str.match(/\d+/g) || []).map(n => n.padStart(2, '0'))
    if (nums.length < 2) return str.trim()
    const h1 = nums[0]?.slice(0,2)
    const m1 = (nums[1] && nums[1].length === 2) ? nums[1] : '00'
    const h2 = (nums[2] ? nums[2] : nums[1])?.slice(0,2)
    const m2 = (nums[3] && nums[3].length === 2) ? nums[3] : '00'
    const clamp = (h,m) => {
      let hh = Math.max(0, Math.min(23, parseInt(h || '0', 10)))
      let mm = Math.max(0, Math.min(59, parseInt(m || '0', 10)))
      return `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`
    }
    return `${clamp(h1,m1)} às ${clamp(h2,m2)}`
  }
  const horarioValido = (h) => {
    if (!h) return true
    const re = /^(\d{2}):(\d{2})\s+às\s+(\d{2}):(\d{2})$/
    const m = h.match(re)
    if (!m) return false
    const [_, h1, m1, h2, m2] = m
    const toMin = (hh, mm) => parseInt(hh,10)*60 + parseInt(mm,10)
    const ini = toMin(h1,m1)
    const fim = toMin(h2,m2)
    return ini < fim
  }
  const dataCoerente = (ini, fim) => {
    if (!ini || !fim) return true
    try {
      const a = new Date(ini)
      const b = new Date(fim)
      return a.getTime() <= b.getTime()
    } catch { return false }
  }
  const DIAS_ORD = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom']
  const aliasDia = {
    'seg':'Seg','segunda':'Seg','segunda-feira':'Seg',
    'ter':'Ter','terça':'Ter','terca':'Ter','terça-feira':'Ter','terca-feira':'Ter',
    'qua':'Qua','quarta':'Qua','quarta-feira':'Qua',
    'qui':'Qui','quinta':'Qui','quinta-feira':'Qui',
    'sex':'Sex','sexta':'Sex','sexta-feira':'Sex',
    'sab':'Sáb','sáb':'Sáb','sabado':'Sáb','sábado':'Sáb',
    'dom':'Dom','domingo':'Dom'
  }
  const ordenarDias = (arr) => DIAS_ORD.filter(d => arr.includes(d)).join(', ')
  const parseDiasTexto = (txt) => {
    if (!txt) return ''
    const s = txt.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'')
    const m = s.match(/(seg|ter|qua|qui|sex|sab|dom)\s*(?:a|-|ate)\s*(seg|ter|qua|qui|sex|sab|dom)/)
    if (m) {
      const a = ['seg','ter','qua','qui','sex','sab','dom']
      const i1 = a.indexOf(m[1])
      const i2 = a.indexOf(m[2])
      if (i1 !== -1 && i2 !== -1) {
        const low = Math.min(i1,i2), high = Math.max(i1,i2)
        const dias = a.slice(low, high+1).map(k => aliasDia[k])
        return ordenarDias(dias)
      }
    }
    const parts = s.split(/[\s,\/]+/).filter(Boolean)
    const dias = parts.map(p => aliasDia[p]).filter(Boolean)
    return ordenarDias([...new Set(dias)])
  }

  // Normalizações adicionais (iguais ao Anexo II)
  const normalizarDataBR = (s) => {
    if (!s) return ''
    const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
    if (!m) return s
    const [_, d, mth, y] = m
    return `${y}-${mth}-${d}`
  }

  // ===== Datas: helpers e presets =====
  const toYMD = (d) => {
    const pad = (n) => String(n).padStart(2,'0')
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
  }
  const todayYMD = () => toYMD(new Date())
  const addDays = (ymd, days) => {
    if (!ymd) return ''
    const [y,m,d] = ymd.split('-').map(Number)
    const dt = new Date(y, (m||1)-1, d||1)
    dt.setDate(dt.getDate()+days)
    return toYMD(dt)
  }
  const endOfMonth = (ymd) => {
    const [y,m] = ymd ? ymd.split('-').map(Number) : [new Date().getFullYear(), new Date().getMonth()+1]
    const dt = new Date(y, (m||1), 0)
    return toYMD(dt)
  }
  const startOfMonth = (ymd) => {
    const [y,m] = ymd ? ymd.split('-').map(Number) : [new Date().getFullYear(), new Date().getMonth()+1]
    return `${y}-${String(m).padStart(2,'0')}-01`
  }
  const monthRangeFrom = (ymd) => ({ ini: startOfMonth(ymd||todayYMD()), fim: endOfMonth(ymd||todayYMD()) })
  const semesterRange = (year = new Date().getFullYear(), sem = 1) => (
    sem === 1
      ? { ini: `${year}-01-01`, fim: `${year}-06-30` }
      : { ini: `${year}-07-01`, fim: `${year}-12-31` }
  )
  const yearRange = (year = new Date().getFullYear()) => ({ ini: `${year}-01-01`, fim: `${year}-12-31` })
  const parseValor = (s) => {
    if (s == null) return null
    const str = String(s).trim()
    if (!str) return null
    if (str.includes(',')) {
      const clean = str.replace(/\./g, '').replace(',', '.')
      const n = parseFloat(clean)
      return isNaN(n) ? null : n
    }
    const parts = str.split('.')
    const joined = parts.length > 1 ? parts.slice(0, -1).join('') + '.' + parts[parts.length - 1] : parts[0]
    const n = parseFloat(joined)
    return isNaN(n) ? null : n
  }

  function getAuthHeaders() {
    return { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' }
  }

  async function loadUser() {
    try { const r = await fetch(`${apiBase}/auth/me`, { headers: getAuthHeaders() }); if (r.ok) setUser(await r.json()) } catch {}
  }

  async function loadSupervisores() {
    try {
      const r = await fetch(`${apiBase}/supervisores`, { headers: getAuthHeaders() })
      if (r.ok) setSupervisores(await r.json())
    } catch {}
  }
  // Busca de supervisores no servidor (para listas grandes e digitação livre)
  useEffect(() => {
    let handle
    async function run() {
      try {
        // Só buscar no servidor quando o modal estiver aberto
        if (!showSupervisorModal) return
        const q = (supervisorSearch || '').trim()
        const url = q
          ? `${apiBase}/supervisores/search?q=${encodeURIComponent(q)}&limit=50`
          : `${apiBase}/supervisores/paginado?limit=50&offset=0`
        const r = await fetch(url, { headers: getAuthHeaders() })
        if (r.ok) {
          const data = await r.json()
          // Ambos endpoints retornam shape diferente: normalizar
          const items = Array.isArray(data)
            ? data
            : (data.items || [])
          setSupervisores(items)
        }
      } catch {}
    }
    // debounce 250ms
    handle = setTimeout(run, 250)
    return () => clearTimeout(handle)
  }, [showSupervisorModal, supervisorSearch])

  async function loadUnidades() {
    try {
      const r = await fetch(`${apiBase}/unidades`, { headers: getAuthHeaders() })
      if (r.ok) setUnidades(await r.json())
    } catch {}
  }

  // Catálogos: Instituições e Cursos (para seleção na Nova Vaga)
  const [instituicoes, setInstituicoes] = useState([])
  const [cursos, setCursos] = useState([])
  const [instituicaoQuery, setInstituicaoQuery] = useState('')
  const [instOptions, setInstOptions] = useState([])
  const [instDropdownOpen, setInstDropdownOpen] = useState(false)
  const [instLoading, setInstLoading] = useState(false)
  const [cursoQuery, setCursoQuery] = useState('')
  async function loadInstituicoes() {
    try {
      const r = await fetch(`${apiBase}/instituicoes`, { headers: getAuthHeaders() })
      if (r.ok) setInstituicoes(await r.json())
    } catch {}
  }
  async function loadCursosDaInstituicao(instId) {
    try {
      const r = await fetch(`${apiBase}/instituicoes/${instId}/cursos`, { headers: getAuthHeaders() })
      if (r.ok) setCursos(await r.json())
    } catch {}
  }

  // Typeahead: buscar instituições conforme digita
  useEffect(() => {
    let handle
    async function run() {
      if (!showNovaVagaModal) return
      try {
        setInstLoading(true)
        const q = (instituicaoQuery || '').trim()
        const url = q
          ? `${apiBase}/instituicoes/search?q=${encodeURIComponent(q)}&limit=20`
          : `${apiBase}/instituicoes`
        const r = await fetch(url, { headers: getAuthHeaders() })
        if (r.ok) {
          const data = await r.json()
          const items = Array.isArray(data) ? data : (data.items || [])
          setInstOptions(items)
        }
      } finally {
        setInstLoading(false)
      }
    }
    handle = setTimeout(run, 200)
    return () => clearTimeout(handle)
  }, [showNovaVagaModal, instituicaoQuery])

  function selectInstituicao(inst) {
    const nome = inst ? (inst.nome || inst.nome_fantasia || inst.razao_social || '') : ''
    setSelectedInstituicaoId(inst?.id || null)
    setNovaVaga(prev => ({ ...prev, instituicao_ensino: nome, curso: '' }))
    setInstDropdownOpen(false)
    setCursos([])
    setCursoQuery('')
    if (inst?.id) {
      loadCursosDaInstituicao(inst.id)
    }
  }

  function openUnidadeModal(rowId) {
    setCurrentEditingRow(rowId)
    setShowUnidadeModal(true)
  }

  function openSupervisorModal(rowId) {
    setCurrentEditingRow(rowId)
    setShowSupervisorModal(true)
  }

  function selectUnidade(unidadeNome) {
    if (currentEditingRow === 'nova-vaga') {
      setNovaVaga(prev => ({ ...prev, unidade_setor: unidadeNome }))
    } else if (currentEditingRow) {
      setRows(prev => prev.map(x => x.id === currentEditingRow ? {...x, unidade_setor: unidadeNome} : x))
      updateCell(currentEditingRow, 'unidade_setor', unidadeNome)
    }
    setShowUnidadeModal(false)
    setCurrentEditingRow(null)
    setUnidadeSearch('')
  }

  function selectSupervisor(sup) {
    // Primeiro trata o formulário de nova vaga (id especial 'nova-vaga')
    if (currentEditingRow === 'nova-vaga') {
      // Para o formulário de nova vaga
      setNovaVaga(prev => ({
        ...prev,
        supervisor: sup.nome,
        supervisor_nome: sup.nome,
        supervisor_conselho: sup.numero_conselho || ''
      }))
    } else if (currentEditingRow) {
      // Edição inline de uma linha existente: persistir em 'supervisor_nome'
      setRows(prev => prev.map(x => x.id === currentEditingRow ? {
        ...x,
        supervisor: sup.nome, // mantém compatibilidade com UI
        supervisor_nome: sup.nome, // campo esperado pela API
        supervisor_conselho: sup.numero_conselho || ''
      } : x))
      updateCell(currentEditingRow, 'supervisor_nome', sup.nome)
      updateCell(currentEditingRow, 'supervisor_conselho', sup.numero_conselho || '')
    }
    setShowSupervisorModal(false)
    setCurrentEditingRow(null)
    setSupervisorSearch('')
  }

  function selectUnidadeNova(unidadeNome) {
    setNovaVaga(prev => ({ ...prev, unidade_setor: unidadeNome }))
    setShowUnidadeModal(false)
    setCurrentEditingRow(null)
    setUnidadeSearch('')
  }

  function openUnidadeModalNova() {
    setCurrentEditingRow('nova-vaga')
    setShowUnidadeModal(true)
  }

  function openSupervisorModalNova() {
    setCurrentEditingRow('nova-vaga')
    setShowSupervisorModal(true)
  }

  function abrirCriarEstagio(vaga) {
    setVagaSelecionada(vaga)
    const periodoSug = [
      vaga?.data_inicio && vaga?.data_fim ? `${vaga.data_inicio} a ${vaga.data_fim}` : (vaga?.data_inicio || ''),
      vaga?.dias_semana || '',
      vaga?.horario || ''
    ].filter(Boolean).join(' | ')
    setNovoEstagio({ nome: '', email: '', periodo: periodoSug })
    setCreateEstagioError('')
    setCreateEstagioSuccess('')
    setShowCreateEstagio(true)
  }

  async function confirmarCriarEstagio() {
    if (!vagaSelecionada) return
    const { id } = vagaSelecionada
    const body = { ...novoEstagio }
    if (!body.nome || !body.email) {
      setCreateEstagioError('Informe nome e e-mail do estudante')
      return
    }
    setCreatingEstagio(true)
    setCreateEstagioError('')
    setCreateEstagioSuccess('')
    try {
      const res = await fetch(`${apiBase}/vagas/${id}/criar-estagio`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(body)
      })
      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || 'Falha ao criar estágio')
      }
      const estagio = await res.json()
      setCreateEstagioSuccess(`Estágio criado (#${estagio.id})`)
    } catch (e) {
      setCreateEstagioError(String(e.message || e))
    } finally {
      setCreatingEstagio(false)
    }
  }

  async function criarNovaVaga() {
    setNovaVagaError('')
    setNovaVagaSuccess('')

    // Validações básicas
    if (!novaVaga.unidade_setor) {
      setNovaVagaError('Unidade é obrigatória')
      return
    }
    if (!novaVaga.disciplina) {
      setNovaVagaError('Disciplina é obrigatória')
      return
    }

    try {
      // Checagem leve: informar que o sistema criará supervisor automaticamente se não existir
      // (o backend já realiza a auto-criação, aqui é apenas UX)
      if (novaVaga.supervisor && novaVaga.supervisor.trim() && !supervisores.some(s => (s.nome||'') === novaVaga.supervisor.trim())) {
        // apenas uma mensagem não bloqueante; segue com o POST
        console.debug(`Supervisor '${novaVaga.supervisor}' não listado localmente — será criado automaticamente.`)
      }
      // Normalizar alguns campos contra catálogos locais antes do POST
      const unidadeCanon = normalizeToCatalogName(novaVaga.unidade_setor, unidades, 'nome')
      const payload = {
        ...novaVaga,
        unidade_setor: unidadeCanon,
        // Backend espera 'supervisor_nome' (mantemos 'supervisor' apenas no estado/UI)
        supervisor_nome: (novaVaga.supervisor_nome || novaVaga.supervisor || '').trim(),
        estudante_nome: (novaVaga.estudante_nome || '').trim(),
        quantidade_grupos: parseInt(novaVaga.quantidade_grupos) || 0,
        num_estagiarios_por_grupo: parseInt(novaVaga.num_estagiarios_por_grupo) || 0,
        carga_horaria_individual: parseValor(novaVaga.carga_horaria_individual),
        valor: parseValor(novaVaga.valor),
        force_create: forceCreate
      }

      const res = await fetch(`${apiBase}/anexo2/atividades`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        const newActivity = await res.json()
        setNovaVagaSuccess('Vaga criada com sucesso!')
        setDuplicateWarning(null)
        setForceCreate(false)
        // Reset form
        setNovaVaga({
          unidade_setor: '',
          disciplina: '',
          descricao: '',
          nivel: 'M',
          data_inicio: '',
          data_fim: '',
          horario: '',
          dias_semana: '',
          instituicao_ensino: '',
          curso: '',
          estudante_nome: '',
          supervisor: '',
          supervisor_nome: '',
          supervisor_conselho: '',
          quantidade_grupos: 0,
          num_estagiarios_por_grupo: 0,
          carga_horaria_individual: '',
          valor: ''
        })
        setSelectedInstituicaoId(null)
        setCursos([])
        setSelectedDias([])
        // Recarregar lista
        setTimeout(() => {
          setShowNovaVagaModal(false)
          setNovaVagaSuccess('')
          load()
        }, 1500)
      } else if (res.status === 409) {
        // Duplicata detectada
        const error = await res.json()
        setDuplicateWarning(error.detail)
      } else {
        let msg = 'Erro desconhecido'
        try {
          const error = await res.json()
          msg = typeof error.detail === 'string' ? error.detail : JSON.stringify(error.detail)
        } catch {}
        console.error('Erro ao criar vaga (POST /anexo2/atividades):', msg)
        setNovaVagaError(msg)
      }
    } catch (err) {
      setNovaVagaError('Erro ao conectar com o servidor: ' + err.message)
    }
  }
  
  function confirmarCriacaoDuplicata() {
    setForceCreate(true)
    setDuplicateWarning(null)
    // Resubmeter imediatamente
    setTimeout(() => criarNovaVaga(), 100)
  }
  
  function cancelarCriacaoDuplicata() {
    setDuplicateWarning(null)
    setForceCreate(false)
  }
  
  // ==================== AUTO-FILL ====================
  
  async function buscarAutoFill() {
    if (!novaVaga.unidade_setor) {
      setNovaVagaError('Selecione uma unidade primeiro')
      return
    }
    
    try {
      const res = await fetch(
        `${apiBase}/anexo2/atividades/suggest-autofill?unidade_setor=${encodeURIComponent(novaVaga.unidade_setor)}`,
        { headers: getAuthHeaders() }
      )
      
      if (res.ok) {
        const data = await res.json()
        if (data.found) {
          setNovaVaga(prev => ({
            ...prev,
            ...data.suggestions
          }))
          setNovaVagaSuccess('Campos preenchidos com base na última vaga desta unidade!')
          setTimeout(() => setNovaVagaSuccess(''), 2000)
        } else {
          setNovaVagaError(data.message)
          setTimeout(() => setNovaVagaError(''), 2000)
        }
      }
    } catch (err) {
      setNovaVagaError('Erro ao buscar sugestões')
    }
  }
  
  // ==================== TEMPLATES ====================
  
  async function carregarTemplates() {
    try {
      const res = await fetch(`${apiBase}/vagas/templates`, { headers: getAuthHeaders() })
      if (res.ok) {
        const data = await res.json()
        setTemplates(data)
      }
    } catch (err) {
      console.error('Erro ao carregar templates:', err)
    }
  }
  
  async function salvarComoTemplate() {
    if (!templateNome.trim()) {
      alert('Digite um nome para o template')
      return
    }
    
    try {
      const templateData = JSON.stringify({
        disciplina: novaVaga.disciplina,
        descricao: novaVaga.descricao,
        nivel: novaVaga.nivel,
        horario: novaVaga.horario,
        dias_semana: novaVaga.dias_semana,
        quantidade_grupos: novaVaga.quantidade_grupos,
        num_estagiarios_por_grupo: novaVaga.num_estagiarios_por_grupo,
        carga_horaria_individual: novaVaga.carga_horaria_individual,
        valor: novaVaga.valor
      })
      
      const res = await fetch(`${apiBase}/vagas/templates`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          nome: templateNome,
          descricao: templateDescricao,
          template_data: templateData
        })
      })
      
      if (res.ok) {
        alert('Template salvo com sucesso!')
        setShowSaveTemplateModal(false)
        setTemplateNome('')
        setTemplateDescricao('')
        carregarTemplates()
      } else {
        const error = await res.json()
        alert('Erro ao salvar template: ' + (error.detail || 'Erro desconhecido'))
      }
    } catch (err) {
      alert('Erro ao salvar template: ' + err.message)
    }
  }
  
  async function carregarTemplate(templateId) {
    try {
      const res = await fetch(`${apiBase}/vagas/templates/${templateId}`, { headers: getAuthHeaders() })
      if (res.ok) {
        const template = await res.json()
        const data = JSON.parse(template.template_data)
        setNovaVaga(prev => ({
          ...prev,
          ...data
        }))
        setShowTemplatesModal(false)
        setNovaVagaSuccess('Template carregado!')
        setTimeout(() => setNovaVagaSuccess(''), 2000)
      }
    } catch (err) {
      alert('Erro ao carregar template: ' + err.message)
    }
  }
  
  async function deletarTemplate(templateId) {
    if (!confirm('Deseja realmente excluir este template?')) return
    
    try {
      const res = await fetch(`${apiBase}/vagas/templates/${templateId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
      
      if (res.ok) {
        alert('Template excluído!')
        carregarTemplates()
      }
    } catch (err) {
      alert('Erro ao excluir template: ' + err.message)
    }
  }
  
  // ==================== BULK IMPORT ====================
  
  async function importarVagasBulk() {
    if (!importFile) {
      alert('Selecione um arquivo primeiro')
      return
    }
    
    try {
      const formData = new FormData()
      formData.append('file', importFile)
      
      const res = await fetch(`${apiBase}/vagas/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      })
      
      if (res.ok) {
        const results = await res.json()
        setImportResults(results)
        // Recarregar lista se houve sucessos
        if (results.sucesso > 0) {
          load()
        }
      } else {
        const error = await res.json()
        alert('Erro ao importar: ' + (error.detail || 'Erro desconhecido'))
      }
    } catch (err) {
      alert('Erro ao importar arquivo: ' + err.message)
    }
  }
  
  function fecharImportModal() {
    setShowImportModal(false)
    setImportFile(null)
    setImportResults(null)
  }

  async function load() {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (unidade) params.set('unidade', unidade)
    if (supervisor) params.set('supervisor', supervisor)
    if (dia) params.set('dia', dia)
  if (exercicio) params.set('exercicio', exercicio)
  try {
    const res = await fetch(`${apiBase}/vagas?${params.toString()}`,{ headers: getAuthHeaders() })
    if (!res.ok) {
      console.warn('Falha ao carregar vagas:', res.status, await res.text())
      setRows([])
      setTotalVagas(0)
      return
    }
    const data = await res.json()
    setRows(data.items || [])
    setTotalVagas(data.total_vagas || 0)
  } catch (e) {
    console.error('Erro na requisição de vagas:', e)
    setRows([])
    setTotalVagas(0)
  }
  }
  async function loadWithFilters(f) {
    const params = new URLSearchParams()
    if (f.q) params.set('q', f.q)
    if (f.unidade) params.set('unidade', f.unidade)
    if (f.supervisor) params.set('supervisor', f.supervisor)
    if (f.dia) params.set('dia', f.dia)
    if (f.exercicio) params.set('exercicio', f.exercicio)
    try {
      const res = await fetch(`${apiBase}/vagas?${params.toString()}`, { headers: getAuthHeaders() })
      if (!res.ok) {
        console.warn('Falha ao carregar vagas (filters):', res.status, await res.text())
        setRows([])
        setTotalVagas(0)
        return
      }
      const data = await res.json()
      setRows(data.items || [])
      setTotalVagas(data.total_vagas || 0)
    } catch (e) {
      console.error('Erro na requisição de vagas (filters):', e)
      setRows([])
      setTotalVagas(0)
    }
  }

  async function loadFinance() {
    try {
      const res = await fetch(`${apiBase}/config/financeiro`, { headers: getAuthHeaders() })
      if (!res.ok) return
      const data = await res.json()
      setFinance(data)
    } catch {}
  }

  async function saveFinance() {
    await fetch(`${apiBase}/config/financeiro`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(finance) })
    await load()
  }

  useEffect(() => {
    loadUser();
    loadFinance();
    loadSupervisores();
    loadUnidades();
    carregarTemplates();
    // inicializa filtros pela URL (para links vindos do dashboard)
    const p = new URLSearchParams(window.location.search)
    const f = {
      q: p.get('q') || '',
      unidade: p.get('unidade') || '',
      supervisor: p.get('supervisor') || '',
      dia: p.get('dia') || '',
      exercicio: p.get('exercicio') || ''
    }
    if (f.q) setQ(f.q)
    if (f.unidade) setUnidade(f.unidade)
    if (f.supervisor) setSupervisor(f.supervisor)
    if (f.dia) setDia(f.dia)
    if (f.exercicio) setExercicio(f.exercicio)
    loadWithFilters(f)
  }, [])

  // Carregar instituições quando abrir o modal de Nova Vaga
  useEffect(() => {
    if (showNovaVagaModal) {
      loadInstituicoes()
      // inicializa chips de dias com base no campo atual
      const parsed = parseDiasTexto(novaVaga.dias_semana)
      const arr = (parsed ? parsed.split(/,\s*/).filter(Boolean) : [])
      setSelectedDias(arr)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showNovaVagaModal])

  // Helpers para manipular chips de dias na Nova Vaga
  function toggleDia(diaLabel) {
    setSelectedDias(prev => {
      const exists = prev.includes(diaLabel)
      const next = exists ? prev.filter(x => x !== diaLabel) : [...prev, diaLabel]
      // normaliza e ordena conforme padrão
      const norm = ordenarDias(next)
      setNovaVaga(current => ({ ...current, dias_semana: norm }))
      return next
    })
  }

  async function updateCell(id, field, value) {
    setSaving(s => ({ ...s, [id]: true }))
    try {
      const res = await fetch(`${apiBase}/anexo2/atividades/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ [field]: value })
      })
      if (res.ok) {
        const upd = await res.json()
        setRows(prev => prev.map(r => r.id === id ? { ...r, ...upd } : r))
      }
    } finally {
      setSaving(s => ({ ...s, [id]: false }))
    }
  }

  const setFieldError = (id, field, msg) => {
    setErrors(prev => ({ ...prev, [id]: { ...(prev[id]||{}), [field]: msg } }))
  }
  const clearFieldError = (id, field) => {
    setErrors(prev => {
      const row = { ...(prev[id]||{}) }
      delete row[field]
      const next = { ...prev, [id]: row }
      return next
    })
  }
  const getFieldError = (id, field) => (errors[id] && errors[id][field]) || ''

  function exportCSV() {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (unidade) params.set('unidade', unidade)
    if (supervisor) params.set('supervisor', supervisor)
    if (dia) params.set('dia', dia)
    if (exercicio) params.set('exercicio', exercicio)
    // Download autenticado via fetch para incluir Bearer token
    fetch(`${apiBase}/vagas/csv?${params.toString()}`, { headers: getAuthHeaders() })
      .then(async res => {
        if (!res.ok) {
          const msg = await res.text()
          throw new Error(msg || 'Falha ao exportar CSV')
        }
        return res.blob()
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'vagas.csv'
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(url)
      })
      .catch(err => {
        alert('Erro ao exportar CSV: ' + (err?.message || String(err)))
      })
  }

  return (
    <Layout user={user}>
      <div className={`vagas-root density-${density}`}>
      <div className="page-header">
        <h1>Vagas de Estágio</h1>
        <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
          <label style={{display:'flex',alignItems:'center',gap:6}}>
            <span style={{fontSize:'0.9rem',color:'#475569'}}>Densidade</span>
            <select value={density} onChange={e=>setDensity(e.target.value)} style={{padding:'6px 8px', border:'1px solid #cbd5e1', borderRadius:6}}>
              <option value="compact">Compacta</option>
              <option value="cozy">Média</option>
              <option value="comfortable">Confortável</option>
            </select>
          </label>
          <button className="btn-primary" onClick={()=>setShowNovaVagaModal(true)}>+ Nova Vaga</button>
          <button className="btn-secondary" onClick={()=>setShowImportModal(true)}>📥 Importar</button>
        </div>
      </div>
      <div className="filters-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 0.8fr auto auto', gap: 8, marginBottom: 12 }}>
        <input placeholder="Buscar (disciplina, descrição, dia, unidade)" value={q} onChange={e=>setQ(e.target.value)} />
        <input placeholder="Unidade" value={unidade} onChange={e=>setUnidade(e.target.value)} />
        <input placeholder="Supervisor" value={supervisor} onChange={e=>setSupervisor(e.target.value)} />
        <input placeholder="Dia da semana (ex: Terça)" value={dia} onChange={e=>setDia(e.target.value)} />
        <input placeholder="Exercício (ex: 2025)" value={exercicio} onChange={e=>setExercicio(e.target.value)} />
        <button className="btn-primary" onClick={load}>Filtrar</button>
        <button className="btn-secondary" onClick={exportCSV}>Exportar CSV</button>
      </div>
      <div className="summary-bar" style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 8 }}>
        <div>Total de vagas (filtro): <b>{totalVagas}</b></div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <span>R$ por hora:</span>
          <input style={{ width: 100 }} value={finance.valor_hora} onChange={e=>setFinance({ ...finance, valor_hora: e.target.value })} />
          <button className="btn-secondary" onClick={saveFinance}>Salvar</button>
        </div>
      </div>
      <div className="table-container vagas-table-container">
        <table className="vagas-table">
          <thead>
            <tr>
              <th title="Unidade/Setor">Unidade</th>
              <th title="Disciplina">Discipl.</th>
              <th title="Descrição">Descrição</th>
              <th title="Nível">Nível</th>
              <th title="Data Início">Dt. Iníc.</th>
              <th title="Data Fim">Dt. Fim</th>
              <th title="Horário">Horário</th>
              <th title="Dias da Semana">Dias</th>
              <th title="Supervisor">Superv.</th>
              <th title="Número do Conselho">Nº Cons.</th>
              <th title="Quantidade de Grupos">Qtd Grp</th>
              <th title="Estagiários por Grupo">Est/Grp</th>
              <th title="Carga Horária Individual">CH Ind.</th>
              <th title="Valor">Valor</th>
              <th title="Vagas">Vagas</th>
              <th title="Valor Total">Vlr Total</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td>
                  <div style={{display:'flex',gap:'4px',alignItems:'center'}}>
                    <input style={{flex:1}} title={r.unidade_setor||''} value={r.unidade_setor||''} onChange={e=>setRows(prev=>prev.map(x=>x.id===r.id?{...x,unidade_setor:e.target.value}:x))} onBlur={e=>updateCell(r.id,'unidade_setor',e.target.value)} />
                    <button style={{padding:'4px 8px',borderRadius:'4px',border:'1px solid #cbd5e1',background:'#f8fafc',cursor:'pointer',fontSize:'0.85rem'}} onClick={()=>openUnidadeModal(r.id)} title="Buscar unidade">🔍</button>
                  </div>
                </td>
                <td>
                  <input title={r.disciplina||''} list="disciplinas-options" value={r.disciplina||''} onChange={e=>setRows(prev=>prev.map(x=>x.id===r.id?{...x,disciplina:e.target.value}:x))} onBlur={e=>updateCell(r.id,'disciplina',e.target.value)} />
                </td>
                <td>
                  <input title={r.descricao||''} list="descricoes-options" value={r.descricao||''} onChange={e=>setRows(prev=>prev.map(x=>x.id===r.id?{...x,descricao:e.target.value}:x))} onBlur={e=>updateCell(r.id,'descricao',e.target.value)} />
                </td>
                <td>
                  <input title={r.nivel||''} value={r.nivel||''} onChange={e=>setRows(prev=>prev.map(x=>x.id===r.id?{...x,nivel:e.target.value}:x))} onBlur={e=>updateCell(r.id,'nivel',e.target.value)} />
                </td>
                <td>
                  <div className="date-cell">
                    <input
                      type="date"
                      title={r.data_inicio||''}
                      className={getFieldError(r.id,'data_inicio')? 'invalid-input':''}
                      value={r.data_inicio||''}
                      onChange={e=>setRows(prev=>prev.map(x=>x.id===r.id?{...x,data_inicio:e.target.value}:x))}
                      onBlur={e=>{ 
                        const norm = normalizarDataBR(e.target.value); 
                        const fim = r.data_fim; 
                        const ok = dataCoerente(norm, fim); 
                        if (!ok) { 
                          setFieldError(r.id,'data_inicio','Data início deve ser menor ou igual à data fim.'); 
                        } else { 
                          clearFieldError(r.id,'data_inicio'); 
                          clearFieldError(r.id,'data_fim'); 
                          updateCell(r.id,'data_inicio',norm);
                          // se não houver data fim, preencher igual ao início (padrão)
                          if (!fim) {
                            setRows(prev=>prev.map(x=>x.id===r.id?{...x,data_fim:norm}:x));
                            updateCell(r.id,'data_fim',norm)
                          }
                        }
                        setRows(prev=>prev.map(x=>x.id===r.id?{...x,data_inicio:norm}:x)) 
                      }}
                    />
                    <div className="date-quick">
                      <button type="button" title="Preenchimento rápido" onClick={(e)=>{
                        e.preventDefault();
                        const hoje = todayYMD();
                        const fimMes = endOfMonth(hoje);
                        const a = {
                          hoje: { ini: hoje, fim: hoje },
                          '+30d': { ini: hoje, fim: addDays(hoje,30) },
                          'mês': monthRangeFrom(hoje),
                        }
                        // aplicar mês vigente
                        setRows(prev=>prev.map(x=>x.id===r.id?{...x, data_inicio:a['mês'].ini, data_fim:a['mês'].fim}:x));
                        updateCell(r.id,'data_inicio',a['mês'].ini);
                        updateCell(r.id,'data_fim',a['mês'].fim);
                      }}>📅</button>
                    </div>
                  </div>
                  {getFieldError(r.id,'data_inicio') && <div className="input-hint error">{getFieldError(r.id,'data_inicio')}</div>}
                </td>
                <td>
                  <div className="date-cell">
                    <input 
                      type="date"
                      title={r.data_fim||''}
                      className={getFieldError(r.id,'data_fim')? 'invalid-input':''}
                      value={r.data_fim||''}
                      onChange={e=>setRows(prev=>prev.map(x=>x.id===r.id?{...x,data_fim:e.target.value}:x))}
                      onBlur={e=>{ 
                        const norm = normalizarDataBR(e.target.value); 
                        const ini = r.data_inicio; 
                        const ok = dataCoerente(ini, norm); 
                        if (!ok) { 
                          setFieldError(r.id,'data_fim','Data fim deve ser maior ou igual à data início.'); 
                        } else { 
                          clearFieldError(r.id,'data_fim'); 
                          clearFieldError(r.id,'data_inicio'); 
                          updateCell(r.id,'data_fim',norm) 
                        } 
                        setRows(prev=>prev.map(x=>x.id===r.id?{...x,data_fim:norm}:x)) 
                      }} 
                    />
                    <div className="date-quick">
                      <button type="button" title="Fim = Início + 30 dias" onClick={(e)=>{
                        e.preventDefault();
                        const ini = r.data_inicio || todayYMD();
                        const fim = addDays(ini,30);
                        setRows(prev=>prev.map(x=>x.id===r.id?{...x, data_fim:fim, data_inicio:ini}:x));
                        updateCell(r.id,'data_inicio',ini);
                        updateCell(r.id,'data_fim',fim);
                      }}>+30</button>
                    </div>
                  </div>
                  {getFieldError(r.id,'data_fim') && <div className="input-hint error">{getFieldError(r.id,'data_fim')}</div>}
                </td>
                <td>
                  <input className={getFieldError(r.id,'horario')? 'invalid-input':''} value={r.horario||''} onChange={e=>{ const v = maskHorario(e.target.value); setRows(prev=>prev.map(x=>x.id===r.id?{...x,horario:v}:x)) }} onBlur={e=>{ const norm = normalizarHora(e.target.value); if (norm && !horarioValido(norm)) { setFieldError(r.id,'horario','Horário inválido. Use HH:MM às HH:MM e fim maior que início.'); setRows(prev=>prev.map(x=>x.id===r.id?{...x,horario:norm}:x)); } else { clearFieldError(r.id,'horario'); setRows(prev=>prev.map(x=>x.id===r.id?{...x,horario:norm}:x)); updateCell(r.id,'horario',norm) } }} />
                  {getFieldError(r.id,'horario') && <div className="input-hint error">{getFieldError(r.id,'horario')}</div>}
                </td>
                <td>
                  <input className={getFieldError(r.id,'dias_semana')? 'invalid-input':''} value={r.dias_semana||''} onChange={e=>setRows(prev=>prev.map(x=>x.id===r.id?{...x,dias_semana:e.target.value}:x))} onBlur={e=>{ const raw = e.target.value; const norm = parseDiasTexto(raw); const hasInput = (raw||'').trim().length>0; if (hasInput && !norm) { setFieldError(r.id,'dias_semana','Dia(s) inválido(s). Use Seg, Ter, Qua, Qui, Sex, Sáb, Dom.'); } else { clearFieldError(r.id,'dias_semana'); setRows(prev=>prev.map(x=>x.id===r.id?{...x,dias_semana:norm}:x)); updateCell(r.id,'dias_semana',norm) } }} />
                  {getFieldError(r.id,'dias_semana') && <div className="input-hint error">{getFieldError(r.id,'dias_semana')}</div>}
                </td>
                <td>
                  <div style={{display:'flex',gap:'4px',alignItems:'center'}}>
                    <input style={{flex:1}} title={(r.supervisor||r.supervisor_nome||'')} list="supervisores-options" value={(r.supervisor||r.supervisor_nome||'')} onChange={e=>setRows(prev=>prev.map(x=>x.id===r.id?{...x,supervisor:e.target.value}:x))} onBlur={e=>updateCell(r.id,'supervisor_nome',e.target.value)} />
                    <button style={{padding:'4px 8px',borderRadius:'4px',border:'1px solid #cbd5e1',background:'#f8fafc',cursor:'pointer',fontSize:'0.85rem'}} onClick={()=>openSupervisorModal(r.id)} title="Buscar supervisor">🔍</button>
                  </div>
                </td>
                <td>
                  <input inputMode="numeric" pattern="\\d*" value={r.supervisor_conselho||''} onChange={e=>{ const digits = (e.target.value||'').replace(/\D/g,''); setRows(prev=>prev.map(x=>x.id===r.id?{...x,supervisor_conselho:digits}:x)) }} onBlur={e=>{ const digits = (e.target.value||'').replace(/\D/g,''); setRows(prev=>prev.map(x=>x.id===r.id?{...x,supervisor_conselho:digits}:x)); updateCell(r.id,'supervisor_conselho',digits) }} />
                </td>
                <td>
                  <input
                    inputMode="numeric"
                    pattern="\\d*"
                    className={getFieldError(r.id,'quantidade_grupos')? 'invalid-input':''}
                    value={typeof r.quantidade_grupos==='number' ? String(r.quantidade_grupos) : (r.quantidade_grupos ?? '')}
                    onChange={e=>{
                      const digits = (e.target.value||'').replace(/\\D/g,'')
                      setRows(prev=>prev.map(x=>x.id===r.id?{...x,quantidade_grupos:digits}:x))
                    }}
                    onBlur={e=>{
                      const digits = (e.target.value||'').replace(/\\D/g,'')
                      if (digits === '') { setFieldError(r.id,'quantidade_grupos','Informe um número (mín. 0).'); return }
                      const n = Math.max(0, parseInt(digits,10))
                      clearFieldError(r.id,'quantidade_grupos')
                      setRows(prev=>prev.map(x=>x.id===r.id?{...x,quantidade_grupos:n}:x))
                      updateCell(r.id,'quantidade_grupos',n)
                    }}
                  />
                  {getFieldError(r.id,'quantidade_grupos') && <div className="input-hint error">{getFieldError(r.id,'quantidade_grupos')}</div>}
                </td>
                <td>
                  <input
                    inputMode="numeric"
                    pattern="\\d*"
                    className={getFieldError(r.id,'num_estagiarios_por_grupo')? 'invalid-input':''}
                    value={typeof r.num_estagiarios_por_grupo==='number' ? String(r.num_estagiarios_por_grupo) : (r.num_estagiarios_por_grupo ?? '')}
                    onChange={e=>{
                      const digits = (e.target.value||'').replace(/\\D/g,'')
                      setRows(prev=>prev.map(x=>x.id===r.id?{...x,num_estagiarios_por_grupo:digits}:x))
                    }}
                    onBlur={e=>{
                      const digits = (e.target.value||'').replace(/\\D/g,'')
                      if (digits === '') { setFieldError(r.id,'num_estagiarios_por_grupo','Informe um número (mín. 0).'); return }
                      const n = Math.max(0, parseInt(digits,10))
                      clearFieldError(r.id,'num_estagiarios_por_grupo')
                      setRows(prev=>prev.map(x=>x.id===r.id?{...x,num_estagiarios_por_grupo:n}:x))
                      updateCell(r.id,'num_estagiarios_por_grupo',n)
                    }}
                  />
                  {getFieldError(r.id,'num_estagiarios_por_grupo') && <div className="input-hint error">{getFieldError(r.id,'num_estagiarios_por_grupo')}</div>}
                </td>
                <td>
                  <input inputMode="decimal" pattern="[0-9]*[.,]?[0-9]*" value={r.carga_horaria_individual ?? ''} onChange={e=>setRows(prev=>prev.map(x=>x.id===r.id?{...x,carga_horaria_individual:e.target.value}:x))} onBlur={e=>{ const n = parseValor(e.target.value); setRows(prev=>prev.map(x=>x.id===r.id?{...x,carga_horaria_individual:n}:x)); updateCell(r.id,'carga_horaria_individual',n) }} />
                </td>
                <td>
                  <input inputMode="decimal" pattern="[0-9]*[.,]?[0-9]*" value={r.valor ?? ''} onChange={e=>setRows(prev=>prev.map(x=>x.id===r.id?{...x,valor:e.target.value}:x))} onBlur={e=>{ const n = parseValor(e.target.value); setRows(prev=>prev.map(x=>x.id===r.id?{...x,valor:n}:x)); updateCell(r.id,'valor',n) }} />
                </td>
                <td><b>{r.vagas}</b></td>
                <td>{typeof r.valor_total === 'number' ? r.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : ''}</td>
                <td>
                  <button className="btn-primary btn-icon" onClick={()=>abrirCriarEstagio(r)} title="Criar Estágio a partir desta vaga">➕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
  </div>
  </div>{/* vagas-root */}
      {/* Datalists para sugestões, alinhadas ao Anexo II */}
      <datalist id="disciplinas-options">
        {DISCIPLINAS_EXPANDIDAS.map((d, i) => <option key={i} value={d} />)}
      </datalist>
      <datalist id="descricoes-options">
        {DESCRICOES_SUGERIDAS.map((d, i) => <option key={i} value={d} />)}
      </datalist>
      <datalist id="supervisores-options">
        {supervisores.map((s, i) => <option key={i} value={s.nome || ''} />)}
      </datalist>

    {/* Modal de Nova Vaga */}
  <Modal isOpen={showNovaVagaModal} onClose={()=>setShowNovaVagaModal(false)} title="➕ Criar Nova Vaga" size="full" closeOnOverlayClick={false} closeOnEsc={false}>
        {novaVagaError && (
          <div className="nova-vaga-alert error">
            <span>⚠️</span>
            <span>{novaVagaError}</span>
          </div>
        )}
        {novaVagaSuccess && (
          <div className="nova-vaga-alert success">
            <span>✅</span>
            <span>{novaVagaSuccess}</span>
          </div>
        )}
        
        {/* Botões de ferramentas */}
  <div style={{display: 'flex', gap: '8px', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #e0e0e0'}}>
          <button className="btn-secondary" onClick={buscarAutoFill} title="Preencher com base na última vaga desta unidade">
            🔄 Auto-Preencher
          </button>
          <button className="btn-secondary" onClick={()=>setShowTemplatesModal(true)} title="Carregar um template salvo">
            📋 Carregar Template
          </button>
          <button className="btn-secondary" onClick={()=>setShowSaveTemplateModal(true)} title="Salvar configuração atual como template">
            💾 Salvar como Template
          </button>
        </div>
        
        {/* Warning de duplicata */}
        {duplicateWarning && (
          <div className="nova-vaga-alert warning" style={{backgroundColor: '#fff3cd', border: '1px solid #ffc107'}}>
            <div>
              <strong>⚠️ Vaga Similar Encontrada</strong>
              <p style={{margin: '8px 0'}}>{duplicateWarning.message}</p>
              {duplicateWarning.existing_vaga && (
                <div style={{fontSize: '0.9em', marginTop: '8px', padding: '8px', background: '#f8f9fa', borderRadius: '4px'}}>
                  <p><strong>Vaga existente:</strong></p>
                  <p>Unidade: {duplicateWarning.existing_vaga.unidade}</p>
                  <p>Disciplina: {duplicateWarning.existing_vaga.disciplina}</p>
                  <p>Horário: {duplicateWarning.existing_vaga.horario}</p>
                  <p>Dias: {duplicateWarning.existing_vaga.dias_semana}</p>
                </div>
              )}
              <div style={{display: 'flex', gap: '8px', marginTop: '12px'}}>
                <button className="btn-primary" onClick={confirmarCriacaoDuplicata}>
                  ✅ Criar Mesmo Assim
                </button>
                <button className="btn-secondary" onClick={cancelarCriacaoDuplicata}>
                  ❌ Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
        
        <div className="nova-vaga-form">
          <div className="form-field">
            <label>Nome do Estudante</label>
            <input 
              value={novaVaga.estudante_nome}
              onChange={e=>setNovaVaga({...novaVaga, estudante_nome: e.target.value})}
              placeholder="Digite o nome completo do estudante"
            />
          </div>

          <div className="form-field">
            <label>
              Unidade/Setor <span className="required">*</span>
            </label>
            <div className="input-with-button">
              <input 
                value={novaVaga.unidade_setor} 
                onChange={e=>setNovaVaga({...novaVaga, unidade_setor: e.target.value})}
                placeholder="Digite ou busque..."
              />
              <button onClick={openUnidadeModalNova}>🔍 Buscar</button>
            </div>
          </div>

          <div className="form-field">
            <label>
              Disciplina <span className="required">*</span>
            </label>
            <input 
              list="disciplinas-options"
              value={novaVaga.disciplina} 
              onChange={e=>setNovaVaga({...novaVaga, disciplina: e.target.value})}
              placeholder="Ex: Cuidados Intensivos"
            />
          </div>

          <div className="form-field full-width">
            <label>Descrição</label>
            <textarea 
              value={novaVaga.descricao} 
              onChange={e=>setNovaVaga({...novaVaga, descricao: e.target.value})}
              placeholder="Descreva as atividades..."
              list="descricoes-options"
            />
          </div>

          <div className="form-field">
            <label>Nível</label>
            <select value={novaVaga.nivel} onChange={e=>setNovaVaga({...novaVaga, nivel: e.target.value})}>
              <option value="M">Médio</option>
              <option value="S">Superior</option>
            </select>
          </div>

          <div className="form-field">
            <label>Supervisor</label>
            <div className="input-with-button">
              <input 
                value={novaVaga.supervisor} 
                onChange={e=>setNovaVaga({...novaVaga, supervisor: e.target.value})}
                placeholder="Digite ou busque..."
              />
              <button onClick={openSupervisorModalNova}>🔍 Buscar</button>
            </div>
          </div>

          <div className="form-field">
            <label>Data Início</label>
            <input 
              type="date"
              value={novaVaga.data_inicio} 
              onChange={e=>setNovaVaga({...novaVaga, data_inicio: e.target.value})}
            />
          </div>

          <div className="form-field">
            <label>Data Fim</label>
            <input 
              type="date"
              value={novaVaga.data_fim} 
              onChange={e=>setNovaVaga({...novaVaga, data_fim: e.target.value})}
            />
          </div>

          <div className="form-field">
            <label>Horário</label>
            <input 
              value={novaVaga.horario} 
              onChange={e=>setNovaVaga({...novaVaga, horario: maskHorario(e.target.value)})}
              placeholder="07:30 às 11:00"
            />
            <span className="help-text">Ex: 07:30 às 11:00</span>
          </div>

          <div className="form-field">
            <label>Dias da Semana</label>
            {/* Chips clicáveis */}
            <div className="chip-row" style={{display:'flex', flexWrap:'wrap', gap: '6px', marginBottom: '8px'}}>
              {DIAS_ORD.map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={()=>toggleDia(d)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '16px',
                    border: '1px solid',
                    borderColor: selectedDias.includes(d) ? '#0ea5e9' : '#cbd5e1',
                    background: selectedDias.includes(d) ? '#e0f2fe' : '#fff',
                    color: '#0f172a',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                  title={`Marcar ${d}`}
                >{d}</button>
              ))}
            </div>
            {/* Entrada livre com normalização no blur */}
            <input 
              value={novaVaga.dias_semana} 
              onChange={e=>setNovaVaga({...novaVaga, dias_semana: e.target.value})}
              onBlur={e=>{
                const norm = parseDiasTexto(e.target.value)
                setNovaVaga(prev => ({...prev, dias_semana: norm}))
                const arr = (norm ? norm.split(/,\s*/).filter(Boolean) : [])
                setSelectedDias(arr)
              }}
              placeholder="Seg, Ter, Qua..."
            />
            <span className="help-text">Ex: Seg a Sex ou Seg, Qua, Sex</span>
          </div>

          {/* Instituição de Ensino (typeahead) e Curso */}
          <div className="form-field" style={{ position: 'relative' }}>
            <label>Universidade/Escola</label>
            <input
              value={instituicaoQuery}
              onChange={e=>{ setInstituicaoQuery(e.target.value); setInstDropdownOpen(true); }}
              onFocus={()=> setInstDropdownOpen(true)}
              placeholder={novaVaga.instituicao_ensino ? `Selecionado: ${novaVaga.instituicao_ensino}` : 'Digite para buscar...'}
            />
            {instDropdownOpen && (
              <div className="dropdown" style={{ position:'absolute', zIndex: 10, background:'#fff', border:'1px solid #e5e7eb', borderRadius:4, width:'100%', maxHeight:200, overflowY:'auto' }} onMouseLeave={()=>{ /* keep open until blur */ }}>
                {instLoading && <div style={{ padding:8, color:'#64748b' }}>Buscando...</div>}
                {!instLoading && instOptions.length === 0 && (
                  <div style={{ padding:8, color:'#64748b' }}>Nenhuma instituição encontrada</div>
                )}
                {!instLoading && instOptions.map(inst => (
                  <div key={inst.id} className="dropdown-item" style={{ padding:'8px 10px', cursor:'pointer' }}
                       onMouseDown={(e)=>{ e.preventDefault(); selectInstituicao(inst) }}>
                    <div style={{ fontWeight:500 }}>{inst.nome || inst.nome_fantasia || inst.razao_social}</div>
                    {(inst.razao_social && inst.razao_social !== inst.nome) && (
                      <div style={{ fontSize:12, color:'#64748b' }}>{inst.razao_social}</div>
                    )}
                  </div>
                ))}
                {/* Opção para usar como texto livre */}
                {instituicaoQuery.trim() && (
                  <div className="dropdown-item" style={{ padding:'8px 10px', cursor:'pointer', borderTop:'1px solid #f1f5f9' }}
                       onMouseDown={(e)=>{ e.preventDefault(); selectInstituicao({ id: null, nome: instituicaoQuery.trim() }) }}>
                    Usar "{instituicaoQuery.trim()}" como texto livre
                  </div>
                )}
              </div>
            )}
            <span className="help-text">Digite para buscar e selecione; também é possível usar texto livre.</span>
          </div>

          <div className="form-field">
            <label>Curso</label>
            {selectedInstituicaoId && (
              <input
                value={cursoQuery}
                onChange={e=> setCursoQuery(e.target.value)}
                placeholder="Buscar curso nesta instituição..."
                style={{ marginBottom: 6 }}
              />
            )}
            <select
              value={novaVaga.curso || ''}
              onChange={(e)=>{
                const val = e.target.value
                setNovaVaga(prev => ({ ...prev, curso: val }))
              }}
              disabled={!selectedInstituicaoId}
            >
              <option value="">-- selecione --</option>
              {(cursos || [])
                .filter(c => {
                  const nome = (c.curso_nome || c.nome || c.descricao || '').toString().toLowerCase()
                  return !cursoQuery || nome.includes(cursoQuery.toLowerCase())
                })
                .map(c => {
                  const nome = (c.curso_nome || c.nome || c.descricao || '')
                  const key = c.id || c.curso_id || nome
                  return <option key={key} value={nome}>{nome}</option>
                })}
            </select>
            <span className="help-text">Selecione a instituição antes de escolher o curso.</span>
          </div>

          <div className="form-field">
            <label>Nº Conselho</label>
            <input 
              value={novaVaga.supervisor_conselho} 
              onChange={e=>setNovaVaga({...novaVaga, supervisor_conselho: e.target.value.replace(/\D/g,'')})}
              placeholder="123456"
            />
          </div>

          <div className="form-field">
            <label>Qtd Grupos</label>
            <input 
              type="number"
              min="0"
              value={novaVaga.quantidade_grupos} 
              onChange={e=>setNovaVaga({...novaVaga, quantidade_grupos: e.target.value})}
              placeholder="0"
            />
          </div>

          <div className="form-field">
            <label>Estagiários/Grupo</label>
            <input 
              type="number"
              min="0"
              value={novaVaga.num_estagiarios_por_grupo} 
              onChange={e=>setNovaVaga({...novaVaga, num_estagiarios_por_grupo: e.target.value})}
              placeholder="0"
            />
          </div>

          <div className="form-field">
            <label>C.H. Individual</label>
            <input 
              value={novaVaga.carga_horaria_individual} 
              onChange={e=>setNovaVaga({...novaVaga, carga_horaria_individual: e.target.value})}
              placeholder="80,0"
            />
          </div>

          <div className="form-field">
            <label>Valor (R$)</label>
            <input 
              value={novaVaga.valor} 
              onChange={e=>setNovaVaga({...novaVaga, valor: e.target.value})}
              placeholder="320,00"
            />
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={()=>setShowNovaVagaModal(false)}>Cancelar</button>
          <button className="btn-primary" onClick={criarNovaVaga}>✅ Criar Vaga</button>
        </div>
      </Modal>

      {/* Modal: Criar Estágio a partir da Vaga selecionada */}
      <Modal isOpen={showCreateEstagio} onClose={()=>setShowCreateEstagio(false)} title="Criar Estágio a partir da Vaga" size="medium">
        {vagaSelecionada && (
          <div className="modal-body" style={{padding: '12px'}}>
            <div className="hint" style={{marginBottom:8, fontSize:13, color:'#475569'}}>
              Origem: <b>{vagaSelecionada.unidade_setor}</b> • {vagaSelecionada.disciplina} • {vagaSelecionada.dias_semana || ''} {vagaSelecionada.horario ? `(${vagaSelecionada.horario})` : ''}
            </div>
            <div className="form-field">
              <label>Nome do estudante <span className="required">*</span></label>
              <input value={novoEstagio.nome} onChange={e=>setNovoEstagio(prev=>({ ...prev, nome: e.target.value }))} placeholder="NOME COMPLETO" />
            </div>
            <div className="form-field">
              <label>E-mail <span className="required">*</span></label>
              <input type="email" value={novoEstagio.email} onChange={e=>setNovoEstagio(prev=>({ ...prev, email: e.target.value }))} placeholder="email@exemplo.com" />
            </div>
            <div className="form-field">
              <label>Período (opcional)</label>
              <input value={novoEstagio.periodo} onChange={e=>setNovoEstagio(prev=>({ ...prev, periodo: e.target.value }))} placeholder="ex.: 2025-03-01 a 2025-06-30 | Ter | 08:00 às 12:00" />
            </div>
            {createEstagioError && <div className="input-hint error" style={{marginTop:8}}>{createEstagioError}</div>}
            {createEstagioSuccess && <div className="input-hint success" style={{marginTop:8}}>{createEstagioSuccess}</div>}
            <div className="modal-actions" style={{display:'flex', gap:8, marginTop:12}}>
              <button className="btn-primary" disabled={creatingEstagio} onClick={confirmarCriarEstagio}>{creatingEstagio ? 'Criando…' : 'Criar Estágio'}</button>
              <button className="btn-secondary" onClick={()=>setShowCreateEstagio(false)}>Fechar</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de Unidades */}
      <Modal isOpen={showUnidadeModal} onClose={()=>setShowUnidadeModal(false)} title="Selecionar Unidade de Saúde" size="large">
        <div className="modal-search">
          <input 
            type="text" 
            placeholder="Buscar por nome, CNES ou razão social..." 
            value={unidadeSearch}
            onChange={e=>setUnidadeSearch(e.target.value)}
            autoFocus
          />
        </div>
        <div className="modal-list">
          {unidades
            .filter(u => {
              if (!unidadeSearch) return true
              const s = unidadeSearch.toLowerCase()
              return (u.nome||'').toLowerCase().includes(s) || 
                     (u.cnes||'').toLowerCase().includes(s) ||
                     (u.razao_social||'').toLowerCase().includes(s)
            })
            .map(u => (
              <div key={u.id} className="modal-list-item" onClick={()=>selectUnidade(u.nome)}>
                <div className="modal-list-item-info">
                  <div className="modal-list-item-title">{u.nome}</div>
                  <div className="modal-list-item-subtitle">
                    {u.cnes && `CNES: ${u.cnes}`} {u.razao_social && `• ${u.razao_social}`}
                  </div>
                </div>
                <div className="modal-list-item-action">Selecionar</div>
              </div>
            ))}
          {unidades.filter(u => {
            if (!unidadeSearch) return true
            const s = unidadeSearch.toLowerCase()
            return (u.nome||'').toLowerCase().includes(s) || 
                   (u.cnes||'').toLowerCase().includes(s) ||
                   (u.razao_social||'').toLowerCase().includes(s)
          }).length === 0 && (
            <div className="modal-list-empty">
              <p>Nenhuma unidade encontrada</p>
              <small>Tente outro termo de busca</small>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal de Supervisores */}
      <Modal isOpen={showSupervisorModal} onClose={()=>setShowSupervisorModal(false)} title="Selecionar Supervisor" size="large">
        <div className="modal-search">
          <input 
            type="text" 
            placeholder="Buscar por nome ou número de conselho..." 
            value={supervisorSearch}
            onChange={e=>setSupervisorSearch(e.target.value)}
            autoFocus
          />
        </div>
        <div className="modal-list">
          {supervisores
            .filter(s => {
              if (!supervisorSearch) return true
              const search = supervisorSearch.toLowerCase()
              return (s.nome||'').toLowerCase().includes(search) || 
                     (s.numero_conselho||'').toLowerCase().includes(search)
            })
            .map(s => (
              <div key={s.id} className="modal-list-item" onClick={()=>selectSupervisor(s)}>
                <div className="modal-list-item-info">
                  <div className="modal-list-item-title">{s.nome}</div>
                  <div className="modal-list-item-subtitle">
                    {s.numero_conselho && `Conselho: ${s.numero_conselho}`} {s.email && `• ${s.email}`}
                  </div>
                </div>
                <div className="modal-list-item-action">Selecionar</div>
              </div>
            ))}
          {supervisores.filter(s => {
            if (!supervisorSearch) return true
            const search = supervisorSearch.toLowerCase()
            return (s.nome||'').toLowerCase().includes(search) || 
                   (s.numero_conselho||'').toLowerCase().includes(search)
          }).length === 0 && (
            <div className="modal-list-empty">
              <p>Nenhum supervisor encontrado</p>
              <small>Tente outro termo de busca</small>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal de Templates */}
      <Modal isOpen={showTemplatesModal} onClose={()=>setShowTemplatesModal(false)} title="📋 Templates Salvos" size="medium">
        <div className="modal-body">
          {templates.length === 0 ? (
            <div className="modal-list-empty">
              <p>Nenhum template salvo ainda</p>
              <small>Preencha o formulário e clique em "Salvar como Template"</small>
            </div>
          ) : (
            <div className="modal-list">
              {templates.map(t => (
                <div key={t.id} className="modal-list-item" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <div onClick={() => carregarTemplate(t.id)} style={{cursor: 'pointer', flex: 1}}>
                    <strong>{t.nome}</strong>
                    {t.descricao && <p style={{fontSize: '0.9em', color: '#666', margin: '4px 0 0'}}>{t.descricao}</p>}
                  </div>
                  <button 
                    className="btn-danger" 
                    onClick={(e) => {e.stopPropagation(); deletarTemplate(t.id)}}
                    style={{padding: '4px 8px', fontSize: '0.85em'}}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Modal de Salvar Template */}
      <Modal isOpen={showSaveTemplateModal} onClose={()=>setShowSaveTemplateModal(false)} title="💾 Salvar Template" size="small">
        <div className="modal-body" style={{padding: '16px'}}>
          <div className="form-field">
            <label>Nome do Template <span className="required">*</span></label>
            <input 
              value={templateNome}
              onChange={e=>setTemplateNome(e.target.value)}
              placeholder="Ex: Enfermagem Manhã"
              autoFocus
            />
          </div>
          <div className="form-field">
            <label>Descrição (opcional)</label>
            <textarea 
              value={templateDescricao}
              onChange={e=>setTemplateDescricao(e.target.value)}
              placeholder="Breve descrição do template..."
              rows="3"
            />
          </div>
          <div style={{display: 'flex', gap: '8px', marginTop: '16px'}}>
            <button className="btn-primary" onClick={salvarComoTemplate}>💾 Salvar</button>
            <button className="btn-secondary" onClick={()=>setShowSaveTemplateModal(false)}>Cancelar</button>
          </div>
        </div>
      </Modal>

      {/* Modal de Importação */}
      <Modal isOpen={showImportModal} onClose={fecharImportModal} title="📥 Importar Vagas em Lote" size="large">
        <div className="modal-body" style={{padding: '16px'}}>
          <div style={{marginBottom: '16px', padding: '12px', background: '#e3f2fd', borderRadius: '4px'}}>
            <h4 style={{margin: '0 0 8px'}}>ℹ️ Formato do Arquivo</h4>
            <p style={{margin: '4px 0', fontSize: '0.9em'}}>
              Aceita arquivos <strong>CSV</strong> ou <strong>Excel (.xlsx, .xls)</strong>
            </p>
            <p style={{margin: '4px 0', fontSize: '0.9em'}}>
              <strong>Colunas obrigatórias:</strong> unidade_setor, disciplina
            </p>
            <p style={{margin: '4px 0', fontSize: '0.9em'}}>
              <strong>Colunas opcionais:</strong> descricao, nivel, data_inicio, data_fim, horario, 
              dias_semana, instituicao_ensino, curso, quantidade_grupos, num_estagiarios_por_grupo, supervisor_nome, 
              supervisor_conselho, valor
            </p>
          </div>
          
          {!importResults ? (
            <>
              <div className="form-field">
                <label>Selecione o arquivo</label>
                <input 
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={e=>setImportFile(e.target.files[0])}
                />
              </div>
              <div style={{display: 'flex', gap: '8px', marginTop: '16px'}}>
                <button className="btn-primary" onClick={importarVagasBulk} disabled={!importFile}>
                  📥 Importar
                </button>
                <button className="btn-secondary" onClick={fecharImportModal}>Cancelar</button>
              </div>
            </>
          ) : (
            <div>
              <h4 style={{color: '#2e7d32'}}>✅ Importação Concluída</h4>
              <div style={{padding: '12px', background: '#f5f5f5', borderRadius: '4px', margin: '12px 0'}}>
                <p><strong>Total de linhas:</strong> {importResults.total_linhas}</p>
                <p style={{color: '#2e7d32'}}><strong>Vagas criadas:</strong> {importResults.sucesso}</p>
                <p style={{color: '#d32f2f'}}><strong>Erros:</strong> {importResults.erros.length}</p>
              </div>
              
              {importResults.erros.length > 0 && (
                <div>
                  <h5>⚠️ Erros Encontrados:</h5>
                  <div style={{maxHeight: '200px', overflow: 'auto', fontSize: '0.85em'}}>
                    {importResults.erros.map((err, idx) => (
                      <div key={idx} style={{padding: '4px', borderBottom: '1px solid #eee'}}>
                        <strong>Linha {err.linha}:</strong> {err.erro}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {importResults.vagas_criadas.length > 0 && (
                <div style={{marginTop: '12px'}}>
                  <h5>✅ Vagas Criadas com Sucesso:</h5>
                  <div style={{maxHeight: '150px', overflow: 'auto', fontSize: '0.85em'}}>
                    {importResults.vagas_criadas.slice(0, 10).map((vaga, idx) => (
                      <div key={idx} style={{padding: '4px'}}>
                        Linha {vaga.linha}: {vaga.unidade} - {vaga.disciplina}
                      </div>
                    ))}
                    {importResults.vagas_criadas.length > 10 && (
                      <p style={{fontStyle: 'italic', color: '#666'}}>
                        ... e mais {importResults.vagas_criadas.length - 10} vagas
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              <button className="btn-primary" onClick={fecharImportModal} style={{marginTop: '16px'}}>
                Fechar
              </button>
            </div>
          )}
        </div>
      </Modal>
    </Layout>
  )
}
