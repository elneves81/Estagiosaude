// Página de importação de planilhas
import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout'

const API_URL = (import.meta.env && import.meta.env.VITE_API_URL) || ''

function Importacao() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [previewData, setPreviewData] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [importProgress, setImportProgress] = useState(null)
  const [importMode, setImportMode] = useState('estagios') // 'estagios' ou 'atividades'
  
  // Dados para importação inteligente de atividades
  const [previewInteligente, setPreviewInteligente] = useState(null)
  const [estagios, setEstagios] = useState([])
  const [estagioSelecionado, setEstagioSelecionado] = useState('')
  const [criarNovoEstagio, setCriarNovoEstagio] = useState(false)
  const [atividadesSelecionadas, setAtividadesSelecionadas] = useState([])
  
  const [mapeamento, setMapeamento] = useState({
    nome: '',
    email: '', 
    telefone: '',
    instituicao: '',
    curso: '',
    unidade: '',
    supervisor: '',
    periodo: '',
    disciplina: '',
    nivel: '',
    horario: '',
    data_inicio: '',
    data_fim: '',
    observacoes: ''
  })

  useEffect(() => {
    fetchUserInfo()
    if (importMode === 'atividades') {
      fetchEstagios()
    }
  }, [importMode])

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

  const fetchEstagios = async () => {
    try {
      const response = await fetch(`${API_URL}/estagios`, {
        headers: getAuthHeaders()
      })
      if (response.ok) {
        const data = await response.json()
        setEstagios(data)
      }
    } catch (err) {
      console.error('Erro ao buscar estágios:', err)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
      setPreviewData(null)
      setPreviewInteligente(null)
      setError('')
      
      // Validar tipo de arquivo
      const allowedTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv'
      ]
      
      if (!allowedTypes.includes(file.type) && !file.name.match(/\.(csv|xlsx|xls)$/i)) {
        setError('Arquivo deve ser CSV, XLS ou XLSX')
        setSelectedFile(null)
        return
      }
      
      // Preview do arquivo baseado no modo
      if (importMode === 'atividades' && file.name.match(/\.(xlsx|xls)$/i)) {
        previewAtividadesInteligente(file)
      } else {
        previewFile(file)
      }
    }
  }

  const previewAtividadesInteligente = async (file) => {
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch(`${API_URL}/importar/preview-inteligente`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        setPreviewInteligente(data)
        setError('')
        
        // Inicializar seleção de todas as atividades
        const todasAtividades = []
        data.abas?.forEach(aba => {
          aba.atividades.forEach(atividade => {
            todasAtividades.push({
              ...atividade,
              aba_origem: aba.nome
            })
          })
        })
        setAtividadesSelecionadas(todasAtividades)
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'Erro ao processar arquivo para preview inteligente')
      }
    } catch (err) {
      setError('Erro ao processar arquivo')
    } finally {
      setLoading(false)
    }
  }

  const previewFile = async (file) => {
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch(`${API_URL}/importar/preview`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        setPreviewData(data)
        
        // Auto-mapear colunas comuns
        autoMapearColunas(data.headers)
      } else {
        setError('Erro ao processar arquivo para preview')
      }
    } catch (err) {
      setError('Erro ao processar arquivo')
    } finally {
      setLoading(false)
    }
  }

  const autoMapearColunas = (headers) => {
    const novoMapeamento = { ...mapeamento }
    
    headers.forEach(header => {
      const headerLower = header.toLowerCase()
      
      // Mapeamento automático baseado em palavras-chave
      if (headerLower.includes('nome') || headerLower.includes('estagiario')) {
        novoMapeamento.nome = header
      } else if (headerLower.includes('email') || headerLower.includes('e-mail')) {
        novoMapeamento.email = header
      } else if (headerLower.includes('telefone') || headerLower.includes('celular')) {
        novoMapeamento.telefone = header
      } else if (headerLower.includes('instituição') || headerLower.includes('instituicao') || headerLower.includes('hospital')) {
        novoMapeamento.instituicao = header
      } else if (headerLower.includes('curso')) {
        novoMapeamento.curso = header
      } else if (headerLower.includes('unidade') || headerLower.includes('setor')) {
        novoMapeamento.unidade = header
      } else if (headerLower.includes('supervisor') || headerLower.includes('orientador')) {
        novoMapeamento.supervisor = header
      } else if (headerLower.includes('periodo') || headerLower.includes('período')) {
        novoMapeamento.periodo = header
      } else if (headerLower.includes('disciplina')) {
        novoMapeamento.disciplina = header
      } else if (headerLower.includes('nivel') || headerLower.includes('nível')) {
        novoMapeamento.nivel = header
      } else if (headerLower.includes('horario') || headerLower.includes('horário')) {
        novoMapeamento.horario = header
      } else if (headerLower.includes('inicio') || headerLower.includes('início')) {
        novoMapeamento.data_inicio = header
      } else if (headerLower.includes('fim') || headerLower.includes('final')) {
        novoMapeamento.data_fim = header
      } else if (headerLower.includes('observa') || headerLower.includes('obs')) {
        novoMapeamento.observacoes = header
      }
    })
    
    setMapeamento(novoMapeamento)
  }

  const handleImportar = async () => {
    if (!selectedFile) {
      setError('Selecione um arquivo para importar')
      return
    }

    if (!mapeamento.nome || !mapeamento.email) {
      setError('Nome e E-mail são campos obrigatórios para o mapeamento')
      return
    }

    setLoading(true)
    setImportProgress({ current: 0, total: previewData?.rows?.length || 0 })

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('mapeamento', JSON.stringify(mapeamento))

      const response = await fetch(`${API_URL}/importar/planilha`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        setSuccess(`Importação concluída! ${result.imported} registros importados, ${result.skipped || 0} ignorados`)
        setSelectedFile(null)
        setPreviewData(null)
        setImportProgress(null)
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'Erro na importação')
      }
    } catch (err) {
      setError('Erro de conexão durante a importação')
    } finally {
      setLoading(false)
      setImportProgress(null)
    }
  }

  const handleImportarAtividades = async () => {
    if (!atividadesSelecionadas.length) {
      setError('Selecione pelo menos uma atividade para importar')
      return
    }

    if (!criarNovoEstagio && !estagioSelecionado) {
      setError('Selecione um estágio ou marque "Criar novo estágio"')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/importar/executar-inteligente`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          estagio_id: criarNovoEstagio ? null : parseInt(estagioSelecionado),
          criar_novo_estagio: criarNovoEstagio,
          atividades: atividadesSelecionadas
        })
      })

      if (response.ok) {
        const result = await response.json()
        setSuccess(`Importação concluída! ${result.atividades_importadas} atividades importadas. Total: ${result.total_horas}h`)
        setSelectedFile(null)
        setPreviewInteligente(null)
        setAtividadesSelecionadas([])
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'Erro na importação de atividades')
      }
    } catch (err) {
      setError('Erro de conexão durante a importação')
    } finally {
      setLoading(false)
    }
  }

  const toggleAtividade = (index) => {
    const todasAtividades = []
    previewInteligente.abas?.forEach(aba => {
      aba.atividades.forEach(atividade => {
        todasAtividades.push({
          ...atividade,
          aba_origem: aba.nome
        })
      })
    })

    const atividade = todasAtividades[index]
    const jaSelecionada = atividadesSelecionadas.some(a => 
      a.disciplina === atividade.disciplina && 
      a.supervisor === atividade.supervisor && 
      a.data_inicio === atividade.data_inicio
    )

    if (jaSelecionada) {
      setAtividadesSelecionadas(atividadesSelecionadas.filter(a => 
        !(a.disciplina === atividade.disciplina && 
          a.supervisor === atividade.supervisor && 
          a.data_inicio === atividade.data_inicio)
      ))
    } else {
      setAtividadesSelecionadas([...atividadesSelecionadas, atividade])
    }
  }

  const selecionarTodasAtividades = () => {
    const todasAtividades = []
    previewInteligente.abas?.forEach(aba => {
      aba.atividades.forEach(atividade => {
        todasAtividades.push({
          ...atividade,
          aba_origem: aba.nome
        })
      })
    })
    setAtividadesSelecionadas(todasAtividades)
  }

  const deselecionarTodasAtividades = () => {
    setAtividadesSelecionadas([])
  }

  return (
    <Layout user={user}>
      <div className="page-header">
        <h1>Importação de Planilhas</h1>
        <div className="help-info">
          <span>📋 Formatos suportados: CSV, XLS, XLSX</span>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Seletor de Modo de Importação */}
      <div className="mode-selector">
        <h3>Tipo de Importação</h3>
        <div className="mode-options">
          <label className={`mode-option ${importMode === 'estagios' ? 'active' : ''}`}>
            <input
              type="radio"
              value="estagios"
              checked={importMode === 'estagios'}
              onChange={(e) => {
                setImportMode(e.target.value)
                setSelectedFile(null)
                setPreviewData(null)
                setPreviewInteligente(null)
                setError('')
                setSuccess('')
              }}
            />
            <div className="mode-content">
              <span className="mode-icon">👥</span>
              <span className="mode-title">Importar Estágios</span>
              <span className="mode-desc">Planilhas com dados de estagiários (nome, email, etc.)</span>
            </div>
          </label>
          
          <label className={`mode-option ${importMode === 'atividades' ? 'active' : ''}`}>
            <input
              type="radio"
              value="atividades"
              checked={importMode === 'atividades'}
              onChange={(e) => {
                setImportMode(e.target.value)
                setSelectedFile(null)
                setPreviewData(null)
                setPreviewInteligente(null)
                setError('')
                setSuccess('')
              }}
            />
            <div className="mode-content">
              <span className="mode-icon">📋</span>
              <span className="mode-title">Importar Atividades (Anexo II)</span>
              <span className="mode-desc">Planilhas com atividades de estágio (detecção automática)</span>
            </div>
          </label>
        </div>
      </div>

      <div className="import-container">
        <div className="import-section">
          <h3>1. Selecionar Arquivo</h3>
          <div className="file-upload">
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              disabled={loading}
            />
            <div className="file-info">
              {selectedFile && (
                <p>
                  <strong>Arquivo:</strong> {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>
          </div>
        </div>

        {previewData && (
          <>
            <div className="import-section">
              <h3>2. Mapear Colunas</h3>
              <p>Relacione as colunas da planilha com os campos do sistema:</p>
              
              <div className="mapping-grid">
                <div className="mapping-row">
                  <label>Nome do Estagiário *</label>
                  <select 
                    value={mapeamento.nome}
                    onChange={(e) => setMapeamento({...mapeamento, nome: e.target.value})}
                  >
                    <option value="">Selecione uma coluna</option>
                    {previewData.headers.map(header => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </div>

                <div className="mapping-row">
                  <label>E-mail *</label>
                  <select 
                    value={mapeamento.email}
                    onChange={(e) => setMapeamento({...mapeamento, email: e.target.value})}
                  >
                    <option value="">Selecione uma coluna</option>
                    {previewData.headers.map(header => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </div>

                <div className="mapping-row">
                  <label>Telefone</label>
                  <select 
                    value={mapeamento.telefone}
                    onChange={(e) => setMapeamento({...mapeamento, telefone: e.target.value})}
                  >
                    <option value="">Selecione uma coluna</option>
                    {previewData.headers.map(header => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </div>

                <div className="mapping-row">
                  <label>Instituição</label>
                  <select 
                    value={mapeamento.instituicao}
                    onChange={(e) => setMapeamento({...mapeamento, instituicao: e.target.value})}
                  >
                    <option value="">Selecione uma coluna</option>
                    {previewData.headers.map(header => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </div>

                <div className="mapping-row">
                  <label>Curso</label>
                  <select 
                    value={mapeamento.curso}
                    onChange={(e) => setMapeamento({...mapeamento, curso: e.target.value})}
                  >
                    <option value="">Selecione uma coluna</option>
                    {previewData.headers.map(header => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </div>

                <div className="mapping-row">
                  <label>Unidade/Setor</label>
                  <select 
                    value={mapeamento.unidade}
                    onChange={(e) => setMapeamento({...mapeamento, unidade: e.target.value})}
                  >
                    <option value="">Selecione uma coluna</option>
                    {previewData.headers.map(header => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </div>

                <div className="mapping-row">
                  <label>Supervisor</label>
                  <select 
                    value={mapeamento.supervisor}
                    onChange={(e) => setMapeamento({...mapeamento, supervisor: e.target.value})}
                  >
                    <option value="">Selecione uma coluna</option>
                    {previewData.headers.map(header => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </div>

                <div className="mapping-row">
                  <label>Período</label>
                  <select 
                    value={mapeamento.periodo}
                    onChange={(e) => setMapeamento({...mapeamento, periodo: e.target.value})}
                  >
                    <option value="">Selecione uma coluna</option>
                    {previewData.headers.map(header => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </div>

                <div className="mapping-row">
                  <label>Disciplina</label>
                  <select 
                    value={mapeamento.disciplina}
                    onChange={(e) => setMapeamento({...mapeamento, disciplina: e.target.value})}
                  >
                    <option value="">Selecione uma coluna</option>
                    {previewData.headers.map(header => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </div>

                <div className="mapping-row">
                  <label>Nível</label>
                  <select 
                    value={mapeamento.nivel}
                    onChange={(e) => setMapeamento({...mapeamento, nivel: e.target.value})}
                  >
                    <option value="">Selecione uma coluna</option>
                    {previewData.headers.map(header => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </div>

                <div className="mapping-row">
                  <label>Data Início</label>
                  <select 
                    value={mapeamento.data_inicio}
                    onChange={(e) => setMapeamento({...mapeamento, data_inicio: e.target.value})}
                  >
                    <option value="">Selecione uma coluna</option>
                    {previewData.headers.map(header => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </div>

                <div className="mapping-row">
                  <label>Data Fim</label>
                  <select 
                    value={mapeamento.data_fim}
                    onChange={(e) => setMapeamento({...mapeamento, data_fim: e.target.value})}
                  >
                    <option value="">Selecione uma coluna</option>
                    {previewData.headers.map(header => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="import-section">
              <h3>3. Preview dos Dados</h3>
              <div className="preview-table">
                <p><strong>Registros encontrados:</strong> {previewData.rows.length}</p>
                <table>
                  <thead>
                    <tr>
                      {previewData.headers.map(header => (
                        <th key={header}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.rows.slice(0, 5).map((row, index) => (
                      <tr key={index}>
                        {previewData.headers.map(header => (
                          <td key={header}>{row[header] || '-'}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {previewData.rows.length > 5 && (
                  <p className="preview-note">Mostrando apenas os primeiros 5 registros</p>
                )}
              </div>
            </div>

            <div className="import-section">
              <h3>4. Importar</h3>
              {importProgress && (
                <div className="progress-bar">
                  <div className="progress-fill" style={{width: `${(importProgress.current / importProgress.total) * 100}%`}}></div>
                  <span>Importando... {importProgress.current}/{importProgress.total}</span>
                </div>
              )}
              
              <div className="import-actions">
                <button 
                  className="btn-primary"
                  onClick={handleImportar}
                  disabled={loading || !mapeamento.nome || !mapeamento.email}
                >
                  {loading ? 'Importando...' : 'Importar Dados'}
                </button>
                
                <button 
                  className="btn-secondary"
                  onClick={() => {
                    setSelectedFile(null)
                    setPreviewData(null)
                    setMapeamento({nome: '', email: '', telefone: '', instituicao: '', curso: '', unidade: '', supervisor: '', periodo: '', disciplina: '', nivel: '', horario: '', data_inicio: '', data_fim: '', observacoes: ''})
                  }}
                  disabled={loading}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </>
        )}

        {/* Preview Inteligente para Atividades */}
        {previewInteligente && importMode === 'atividades' && (
          <>
            <div className="import-section">
              <h3>2. Dados Detectados</h3>
              <div className="preview-summary">
                <div className="summary-cards">
                  <div className="summary-card">
                    <span className="summary-number">{previewInteligente.total_atividades}</span>
                    <span className="summary-label">Atividades Encontradas</span>
                  </div>
                  <div className="summary-card">
                    <span className="summary-number">{previewInteligente.abas?.length || 0}</span>
                    <span className="summary-label">Abas/Cursos</span>
                  </div>
                  <div className="summary-card">
                    <span className="summary-number">{atividadesSelecionadas.reduce((total, ativ) => total + (ativ.horas_calculadas || 0), 0)}h</span>
                    <span className="summary-label">Total Horas Selecionadas</span>
                  </div>
                </div>
              </div>

              {previewInteligente.abas?.map((aba, abaIndex) => (
                <div key={abaIndex} className="aba-preview">
                  <h4>{aba.nome} ({aba.atividades.length} atividades - {aba.total_horas_calculadas}h)</h4>
                  <div className="atividades-table">
                    <table>
                      <thead>
                        <tr>
                          <th>✓</th>
                          <th>Instituição</th>
                          <th>Curso</th>
                          <th>Nível</th>
                          <th>Período</th>
                          <th>Supervisor</th>
                          <th>Disciplina</th>
                          <th>Estagiários</th>
                          <th>Horas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {aba.atividades.map((atividade, atividadeIndex) => {
                          const globalIndex = previewInteligente.abas.slice(0, abaIndex).reduce((acc, a) => acc + a.atividades.length, 0) + atividadeIndex
                          const isSelected = atividadesSelecionadas.some(a => 
                            a.disciplina === atividade.disciplina && 
                            a.supervisor === atividade.supervisor && 
                            a.data_inicio === atividade.data_inicio
                          )
                          
                          return (
                            <tr key={atividadeIndex} className={isSelected ? 'selected' : ''}>
                              <td>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleAtividade(globalIndex)}
                                />
                              </td>
                              <td>{atividade.instituicao || '-'}</td>
                              <td>{atividade.curso || '-'}</td>
                              <td>{atividade.nivel || '-'}</td>
                              <td>{atividade.data_inicio} a {atividade.data_fim}</td>
                              <td>{atividade.supervisor || '-'}</td>
                              <td>{atividade.disciplina || '-'}</td>
                              <td>{atividade.num_estagiarios || 1}</td>
                              <td><strong>{atividade.horas_calculadas || 0}h</strong></td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>

            <div className="import-section">
              <h3>3. Selecionar Atividades</h3>
              <div className="selection-controls">
                <button
                  type="button"
                  onClick={selecionarTodasAtividades}
                  className="btn-secondary"
                >
                  Selecionar Todas ({previewInteligente.total_atividades})
                </button>
                <button
                  type="button"
                  onClick={deselecionarTodasAtividades}
                  className="btn-secondary"
                >
                  Deselecionar Todas
                </button>
                <span className="selection-info">
                  {atividadesSelecionadas.length} de {previewInteligente.total_atividades} atividades selecionadas
                </span>
              </div>
            </div>

            <div className="import-section">
              <h3>4. Configurar Importação</h3>
              <div className="config-estagio">
                <label>
                  <input
                    type="checkbox"
                    checked={criarNovoEstagio}
                    onChange={(e) => setCriarNovoEstagio(e.target.checked)}
                  />
                  Criar novo estágio automaticamente
                </label>

                {!criarNovoEstagio && (
                  <div className="estagio-selector">
                    <label>Estágio de destino:</label>
                    <select
                      value={estagioSelecionado}
                      onChange={(e) => setEstagioSelecionado(e.target.value)}
                    >
                      <option value="">Selecione um estágio</option>
                      {estagios.map(estagio => (
                        <option key={estagio.id} value={estagio.id}>
                          {estagio.id} - {estagio.nome} ({estagio.email})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="import-actions">
                <button
                  onClick={handleImportarAtividades}
                  disabled={loading || atividadesSelecionadas.length === 0}
                  className="btn-primary"
                >
                  {loading ? 'Importando...' : `Importar ${atividadesSelecionadas.length} Atividades`}
                </button>
                <button
                  onClick={() => {
                    setSelectedFile(null)
                    setPreviewInteligente(null)
                    setAtividadesSelecionadas([])
                  }}
                  disabled={loading}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </>
        )}

        {!previewData && !previewInteligente && !selectedFile && (
          <div className="import-help">
            <h3>Como importar planilhas:</h3>
            <ol>
              <li>Selecione um arquivo CSV, XLS ou XLSX</li>
              <li>Mapeie as colunas da planilha para os campos do sistema</li>
              <li>Revise o preview dos dados</li>
              <li>Clique em "Importar Dados"</li>
            </ol>
            
            <h4>Formatos aceitos:</h4>
            <ul>
              <li><strong>CSV:</strong> Separado por vírgula ou ponto-e-vírgula</li>
              <li><strong>Excel:</strong> Arquivos .xls ou .xlsx</li>
            </ul>
            
            <h4>Campos obrigatórios:</h4>
            <ul>
              <li>Nome do estagiário</li>
              <li>E-mail do estagiário</li>
            </ul>
          </div>
        )}
      </div>

      <style jsx>{`
        .mode-selector {
          background: white;
          border-radius: 8px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .mode-options {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }

        .mode-option {
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          padding: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .mode-option:hover {
          border-color: #007bff;
          transform: translateY(-2px);
        }

        .mode-option.active {
          border-color: #007bff;
          background-color: #f8f9fa;
        }

        .mode-option input[type="radio"] {
          display: none;
        }

        .mode-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .mode-icon {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }

        .mode-title {
          font-weight: bold;
          margin-bottom: 0.25rem;
        }

        .mode-desc {
          font-size: 0.875rem;
          color: #666;
        }

        .preview-summary {
          margin-bottom: 1.5rem;
        }

        .summary-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .summary-card {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 1rem;
          text-align: center;
          border: 2px solid #e9ecef;
        }

        .summary-number {
          display: block;
          font-size: 1.5rem;
          font-weight: bold;
          color: #007bff;
        }

        .summary-label {
          display: block;
          font-size: 0.875rem;
          color: #666;
          margin-top: 0.25rem;
        }

        .aba-preview {
          margin-bottom: 2rem;
          border: 1px solid #ddd;
          border-radius: 8px;
          overflow: hidden;
        }

        .aba-preview h4 {
          background: #f8f9fa;
          margin: 0;
          padding: 1rem;
          border-bottom: 1px solid #ddd;
          color: #333;
        }

        .atividades-table {
          overflow-x: auto;
        }

        .atividades-table table {
          width: 100%;
          border-collapse: collapse;
        }

        .atividades-table th,
        .atividades-table td {
          padding: 0.75rem;
          text-align: left;
          border-bottom: 1px solid #ddd;
          font-size: 0.875rem;
        }

        .atividades-table th {
          background-color: #f8f9fa;
          font-weight: 600;
          color: #333;
        }

        .atividades-table tr:hover {
          background-color: #f8f9fa;
        }

        .atividades-table tr.selected {
          background-color: #e3f2fd;
        }

        .atividades-table tr.selected:hover {
          background-color: #bbdefb;
        }

        .selection-controls {
          display: flex;
          gap: 1rem;
          align-items: center;
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }

        .selection-info {
          color: #666;
          font-size: 0.875rem;
        }

        .config-estagio {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 1.5rem;
          margin-bottom: 1rem;
        }

        .config-estagio label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
          cursor: pointer;
        }

        .estagio-selector {
          margin-top: 1rem;
        }

        .estagio-selector label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
        }

        .estagio-selector select {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
        }

        .import-actions {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .btn-primary {
          background: #007bff;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 500;
        }

        .btn-primary:hover:not(:disabled) {
          background: #0056b3;
        }

        .btn-primary:disabled {
          background: #6c757d;
          cursor: not-allowed;
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

        .btn-secondary:hover {
          background: #545b62;
        }

        @media (max-width: 768px) {
          .mode-options {
            grid-template-columns: 1fr;
          }
          
          .summary-cards {
            grid-template-columns: 1fr;
          }
          
          .selection-controls {
            flex-direction: column;
            align-items: stretch;
          }
          
          .import-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </Layout>
  )
}

export default Importacao