// Relatórios interativos com interface simplificada (clique para adicionar), integrados à API de Vagas
import React, { useEffect, useMemo, useState } from 'react'
import Layout from '../components/Layout'
import '../styles/RelatoriosInterativos.css'

const API_URL = (import.meta.env && import.meta.env.VITE_API_URL) || ''

// Helper para acessar nested props com path 'curso.nome'
function getByPath(obj, path) {
  try {
    return path.split('.').reduce((acc, p) => (acc && acc[p] !== undefined ? acc[p] : undefined), obj)
  } catch (e) {
    return undefined
  }
}

// Geração de CSV
function exportToCsv(filename, rows) {
  if (!rows || rows.length === 0) return
  const processRow = (row) => row.map((val) => `"${String(val ?? '').replace(/"/g, '""')}"`).join(',')
  const csv = rows.map(processRow).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function RelatoriosInterativos() {
  const [user, setUser] = useState(null)
  const [rawData, setRawData] = useState([]) // itens vindos de /vagas
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filtros para consulta à API de /vagas
  const [filters, setFilters] = useState({ q: '', unidade: '', supervisor: '', dia: '', exercicio: '' })
  const [resumo, setResumo] = useState(null)
  const [showFieldPicker, setShowFieldPicker] = useState(null) // 'rows' | 'cols' | 'values' | null

  // Campos disponíveis: label e path no objeto de /vagas (itens planos)
  const availableFieldsAll = useMemo(() => ([
    { key: 'instituicao_ensino', label: '🏢 Instituição', path: 'instituicao_ensino', type: 'string', icon: '🏢' },
    { key: 'curso', label: '🎓 Curso', path: 'curso', type: 'string', icon: '🎓' },
    { key: 'unidade_setor', label: '🏥 Unidade/Setor', path: 'unidade_setor', type: 'string', icon: '🏥' },
    { key: 'supervisor_nome', label: '👨‍⚕️ Supervisor', path: 'supervisor_nome', type: 'string', icon: '👨‍⚕️' },
    { key: 'disciplina', label: '📚 Disciplina', path: 'disciplina', type: 'string', icon: '📚' },
    { key: 'nivel', label: '📊 Nível', path: 'nivel', type: 'string', icon: '📊' },
    { key: 'dias_semana', label: '📅 Dias da semana', path: 'dias_semana', type: 'string', icon: '📅' },
    { key: 'horario', label: '🕐 Horário', path: 'horario', type: 'string', icon: '🕐' },
    { key: 'quantidade_grupos', label: '👥 Qtd Grupos', path: 'quantidade_grupos', type: 'number', icon: '👥' },
    { key: 'num_estagiarios_por_grupo', label: '🧑‍🎓 Est./Grupo', path: 'num_estagiarios_por_grupo', type: 'number', icon: '🧑‍🎓' },
    { key: 'vagas', label: '🎯 Vagas (calc.)', path: 'vagas', type: 'number', icon: '🎯' },
    { key: 'carga_horaria_individual', label: '⏱️ CH individual', path: 'carga_horaria_individual', type: 'number', icon: '⏱️' },
    { key: 'valor_total', label: '💰 Valor total', path: 'valor_total', type: 'number', icon: '💰' },
  ]), [])

  // Estado do builder
  const [rowsZone, setRowsZone] = useState([])
  const [colsZone, setColsZone] = useState([])
  const [valuesZone, setValuesZone] = useState([]) // {field, agg}
  const [filtersZone, setFiltersZone] = useState([]) // {field, selectedValues: []}

  // Interface simplificada: não usamos mais lista "disponíveis" separada

  useEffect(() => {
    fetchUserInfo()
    fetchVagas()
    fetchResumo()
  }, [])

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  })

  const fetchUserInfo = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, { headers: getAuthHeaders() })
      if (response.ok) {
        const data = await response.json()
        setUser(data)
      }
    } catch (e) {}
  }

  const fetchVagas = async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v) })
      // carregar um volume razoável para pivot
      params.set('limit', '500')
      params.set('offset', '0')
      const response = await fetch(`${API_URL}/vagas?${params.toString()}`, { headers: getAuthHeaders() })
      if (!response.ok) throw new Error('Falha ao carregar vagas')
      const data = await response.json()
      setRawData(Array.isArray(data?.items) ? data.items : [])
    } catch (e) {
      setError('Erro ao carregar dados. Verifique a conexão e o login.')
    } finally {
      setLoading(false)
    }
  }

  const fetchResumo = async () => {
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v) })
      params.set('group_by', 'unidade')
      params.set('top', '10')
      const res = await fetch(`${API_URL}/vagas/resumo?${params.toString()}`, { headers: getAuthHeaders() })
      if (res.ok) setResumo(await res.json())
    } catch {}
  }

  // Interface simplificada: clique para adicionar campo
  const addFieldTo = (field, target) => {
    const isAlreadyInTarget = 
      (target === 'rows' && rowsZone.some(z => z.key === field.key)) ||
      (target === 'cols' && colsZone.some(z => z.key === field.key)) ||
      (target === 'values' && valuesZone.some(z => z.key === field.key)) ||
      (target === 'filters' && filtersZone.some(z => z.key === field.key))
    
    if (isAlreadyInTarget) return // evita duplicatas

    if (target === 'rows') {
      setRowsZone([...rowsZone, field])
    } else if (target === 'cols') {
      setColsZone([...colsZone, field])
    } else if (target === 'values') {
      // Escolhe agregação padrão: number → sum, string → count
      const agg = field.type === 'number' ? 'sum' : 'count'
      setValuesZone([...valuesZone, { ...field, agg }])
    } else if (target === 'filters') {
      setFiltersZone([...filtersZone, { ...field, selectedValues: null }])
    }
    setShowFieldPicker(null)
  }

  const removeField = (target, key) => {
    if (target === 'rows') setRowsZone(rowsZone.filter(z => z.key !== key))
    else if (target === 'cols') setColsZone(colsZone.filter(z => z.key !== key))
    else if (target === 'values') setValuesZone(valuesZone.filter(z => z.key !== key))
    else if (target === 'filters') setFiltersZone(filtersZone.filter(z => z.key !== key))
  }

  const clearZone = (target) => {
    if (target === 'rows') setRowsZone([])
    else if (target === 'cols') setColsZone([])
    else if (target === 'values') setValuesZone([])
    else if (target === 'filters') setFiltersZone([])
  }

  // Opções de agregação numérica e contagem
  const aggOptions = [
    { value: 'count', label: 'Contagem' },
    { value: 'sum', label: 'Soma' },
    { value: 'avg', label: 'Média' },
  ]

  const setValueAgg = (key, agg) => {
    setValuesZone(valuesZone.map((v) => (v.key === key ? { ...v, agg } : v)))
  }

  // Calcular valores únicos para filtros
  const uniqValues = (path) => {
    const vals = new Set()
    rawData.forEach((row) => {
      const v = getByPath(row, path)
      if (v !== undefined && v !== null && v !== '') vals.add(String(v))
    })
    return Array.from(vals).sort((a, b) => a.localeCompare(b))
  }

  const toggleFilterValue = (key, value) => {
    setFiltersZone(filtersZone.map((f) => {
      if (f.key !== key) return f
      const current = f.selectedValues
      if (!current || current.length === 0) return { ...f, selectedValues: [value] }
      if (current.includes(value)) return { ...f, selectedValues: current.filter((v) => v !== value) }
      return { ...f, selectedValues: [...current, value] }
    }))
  }

  const clearFilter = (key) => {
    setFiltersZone(filtersZone.map((f) => (f.key === key ? { ...f, selectedValues: null } : f)))
  }

  // Aplicar filtros na base
  const filteredData = useMemo(() => {
    if (!filtersZone.length) return rawData
    return rawData.filter((row) => (
      filtersZone.every((f) => {
        const val = getByPath(row, f.path)
        if (!f.selectedValues || f.selectedValues.length === 0) return true
        return f.selectedValues.includes(String(val))
      })
    ))
  }, [rawData, filtersZone])

  // Gerar pivot
  const pivotResult = useMemo(() => {
    if (!rowsZone.length && !colsZone.length && !valuesZone.length) return null

    const rowFields = rowsZone.map((r) => r.path)
    const colFields = colsZone.map((c) => c.path)

    // Índices
    const rowKeyFn = (row) => rowFields.map((p) => String(getByPath(row, p) ?? '')).join(' | ')
    const colKeyFn = (row) => colFields.map((p) => String(getByPath(row, p) ?? '')).join(' | ')

    // Mapa {rowKey: {colKey: {aggKey: value}}}
    const grid = new Map()

    const ensureCell = (r, c) => {
      if (!grid.has(r)) grid.set(r, new Map())
      const rowMap = grid.get(r)
      if (!rowMap.has(c)) rowMap.set(c, {})
      return rowMap.get(c)
    }

    // Agregar
    filteredData.forEach((row) => {
      const rKey = rowKeyFn(row)
      const cKey = colKeyFn(row)
      const cell = ensureCell(rKey, cKey)

      valuesZone.forEach((v) => {
        const aggKey = `${v.agg}:${v.path}`
        const valRaw = getByPath(row, v.path)
        const val = typeof valRaw === 'number' ? valRaw : Number(valRaw)

        if (!cell[aggKey]) cell[aggKey] = { count: 0, sum: 0 }
        cell[aggKey].count += 1
        if (!isNaN(val)) cell[aggKey].sum += val
      })
    })

    // Preparar listas de rótulos
    const rowKeys = Array.from(grid.keys())
    const colKeysSet = new Set()
    grid.forEach((cols) => cols.forEach((_, ck) => colKeysSet.add(ck)))
    const colKeys = Array.from(colKeysSet.values())

    // Cabeçalho de valores (cada value cria uma coluna virtual)
    const valueHeaders = valuesZone.map((v) => ({
      title: `${v.agg.toUpperCase()} ${availableFieldsAll.find((f) => f.path === v.path)?.label || v.path}`,
      agg: v.agg,
      path: v.path,
      aggKey: `${v.agg}:${v.path}`,
    }))

    return { grid, rowKeys, colKeys, valueHeaders }
  }, [filteredData, rowsZone, colsZone, valuesZone, availableFieldsAll])

  const exportPivotCsv = () => {
    if (!pivotResult) return
    const { rowKeys, colKeys, valueHeaders, grid } = pivotResult

    const headers = ['Linhas']
    // Expand colunas: para cada colKey e para cada valueHeader
    colKeys.forEach((ck) => {
      valueHeaders.forEach((vh) => headers.push(`${ck} - ${vh.title}`))
    })

    const rows = [headers]
    rowKeys.forEach((rk) => {
      const row = [rk || '(vazio)']
      colKeys.forEach((ck) => {
        const cell = grid.get(rk)?.get(ck)
        valueHeaders.forEach((vh) => {
          if (!cell || !cell[vh.aggKey]) {
            row.push('')
          } else {
            const acc = cell[vh.aggKey]
            const value = vh.agg === 'count' ? acc.count : (vh.agg === 'sum' ? acc.sum : (acc.count ? (acc.sum / acc.count) : 0))
            row.push(String(value))
          }
        })
      })
      rows.push(row)
    })

    exportToCsv('relatorio_interativo.csv', rows)
  }

  const baixarCsvApi = async () => {
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v) })
      const res = await fetch(`${API_URL}/vagas/csv?${params.toString()}`, { headers: getAuthHeaders() })
      if (!res.ok) throw new Error('Falha ao gerar CSV')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'vagas.csv'
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      setError('Erro ao gerar CSV pela API')
    }
  }

  const aplicarTemplate = (tipo) => {
    // Zonas: rowsZone, colsZone, valuesZone
    if (tipo === 'vagas_por_unidade') {
      setRowsZone([{ key: 'unidade_setor', label: 'Unidade/Setor', path: 'unidade_setor', type: 'string' }])
      setColsZone([])
      setValuesZone([{ key: 'vagas', label: 'Vagas (calc.)', path: 'vagas', type: 'number', agg: 'sum' }])
      return
    }
    if (tipo === 'vagas_por_supervisor') {
      setRowsZone([{ key: 'supervisor_nome', label: 'Supervisor', path: 'supervisor_nome', type: 'string' }])
      setColsZone([])
      setValuesZone([{ key: 'vagas', label: 'Vagas (calc.)', path: 'vagas', type: 'number', agg: 'sum' }])
      return
    }
    if (tipo === 'valor_total_por_unidade') {
      setRowsZone([{ key: 'unidade_setor', label: 'Unidade/Setor', path: 'unidade_setor', type: 'string' }])
      setColsZone([])
      setValuesZone([{ key: 'valor_total', label: 'Valor total', path: 'valor_total', type: 'number', agg: 'sum' }])
      return
    }
    if (tipo === 'ch_media_por_curso') {
      setRowsZone([{ key: 'curso', label: 'Curso', path: 'curso', type: 'string' }])
      setColsZone([])
      setValuesZone([{ key: 'carga_horaria_individual', label: 'CH individual', path: 'carga_horaria_individual', type: 'number', agg: 'avg' }])
      return
    }
  }

  if (loading) return <div className="loading">Carregando dados...</div>

  return (
    <Layout user={user}>
      <div className="page-header">
        <h1>Relatórios Interativos</h1>
        <p>Baseado nos dados de Vagas (Anexo II). Arraste campos para Linhas, Colunas, Valores e Filtros.</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Barra de filtros integrada à API */}
      <div className="zone" style={{ marginBottom: 12 }}>
        <div className="zone-title">Filtros</div>
        <div className="zone-body" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:8 }}>
          <div>
            <label style={{ fontSize:12, color:'#666' }}>Busca</label>
            <input value={filters.q} onChange={e=> setFilters({ ...filters, q: e.target.value })} placeholder="Unidade, disciplina, dia..." />
          </div>
          <div>
            <label style={{ fontSize:12, color:'#666' }}>Unidade</label>
            <input value={filters.unidade} onChange={e=> setFilters({ ...filters, unidade: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize:12, color:'#666' }}>Supervisor</label>
            <input value={filters.supervisor} onChange={e=> setFilters({ ...filters, supervisor: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize:12, color:'#666' }}>Dia</label>
            <input value={filters.dia} onChange={e=> setFilters({ ...filters, dia: e.target.value })} placeholder="Seg, Ter, Qua..." />
          </div>
          <div>
            <label style={{ fontSize:12, color:'#666' }}>Exercício</label>
            <input value={filters.exercicio} onChange={e=> setFilters({ ...filters, exercicio: e.target.value })} placeholder="2025" />
          </div>
          <div style={{ display:'flex', alignItems:'flex-end', gap:8 }}>
            <button className="btn-primary" onClick={()=> { fetchVagas(); fetchResumo(); }}>Aplicar</button>
            <button className="btn-secondary" onClick={()=> { setFilters({ q:'', unidade:'', supervisor:'', dia:'', exercicio:'' }); }}>Limpar</button>
          </div>
        </div>
      </div>

      {/* Templates rápidos */}
      <div className="zone" style={{ marginBottom:12 }}>
        <div className="zone-title">Templates rápidos</div>
        <div className="zone-body" style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
          <button className="btn-secondary" onClick={()=> aplicarTemplate('vagas_por_unidade')}>Vagas por Unidade</button>
          <button className="btn-secondary" onClick={()=> aplicarTemplate('vagas_por_supervisor')}>Vagas por Supervisor</button>
          <button className="btn-secondary" onClick={()=> aplicarTemplate('valor_total_por_unidade')}>Valor Total por Unidade</button>
          <button className="btn-secondary" onClick={()=> aplicarTemplate('ch_media_por_curso')}>CH Média por Curso</button>
        </div>
      </div>

      {/* Resumo (top 10) via API */}
      {resumo && (
        <div className="zone" style={{ marginBottom:12 }}>
          <div className="zone-title">Resumo rápido (Top 10 Unidades por vagas)</div>
          <div className="zone-body" style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {(resumo.items || []).slice(0, 10).map((r, idx) => (
              <div key={idx} style={{ border:'1px solid #e5e7eb', borderRadius:6, padding:'6px 10px', background:'#fafafa' }}>
                <strong>{r.chave}</strong>: {r.vagas} vagas • {r.atividades} atividades
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nova interface simplificada: sem drag & drop */}
      <div className="builder-new">
        {/* Construtor de relatórios com botões grandes */}
        <div className="config-panels">
          {/* Painel: Linhas */}
          <div className="config-panel">
            <div className="panel-header">
              <h3>📊 Linhas</h3>
              <div style={{ marginLeft:'auto', display:'flex', gap:6 }}>
                <button className="btn-icon" onClick={() => setShowFieldPicker('rows')} title="Adicionar campo">➕</button>
                {rowsZone.length > 0 && <button className="btn-icon" onClick={() => clearZone('rows')} title="Limpar tudo">🗑️</button>}
              </div>
            </div>
            <div className="panel-body">
              {rowsZone.length === 0 ? (
                <div className="empty-hint">Clique em ➕ para adicionar campos às linhas do relatório</div>
              ) : (
                <div className="chip-list">
                  {rowsZone.map((f) => (
                    <div key={f.key} className="chip-item">
                      <span>{f.icon} {f.label}</span>
                      <button className="chip-remove" onClick={() => removeField('rows', f.key)}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Painel: Colunas */}
          <div className="config-panel">
            <div className="panel-header">
              <h3>📈 Colunas</h3>
              <div style={{ marginLeft:'auto', display:'flex', gap:6 }}>
                <button className="btn-icon" onClick={() => setShowFieldPicker('cols')} title="Adicionar campo">➕</button>
                {colsZone.length > 0 && <button className="btn-icon" onClick={() => clearZone('cols')} title="Limpar tudo">🗑️</button>}
              </div>
            </div>
            <div className="panel-body">
              {colsZone.length === 0 ? (
                <div className="empty-hint">Deixe vazio para tabela simples ou adicione campos para criar colunas dinâmicas</div>
              ) : (
                <div className="chip-list">
                  {colsZone.map((f) => (
                    <div key={f.key} className="chip-item">
                      <span>{f.icon} {f.label}</span>
                      <button className="chip-remove" onClick={() => removeField('cols', f.key)}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Painel: Valores (agregações) */}
          <div className="config-panel">
            <div className="panel-header">
              <h3>💯 Valores</h3>
              <div style={{ marginLeft:'auto', display:'flex', gap:6 }}>
                <button className="btn-icon" onClick={() => setShowFieldPicker('values')} title="Adicionar campo">➕</button>
                {valuesZone.length > 0 && <button className="btn-icon" onClick={() => clearZone('values')} title="Limpar tudo">🗑️</button>}
              </div>
            </div>
            <div className="panel-body">
              {valuesZone.length === 0 ? (
                <div className="empty-hint">Adicione campos numéricos para calcular (soma, média, contagem)</div>
              ) : (
                <div className="chip-list">
                  {valuesZone.map((f) => (
                    <div key={f.key} className="chip-item chip-value">
                      <span>{f.icon} {f.label}</span>
                      <select value={f.agg} onChange={(e) => setValueAgg(f.key, e.target.value)} style={{ marginLeft:8, padding:'2px 6px', border:'1px solid #ccc', borderRadius:4 }}>
                        {aggOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                      <button className="chip-remove" onClick={() => removeField('values', f.key)}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Painel: Filtros dinâmicos */}
          <div className="config-panel">
            <div className="panel-header">
              <h3>🔍 Filtros Dinâmicos</h3>
              <div style={{ marginLeft:'auto', display:'flex', gap:6 }}>
                <button className="btn-icon" onClick={() => setShowFieldPicker('filters')} title="Adicionar campo">➕</button>
                {filtersZone.length > 0 && <button className="btn-icon" onClick={() => clearZone('filters')} title="Limpar tudo">🗑️</button>}
              </div>
            </div>
            <div className="panel-body">
              {filtersZone.length === 0 ? (
                <div className="empty-hint">Adicione filtros para selecionar valores específicos no relatório</div>
              ) : (
                <div style={{ display:'grid', gap:12 }}>
                  {filtersZone.map((f) => (
                    <div key={f.key} className="filter-item">
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                        <strong>{f.icon} {f.label}</strong>
                        <button className="btn-small" onClick={() => clearFilter(f.key)}>Limpar</button>
                        <button className="chip-remove" onClick={() => removeField('filters', f.key)}>×</button>
                      </div>
                      <div className="filter-values">
                        {uniqValues(f.path).slice(0, 20).map((val) => {
                          const active = f.selectedValues && f.selectedValues.includes(val)
                          return (
                            <button key={val} className={`filter-pill ${active ? 'active' : ''}`} onClick={() => toggleFilterValue(f.key, val)}>
                              {val}
                            </button>
                          )
                        })}
                        {uniqValues(f.path).length > 20 && <div style={{ fontSize:11, color:'#888', marginTop:4 }}>Mostrando 20 de {uniqValues(f.path).length} valores</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal seletor de campos */}
        {showFieldPicker && (
          <div className="modal-overlay" onClick={() => setShowFieldPicker(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth:600 }}>
              <div className="modal-header">
                <h3>Selecione um campo para {showFieldPicker === 'rows' ? 'Linhas' : showFieldPicker === 'cols' ? 'Colunas' : showFieldPicker === 'values' ? 'Valores' : 'Filtros'}</h3>
                <button className="btn-close" onClick={() => setShowFieldPicker(null)}>×</button>
              </div>
              <div className="modal-body">
                <div className="field-picker-grid">
                  {availableFieldsAll.map((f) => (
                    <button
                      key={f.key}
                      className="field-picker-btn"
                      onClick={() => addFieldTo(f, showFieldPicker)}
                    >
                      <span style={{ fontSize:20 }}>{f.icon}</span>
                      <span>{f.label.replace(/^[^\s]+ /, '')}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Painel de resultados */}
        <div className="results-panel">
          <div className="results-header">
            <h3>📊 Resultado</h3>
            <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
              <button className="btn-secondary" onClick={baixarCsvApi}>📥 Baixar CSV (API)</button>
              <button className="btn-primary" onClick={exportPivotCsv} disabled={!pivotResult}>📊 Exportar CSV (pivot)</button>
            </div>
          </div>

          {!pivotResult ? (
            <div className="empty-state">
              <div style={{ fontSize:48, marginBottom:12 }}>📊</div>
              <div style={{ fontSize:18, fontWeight:600, marginBottom:8 }}>Monte seu relatório</div>
              <div style={{ color:'#666' }}>Use os templates rápidos acima ou clique em ➕ nos painéis de Linhas, Colunas e Valores para criar seu relatório personalizado.</div>
            </div>
          ) : (
            <div className="table-container">
              <div style={{ marginBottom:12, padding:8, background:'#f8fafc', borderRadius:6, fontSize:13, color:'#555' }}>
                <strong>{filteredData.length}</strong> registros • <strong>{pivotResult.rowKeys.length}</strong> linhas • <strong>{pivotResult.colKeys.length || 1}</strong> {pivotResult.colKeys.length > 1 ? 'colunas' : 'coluna'}
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Linhas</th>
                    {pivotResult.colKeys.map((ck) => (
                      <th key={ck} colSpan={pivotResult.valueHeaders.length}>{ck || '(todas)'}</th>
                    ))}
                  </tr>
                  <tr>
                    <th />
                    {pivotResult.colKeys.map((ck) => (
                      pivotResult.valueHeaders.map((vh) => (
                        <th key={`${ck}-${vh.aggKey}`}>{vh.title}</th>
                      ))
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pivotResult.rowKeys.map((rk) => (
                    <tr key={rk}>
                      <td className="row-key">{rk || '(vazio)'}</td>
                      {pivotResult.colKeys.map((ck) => {
                        const cell = pivotResult.grid.get(rk)?.get(ck)
                        return pivotResult.valueHeaders.map((vh) => {
                          let value = ''
                          if (cell && cell[vh.aggKey]) {
                            const acc = cell[vh.aggKey]
                            value = vh.agg === 'count' ? acc.count : (vh.agg === 'sum' ? acc.sum : (acc.count ? (acc.sum / acc.count).toFixed(2) : 0))
                          }
                          return <td key={`${rk}-${ck}-${vh.aggKey}`} className="num">{value}</td>
                        })
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default RelatoriosInterativos
