// Formulário interativo de Anexo II
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { DISCIPLINAS_EXPANDIDAS } from '../constants/disciplinas'
import Layout from '../components/Layout'
import { DESCRICOES_SUGERIDAS } from '../constants/descricoes'

const API_URL = (import.meta.env && import.meta.env.VITE_API_URL) || ''

const novaAtividade = () => ({
  disciplina: '',
  descricao: '',
  nivel: '',
  unidade_setor: '',
  data_inicio: '',
  data_fim: '',
  horario: '',
  dias_semana: '',
  quantidade_grupos: '',
  num_estagiarios_por_grupo: '',
  carga_horaria_individual: '',
  supervisor_nome: '',
  supervisor_conselho: '',
  valor: ''
})

export default function Anexo2() {
  const [user, setUser] = useState(null)
  const [estagios, setEstagios] = useState([])
  const [supervisores, setSupervisores] = useState([])
  const [estagioId, setEstagioId] = useState('')
  const [cabecalho, setCabecalho] = useState({ instituicao_ensino: '', curso: '', exercicio: '', status: 'final', logo_url: '' })
  const [atividades, setAtividades] = useState([novaAtividade()])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState({ type: '', text: '' })
  const fileInputRef = useRef(null)
  const [historico, setHistorico] = useState([])
  const [versaoLabel, setVersaoLabel] = useState('')
  const [versaoComment, setVersaoComment] = useState('')
  // Importer interativo (preview Excel/CSV)
  const [importPreview, setImportPreview] = useState(null) // { headers, rows, suggestions, detected, header_row }
  const [importMap, setImportMap] = useState({}) // chave interna -> header original
  const [importLoading, setImportLoading] = useState(false)
  const [gerandoImport, setGerandoImport] = useState(false)

  // Helpers: horário mask "HH:MM às HH:MM" e validações
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
    // Aceita formatos variados e normaliza para "HH:MM às HH:MM"
    const s = (str || '')
      .toLowerCase()
      .normalize('NFD').replace(/\p{Diacritic}/gu, '') // remove acentos (às -> as)
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
    // se não conseguir dividir, tenta com todos dígitos
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
    // Tolerante a variações: "às/AS/ÀS/a/-", espaços, e formatos HH:MM, HHMM, HHhMM
    const norm = (h || '')
      .toLowerCase()
      .normalize('NFD').replace(/\p{Diacritic}/gu, '') // remove acentos
      .replace(/\s*-\s*/g, ' as ')
      .replace(/\s*a\s*/g, ' as ')
      .replace(/\s+/g, ' ')
      .trim()
    const parts = norm.split(/\sas\s/)
    if (parts.length !== 2) return false
    const parseHHMM = (p) => {
      const pm = p.match(/(\d{1,2})[:h]?(\d{2})?/) // 8:00 | 8h00 | 800
      if (!pm) return null
      let hh = parseInt(pm[1], 10)
      let mm = pm[2] !== undefined ? parseInt(pm[2], 10) : (pm[1].length === 3 ? parseInt(pm[1].slice(1),10) : 0)
      // Caso 3 dígitos (e.g., 800) acima não cobre bem; corrigir usando todos os dígitos
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
    // tenta ranges "seg a sex", "ter a qui"
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
    // lista separada por vírgula, espaço ou barra
    const parts = s.split(/[\s,\/]+/).filter(Boolean)
    const dias = parts.map(p => aliasDia[p]).filter(Boolean)
    return ordenarDias([...new Set(dias)])
  }

  useEffect(() => {
    fetchUserInfo()
    fetchEstagios()
    fetchSupervisores()
    
    // Carregar anexo2 se vier parâmetro ?estagio=X na URL
    const params = new URLSearchParams(window.location.search)
    const estagioParam = params.get('estagio')
    if (estagioParam) {
      carregarExistente(estagioParam)
    }
  }, [])

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json',
  })

  const fetchUserInfo = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/me`, { headers: getAuthHeaders() })
      if (res.ok) setUser(await res.json())
    } catch {}
  }

  const fetchEstagios = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/estagios`, { headers: getAuthHeaders() })
      if (res.ok) setEstagios(await res.json())
    } finally {
      setLoading(false)
    }
  }

  const fetchSupervisores = async () => {
    try {
      const res = await fetch(`${API_URL}/supervisores`, { headers: getAuthHeaders() })
      if (res.ok) setSupervisores(await res.json())
    } catch {}
  }

  const carregarExistente = async (id) => {
    setMsg({})
    setEstagioId(id)
    if (!id) return
    try {
      const res = await fetch(`${API_URL}/anexo2/${id}`, { headers: getAuthHeaders() })
      if (res.ok) {
        const data = await res.json()
        setCabecalho({ instituicao_ensino: data.instituicao_ensino || '', curso: data.curso || '', exercicio: data.exercicio || '', status: data.status || 'final', logo_url: data.logo_url || '' })
        setAtividades((data.atividades && data.atividades.length) ? data.atividades : [novaAtividade()])
        // histórico real
        const vres = await fetch(`${API_URL}/anexo2/${id}/versions`, { headers: getAuthHeaders() })
        if (vres.ok) {
          const vers = await vres.json()
          setHistorico(vers.map(v=>({ id:v.id, versao:v.versao, label: v.label || '', comment: v.comment || '', data:new Date(v.created_at).toLocaleString('pt-BR') })))
        } else {
          setHistorico([])
        }
      } else if (res.status === 404) {
        // Anexo2 não existe para este estágio - buscar dados do estágio para pré-preencher
        try {
          const estagioRes = await fetch(`${API_URL}/estagios/${id}`, { headers: getAuthHeaders() })
          if (estagioRes.ok) {
            const estagio = await estagioRes.json()
            // Pré-preencher cabeçalho com dados do estágio
            setCabecalho({
              instituicao_ensino: estagio.instituicao?.nome || '',
              curso: estagio.curso?.nome || '',
              exercicio: new Date().getFullYear().toString(),
              status: 'final',
              logo_url: ''
            })
            setMsg({ type: 'info', text: `Criando novo Anexo II para o estágio de ${estagio.nome}` })
          } else {
            // Estágio também não encontrado - limpar para novo
            setCabecalho({ instituicao_ensino: '', curso: '', exercicio: new Date().getFullYear().toString(), status: 'final', logo_url: '' })
          }
        } catch {
          setCabecalho({ instituicao_ensino: '', curso: '', exercicio: new Date().getFullYear().toString(), status: 'final', logo_url: '' })
        }
        setAtividades([novaAtividade()])
        setHistorico([])
      } else {
        // Outro erro - limpa para novo
        setCabecalho({ instituicao_ensino: '', curso: '', exercicio: new Date().getFullYear().toString(), status: 'final', logo_url: '' })
        setAtividades([novaAtividade()])
        setHistorico([])
      }
    } catch (e) {
      console.error('Erro ao carregar Anexo II:', e)
      setMsg({ type: 'error', text: 'Erro ao carregar Anexo II.' })
      // Tentar pelo menos carregar os dados do estágio
      try {
        const estagioRes = await fetch(`${API_URL}/estagios/${id}`, { headers: getAuthHeaders() })
        if (estagioRes.ok) {
          const estagio = await estagioRes.json()
          setCabecalho({
            instituicao_ensino: estagio.instituicao?.nome || '',
            curso: estagio.curso?.nome || '',
            exercicio: new Date().getFullYear().toString(),
            status: 'final',
            logo_url: ''
          })
        }
      } catch {}
    }
  }

  const addAtividade = () => setAtividades([...atividades, novaAtividade()])
  const duplicarAtividade = (idx) => {
    const copia = { ...atividades[idx] }
    setAtividades([...atividades.slice(0, idx+1), copia, ...atividades.slice(idx+1)])
  }
  const removeAtividade = (idx) => setAtividades(atividades.filter((_, i) => i !== idx))
  const updateAtividade = (idx, campo, valor) => {
    const novo = [...atividades]
    if (campo === 'horario') {
      novo[idx][campo] = maskHorario(valor)
    } else {
      novo[idx][campo] = valor
    }
    setAtividades(novo)
  }

  const salvar = async () => {
    if (!estagioId) { setMsg({ type: 'error', text: 'Selecione um estágio.' }); return }
    // Validações mínimas
    if (!cabecalho.curso?.trim()) { setMsg({ type: 'error', text: 'Informe o Curso no cabeçalho.' }); return }
    const hasDescricao = atividades.some(a => (a.descricao || '').trim().length > 0)
    if (!hasDescricao) { setMsg({ type: 'error', text: 'Adicione ao menos uma atividade com descrição.' }); return }

    // Validações por linha
    for (let i=0; i<atividades.length; i++) {
      const a = atividades[i]
      if (a.horario && !horarioValido(a.horario)) {
        setMsg({ type: 'error', text: `Horário inválido na linha ${i+1}. Use HH:MM às HH:MM e fim maior que início.` })
        return
      }
      if (!dataCoerente(a.data_inicio, a.data_fim)) {
        setMsg({ type: 'error', text: `Data fim menor que início na linha ${i+1}.` })
        return
      }
    }
    setSaving(true)
    setMsg({})
    const payload = {
      estagio_id: parseInt(estagioId),
      ...cabecalho,
      atividades: atividades.map(a => ({
        ...a,
        quantidade_grupos: a.quantidade_grupos ? parseInt(a.quantidade_grupos) : null,
        num_estagiarios_por_grupo: a.num_estagiarios_por_grupo ? parseInt(a.num_estagiarios_por_grupo) : null,
      }))
    }
    try {
      // Se status final e houver rótulo/comentário, enviar como query string
      let url = `${API_URL}/anexo2`
      if ((cabecalho.status || 'final') === 'final' && (versaoLabel.trim() || versaoComment.trim())) {
        const params = new URLSearchParams()
        if (versaoLabel.trim()) params.set('label', versaoLabel.trim())
        if (versaoComment.trim()) params.set('comment', versaoComment.trim())
        url += `?${params.toString()}`
      }
      const res = await fetch(url, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(payload) })
      if (res.ok) {
        setMsg({ type: 'success', text: 'Anexo II salvo com sucesso.' })
        // Recarrega dados e histórico para refletir versão criada
        await carregarExistente(estagioId)
        // Limpa rótulo/comentário após salvar
        setVersaoLabel('')
        setVersaoComment('')
      } else {
        const j = await res.json().catch(() => ({}))
        setMsg({ type: 'error', text: j.detail || 'Erro ao salvar.' })
      }
    } catch (e) {
      setMsg({ type: 'error', text: 'Erro de conexão.' })
    } finally {
      setSaving(false)
    }
  }

  const restaurarVersao = async (v) => {
    if (!estagioId) return
    try {
      const res = await fetch(`${API_URL}/anexo2/${estagioId}/versions/${v.versao}/restore`, { method:'POST', headers: getAuthHeaders() })
      if (res.ok) {
        setMsg({ type: 'success', text: `Versão ${v.versao} restaurada.` })
        carregarExistente(estagioId)
      } else {
        setMsg({ type: 'error', text: 'Falha ao restaurar versão.' })
      }
    } catch {
      setMsg({ type: 'error', text: 'Erro de conexão ao restaurar versão.' })
    }
  }

  // Aceitar dd/mm/aaaa: converter para yyyy-mm-dd no onChange
  const normalizarDataBR = (s) => {
    if (!s) return ''
    const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
    if (!m) return s
    const [_, d, mth, y] = m
    return `${y}-${mth}-${d}`
  }

  // CSV helpers
  const headers = [
    'disciplina','descricao','nivel','unidade_setor','data_inicio','data_fim','horario','dias_semana','quantidade_grupos','num_estagiarios_por_grupo','carga_horaria_individual','supervisor_nome','supervisor_conselho','valor'
  ]

  const exportModelo = () => {
    const csv = headers.join(';') + '\n'
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'anexo2_atividades_modelo.csv'
    a.click(); URL.revokeObjectURL(url)
  }

  const exportAtividades = () => {
    const linhas = atividades.map(a => headers.map(h => (a[h] ?? '').toString().replace(/;/g, ',')).join(';'))
    const csv = [headers.join(';'), ...linhas].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'anexo2_atividades.csv'
    a.click(); URL.revokeObjectURL(url)
  }

  const importarCSV = () => fileInputRef.current?.click()
  const onCSVFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const text = reader.result?.toString() || ''
        const delim = text.slice(0, 2000).split('\n')[0].includes(';') ? ';' : ','
        const linhas = text.split(/\r?\n/).filter(l=>l.trim().length>0)
        const hdr = linhas[0].split(delim).map(h=>h.trim())
        const body = linhas.slice(1).map(l => {
          const cols = l.split(delim)
          const obj = {}
          hdr.forEach((h,i)=> obj[h] = (cols[i]||'').trim())
          return obj
        })
        // Map para nosso shape
        const novas = body.map(row => {
          const o = {}
          headers.forEach(h=> o[h] = row[h] || '')
          if (o.horario) o.horario = normalizarHora(o.horario)
          // se vier "(seg a sex)" dentro do horário, extrair
          if (row.horario) {
            const m = row.horario.match(/\(([^)]+)\)/)
            if (m && m[1]) {
              const dias = parseDiasTexto(m[1])
              if (dias) o.dias_semana = dias
            }
          }
          return o
        })
        setAtividades(novas.length ? novas : [novaAtividade()])
        setMsg({ type: 'success', text: `Importadas ${novas.length} atividade(s) do CSV.` })
      } catch {
        setMsg({ type: 'error', text: 'Falha ao importar CSV.' })
      } finally {
        e.target.value = ''
      }
    }
    reader.readAsText(file, 'utf-8')
  }

  const gerar = async (fmt) => {
    if (!estagioId) return
    try {
  const url = `${API_URL}/relatorios/anexo2/${estagioId}?format=${fmt}`
      if (fmt === 'pdf') {
        const res = await fetch(url, { headers: getAuthHeaders() })
        if (!res.ok) return
        const blob = await res.blob()
        const dl = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = dl
  a.download = `plano-atividades-estagio-${estagioId}.pdf`
        a.click()
        window.URL.revokeObjectURL(dl)
      } else {
        const res = await fetch(url, { headers: getAuthHeaders() })
        const html = await res.text()
        const w = window.open()
        w.document.write(html)
        w.document.close()
      }
    } catch {}
  }

  // ==== Importer Interativo (Excel/CSV) ====
  const atividadeFields = [
    { key: 'disciplina', label: 'Disciplina' },
    { key: 'descricao', label: 'Descrição' },
    { key: 'nivel', label: 'Nível' },
    { key: 'unidade_setor', label: 'Unidade/Setor' },
    { key: 'data_inicio', label: 'Data Início' },
    { key: 'data_fim', label: 'Data Fim' },
    { key: 'horario', label: 'Horário' },
    { key: 'dias_semana', label: 'Dias Semana' },
    { key: 'quantidade_grupos', label: 'Qtd Grupos' },
    { key: 'num_estagiarios_por_grupo', label: 'Estagiários/Grupo' },
    { key: 'carga_horaria_individual', label: 'CH Individual' },
    { key: 'supervisor_nome', label: 'Supervisor Nome' },
    { key: 'supervisor_conselho', label: 'Supervisor Conselho' },
    { key: 'valor', label: 'Valor' }
  ]

  const importarExcelDialogRef = useRef(null)
  const filePreviewInputRef = useRef(null)

  const abrirImportador = () => {
    filePreviewInputRef.current?.click()
  }

  const onPreviewFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportLoading(true)
    setImportPreview(null)
    setImportMap({})
    setMsg({})
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('detectar_anexo2', 'true')
      const res = await fetch(`${API_URL}/importar/preview`, { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }, body: form })
      if (!res.ok) {
        const j = await res.json().catch(()=>({detail:'Falha no preview'}))
        setMsg({ type: 'error', text: j.detail || 'Falha ao pré-visualizar planilha.' })
        return
      }
      const data = await res.json()
      setImportPreview(data)
      // Inicializa mapeamento com sugestões
      const initMap = {}
      if (data.suggestions) {
        Object.entries(data.suggestions).forEach(([k, headerName]) => { initMap[k] = headerName })
      }
      setImportMap(initMap)
      setMsg({ type: 'success', text: `Preview carregado (${data.headers?.length || 0} colunas, ${data.total_rows} linhas). Ajuste o mapeamento e gere atividades.` })
    } catch (err) {
      setMsg({ type: 'error', text: 'Erro ao enviar arquivo para preview.' })
    } finally {
      setImportLoading(false)
      e.target.value = ''
    }
  }

  const atualizarMap = (key, value) => {
    setImportMap(m => ({ ...m, [key]: value }))
  }

  const parseDataPossivel = (s) => {
    if (!s) return ''
    // yyyy-mm-dd (talvez com hora)
    const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/) ; if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
    const br = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/); if (br) return `${br[3]}-${br[2]}-${br[1]}`
    // dd/mm/yy -> assumir 20yy
    const br2 = s.match(/^(\d{2})\/(\d{2})\/(\d{2})$/); if (br2) return `20${br2[3]}-${br2[2]}-${br2[1]}`
    return s // deixar como está se não reconhecido
  }

  const gerarAtividadesDoPreview = () => {
    if (!importPreview) return
    setGerandoImport(true)
    try {
      const linhas = importPreview.rows || []
      const novas = []
      for (const r of linhas) {
        const obj = novaAtividade()
        atividadeFields.forEach(f => {
          const col = importMap[f.key]
          if (col && r.hasOwnProperty(col)) {
            obj[f.key] = (r[col] ?? '').toString().trim()
          }
        })
        // Normalizações específicas
        if (obj.horario) obj.horario = normalizarHora(obj.horario)
        if (obj.dias_semana) obj.dias_semana = parseDiasTexto(obj.dias_semana)
        if (obj.data_inicio) obj.data_inicio = parseDataPossivel(obj.data_inicio)
        if (obj.data_fim) obj.data_fim = parseDataPossivel(obj.data_fim)
        // Conversões numéricas simples
        if (obj.quantidade_grupos) obj.quantidade_grupos = obj.quantidade_grupos.replace(/\D+/g,'')
        if (obj.num_estagiarios_por_grupo) obj.num_estagiarios_por_grupo = obj.num_estagiarios_por_grupo.replace(/\D+/g,'')
        if (Object.values(obj).some(v => (v||'').toString().trim().length>0)) {
          novas.push(obj)
        }
      }
      if (!novas.length) {
        setMsg({ type: 'error', text: 'Nenhuma linha válida encontrada após mapeamento.' })
        return
      }
      setAtividades(novas)
      setMsg({ type: 'success', text: `Geradas ${novas.length} atividade(s) a partir do preview.` })
      // Marca que atividades foram geradas a partir do import para habilitar botão de anexar direto
      setImportGerouAtividades(true)
    } finally {
      setGerandoImport(false)
    }
  }

  const limparPreview = () => {
    setImportPreview(null)
    setImportMap({})
    setImportGerouAtividades(false)
  }

  // Flag para saber se veio de importação e mostrar botão de anexar rápido
  const [importGerouAtividades, setImportGerouAtividades] = useState(false)

  const anexarDireto = async () => {
    if (!estagioId) {
      setMsg({ type: 'error', text: 'Selecione um estágio antes de anexar.' })
      return
    }
    await salvar()
    // Após anexar, removemos a flag para não confundir usuário
    setImportGerouAtividades(false)
  }

  if (loading) return <div className="loading">Carregando...</div>

  return (
    <Layout user={user}>
      <datalist id="disciplinas-sugeridas">
        {DISCIPLINAS_EXPANDIDAS.map((d) => (
          <option key={d} value={d} />
        ))}
      </datalist>
      <div className="page-header">
        <h1>Plano de Atividades do Estágio (Anexo II)</h1>
      </div>
      <datalist id="descricoes-sugeridas">
        {DESCRICOES_SUGERIDAS.map((d) => (
          <option key={d} value={d} />
        ))}
      </datalist>

      {msg.text && (
        <div className={`alert ${msg.type === 'error' ? 'alert-danger' : 'alert-success'}`}>{msg.text}</div>
      )}

      <div className="form-container">
        <div className="form-section">
          <div className="form-row">
            <div className="form-group">
              <label>Estágio</label>
              <select value={estagioId} onChange={(e) => carregarExistente(e.target.value)}>
                <option value="">Selecione...</option>
                {estagios.map(e => <option key={e.id} value={e.id}>{e.nome} - {e.curso?.nome || 'N/A'}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Instituição de ensino</label>
              <input value={cabecalho.instituicao_ensino} onChange={(e) => setCabecalho({...cabecalho, instituicao_ensino: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Curso</label>
              <input value={cabecalho.curso} onChange={(e) => setCabecalho({...cabecalho, curso: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Exercício</label>
              <input value={cabecalho.exercicio} onChange={(e) => setCabecalho({...cabecalho, exercicio: e.target.value})} placeholder="2025" />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={cabecalho.status} onChange={(e)=> setCabecalho({...cabecalho, status: e.target.value})}>
                <option value="rascunho">Rascunho</option>
                <option value="final">Final</option>
              </select>
            </div>
            <div className="form-group">
              <label>Logo (URL)</label>
              <input value={cabecalho.logo_url} onChange={(e)=> setCabecalho({...cabecalho, logo_url: e.target.value})} placeholder="https://.../logo.png" />
            </div>
          </div>
        </div>

        {historico.length > 0 && (
          <div className="form-section">
            <h3>Histórico</h3>
            <div className="table-container">
              <table>
                <thead><tr><th>Versão</th><th>Rótulo</th><th>Comentário</th><th>Data</th><th>Ações</th></tr></thead>
                <tbody>
                  {historico.map((v, i) => (
                    <tr key={i}>
                      <td>{v.versao}</td>
                      <td>{v.label || '-'}</td>
                      <td>{v.comment || '-'}</td>
                      <td>{v.data}</td>
                      <td><button className="btn-small btn-info" onClick={()=>restaurarVersao(v)}>Restaurar</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="form-section">
          <h3>Importar Planilha (Excel/CSV)</h3>
          <p style={{ marginTop: 0 }}>Carregue uma planilha com as atividades. O sistema tenta detectar o cabeçalho e sugere colunas. Ajuste o mapeamento e gere as atividades.</p>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12 }}>
            <button type="button" className="btn-secondary" onClick={abrirImportador} disabled={importLoading}>{importLoading ? 'Enviando...' : 'Selecionar arquivo'}</button>
            {importPreview && <>
              <button type="button" className="btn-secondary" onClick={gerarAtividadesDoPreview} disabled={gerandoImport}>{gerandoImport? 'Gerando...' : 'Gerar atividades'}</button>
              <button type="button" className="btn-danger" onClick={limparPreview}>Limpar preview</button>
            </>}
            {importPreview?.detected && <span className="badge" style={{ background:'#2d7', alignSelf:'center' }}>Cabeçalho detectado (linha {importPreview.header_row})</span>}
          </div>
          <input ref={filePreviewInputRef} type="file" accept=".csv,.xlsx,.xls" style={{ display:'none' }} onChange={onPreviewFile} />
          {importPreview && (
            <div className="card" style={{ overflowX:'auto' }}>
              <h4 style={{ marginTop:0 }}>Mapeamento de Colunas</h4>
              <div className="table-container" style={{ maxHeight:260 }}>
                <table>
                  <thead>
                    <tr><th>Campo Interno</th><th>Coluna da Planilha</th><th>Exemplo (1ª linha)</th></tr>
                  </thead>
                  <tbody>
                    {atividadeFields.map(f => {
                      const col = importMap[f.key] || ''
                      const exemplo = (col && importPreview.rows && importPreview.rows[0]) ? (importPreview.rows[0][col] || '') : ''
                      return (
                        <tr key={f.key}>
                          <td style={{ whiteSpace:'nowrap' }}>{f.label}</td>
                          <td>
                            <select value={col} onChange={e=>atualizarMap(f.key, e.target.value)}>
                              <option value="">-- não mapear --</option>
                              {importPreview.headers.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                          </td>
                          <td>{exemplo}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <details style={{ marginTop:12 }}>
                <summary style={{ cursor:'pointer' }}>Preview de linhas (máx 50)</summary>
                <div className="table-container" style={{ maxHeight:300 }}>
                  <table>
                    <thead>
                      <tr>
                        {importPreview.headers.map(h => <th key={h}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {importPreview.rows.map((r,i)=>(
                        <tr key={i}>
                          {importPreview.headers.map(h => <td key={h}>{r[h]}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
              {importGerouAtividades && (
                <div style={{ marginTop:16, display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>
                  <span style={{ fontSize:12, opacity:0.8 }}>Atividades geradas. Clique em "Anexar" para salvar no plano do estágio selecionado.</span>
                  <button type="button" className="btn-primary" onClick={anexarDireto} disabled={saving}> {saving? 'Anexando...' : 'Anexar atividades ao plano'} </button>
                  {!estagioId && <span style={{ color:'#c33', fontSize:12 }}>Selecione um estágio acima.</span>}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="form-section">
          <h3>Atividades</h3>
          <div className="form-actions" style={{ gap: 8, marginBottom: 8 }}>
            <button type="button" className="btn-secondary" onClick={exportModelo}>Baixar CSV modelo</button>
            <button type="button" className="btn-secondary" onClick={exportAtividades} disabled={!atividades.length}>Exportar CSV</button>
            <button type="button" className="btn-secondary" onClick={importarCSV}>Importar CSV</button>
            <input ref={fileInputRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={onCSVFile} />
          </div>
          {atividades.map((a, idx) => (
            <div className="card" key={idx}>
              <div className="form-row">
                <div className="form-group"><label>Disciplina</label><input value={a.disciplina} list="disciplinas-sugeridas" onChange={e=>updateAtividade(idx,'disciplina',e.target.value)} /></div>
                <div className="form-group"><label>Nível</label><input value={a.nivel} onChange={e=>updateAtividade(idx,'nivel',e.target.value)} /></div>
                <div className="form-group"><label>Unidade/Setor</label><input value={a.unidade_setor} onChange={e=>updateAtividade(idx,'unidade_setor',e.target.value)} /></div>
              </div>
              <div className="form-row">
                <div className="form-group wide"><label>Descrição (mínimo 5)</label><input value={a.descricao} list="descricoes-sugeridas" onChange={e=>updateAtividade(idx,'descricao',e.target.value)} placeholder="Sinais vitais, curativos, injeções, ..." /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Início</label><input type="date" value={a.data_inicio} onChange={e=>updateAtividade(idx,'data_inicio',normalizarDataBR(e.target.value))} placeholder="dd/mm/aaaa" /></div>
                <div className="form-group"><label>Fim</label><input type="date" value={a.data_fim} onChange={e=>updateAtividade(idx,'data_fim',normalizarDataBR(e.target.value))} placeholder="dd/mm/aaaa" /></div>
                <div className="form-group"><label>Horário</label><input 
                  className={(a.horario && !horarioValido(a.horario)) ? 'input-error' : ''}
                  aria-invalid={(a.horario && !horarioValido(a.horario)) ? 'true' : 'false'}
                  value={a.horario}
                  onChange={e=>updateAtividade(idx,'horario',e.target.value)} 
                  onBlur={e=>{
                    const v = normalizarHora(e.target.value)
                    updateAtividade(idx,'horario', v)
                    // extrair dias entre parênteses se existirem
                    const paren = (e.target.value || '').match(/\(([^)]+)\)/)
                    if (paren && paren[1]) {
                      const dias = parseDiasTexto(paren[1])
                      if (dias) updateAtividade(idx,'dias_semana', dias)
                    }
                  }} 
                  placeholder="08:00 às 15:00" inputMode="numeric" maxLength={14} />
                  {(a.horario && !horarioValido(a.horario)) && (
                    <div className="field-error">Horário inválido. O fim deve ser maior que o início.</div>
                  )}
                </div>
                <div className="form-group">
                  <label>Dias da semana</label>
                  <div className="chips">
                    {['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].map(d => {
                      const marcado = (a.dias_semana||'').split(',').map(s=>s.trim()).includes(d)
                      return (
                        <button type="button" aria-pressed={marcado} key={d} className={`chip ${marcado?'active':''}`} onClick={()=>{
                          const atual = (a.dias_semana||'').split(',').map(s=>s.trim()).filter(Boolean)
                          const novo = marcado ? atual.filter(x=>x!==d) : [...new Set([...atual, d])]
                          updateAtividade(idx,'dias_semana', novo.join(', '))
                        }}>{d}</button>
                      )
                    })}
                  </div>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Qtd grupos</label><input type="number" value={a.quantidade_grupos} onChange={e=>updateAtividade(idx,'quantidade_grupos',e.target.value)} /></div>
                <div className="form-group"><label># Estagiários por grupo</label><input type="number" value={a.num_estagiarios_por_grupo} onChange={e=>updateAtividade(idx,'num_estagiarios_por_grupo',e.target.value)} /></div>
                <div className="form-group"><label>C.H. Individual</label><input value={a.carga_horaria_individual} onChange={e=>updateAtividade(idx,'carga_horaria_individual',e.target.value)} placeholder="80" /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Supervisor</label>
                  <input list={`supervisores-list-${idx}`} value={a.supervisor_nome} onChange={e=>{
                    const val = e.target.value
                    updateAtividade(idx,'supervisor_nome',val)
                    const s = supervisores.find(x=> `${x.nome}`.toLowerCase() === val.toLowerCase())
                    if (s && s.numero_conselho) updateAtividade(idx,'supervisor_conselho',s.numero_conselho)
                  }} />
                  <datalist id={`supervisores-list-${idx}`}>
                    {supervisores.map(s => <option key={s.id} value={s.nome} />)}
                  </datalist>
                </div>
                <div className="form-group"><label>Nº Conselho</label><input value={a.supervisor_conselho} onChange={e=>updateAtividade(idx,'supervisor_conselho',e.target.value)} /></div>
                <div className="form-group"><label>Valor</label><input value={a.valor} onChange={e=>updateAtividade(idx,'valor',e.target.value)} placeholder="R$ 400,00" /></div>
              </div>
              <div className="form-actions" style={{ gap: 8 }}>
                <button type="button" className="btn-secondary" onClick={() => duplicarAtividade(idx)}>Duplicar</button>
                <button type="button" className="btn-danger" onClick={() => removeAtividade(idx)} disabled={atividades.length===1}>Remover</button>
              </div>
            </div>
          ))}
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={addAtividade}>+ Adicionar atividade</button>
          </div>
        </div>

        <div className="form-actions" style={{ alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
          {cabecalho.status === 'final' && (
            <>
              <div className="form-group" style={{ minWidth: 240 }}>
                <label>Rótulo da versão (opcional)</label>
                <input value={versaoLabel} onChange={e=>setVersaoLabel(e.target.value)} placeholder="Ex.: Envio para assinatura" />
              </div>
              <div className="form-group" style={{ minWidth: 320 }}>
                <label>Comentário (opcional)</label>
                <input value={versaoComment} onChange={e=>setVersaoComment(e.target.value)} placeholder="Ex.: Revisado pela coordenação" />
              </div>
            </>
          )}
          <button type="button" className="btn-primary" onClick={salvar} disabled={saving}>{saving? 'Salvando...' : 'Salvar Plano de Atividades'}</button>
          <button type="button" className="btn-info" onClick={() => gerar('html')} disabled={!estagioId}>Ver HTML</button>
          <button type="button" className="btn-secondary" onClick={() => gerar('pdf')} disabled={!estagioId}>Baixar PDF</button>
        </div>
      </div>
    </Layout>
  )
}
