// Página de cadastro massivo/manual avançado
import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import '../styles/CadastroMassivo.css'

const API_URL = (import.meta.env && import.meta.env.VITE_API_URL) || ''

function CadastroMassivo() {
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('supervisores')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  // Estados para múltiplos registros
  const [supervisores, setSupervisores] = useState([
    { nome: '', email: '', telefone: '', especialidade: '' }
  ])

  const [cursos, setCursos] = useState([
    { nome: '', codigo: '', duracao_semestres: '' }
  ])

  const [unidades, setUnidades] = useState([
    { nome: '', tipo: '', endereco: '' }
  ])

  const [instituicoes, setInstituicoes] = useState([
    { nome: '', endereco: '', contato: '' }
  ])

  const [estagios, setEstagios] = useState([
    {
      nome_estagiario: '',
      cpf: '',
      email: '',
      telefone: '',
      curso: '',
      disciplina: '',
      data_inicio: '',
      data_fim: '',
      carga_horaria: '',
      nivel: 'Graduação',
      num_estagiarios: '1',
      observacoes: ''
    }
  ])

  useEffect(() => {
    fetchUserInfo()
  }, [])

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

  // Função para formatar telefone automaticamente
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

  // Função para formatar CPF automaticamente
  const formatarCPF = (valor) => {
    const apenas_numeros = valor.replace(/\D/g, '')
    
    if (apenas_numeros.length <= 3) {
      return apenas_numeros
    } else if (apenas_numeros.length <= 6) {
      return `${apenas_numeros.slice(0, 3)}.${apenas_numeros.slice(3)}`
    } else if (apenas_numeros.length <= 9) {
      return `${apenas_numeros.slice(0, 3)}.${apenas_numeros.slice(3, 6)}.${apenas_numeros.slice(6)}`
    } else {
      return `${apenas_numeros.slice(0, 3)}.${apenas_numeros.slice(3, 6)}.${apenas_numeros.slice(6, 9)}-${apenas_numeros.slice(9, 11)}`
    }
  }

  // Funções para adicionar/remover linhas
  const adicionarLinha = (tipo) => {
    const templates = {
      supervisores: { nome: '', email: '', telefone: '', especialidade: '' },
      cursos: { nome: '', codigo: '', duracao_semestres: '' },
      unidades: { nome: '', tipo: '', endereco: '' },
      instituicoes: { nome: '', endereco: '', contato: '' },
      estagios: {
        nome_estagiario: '',
        cpf: '',
        email: '',
        telefone: '',
        curso: '',
        disciplina: '',
        data_inicio: '',
        data_fim: '',
        carga_horaria: '',
        nivel: 'Graduação',
        num_estagiarios: '1',
        observacoes: ''
      }
    }

    switch(tipo) {
      case 'supervisores':
        setSupervisores([...supervisores, templates.supervisores])
        break
      case 'cursos':
        setCursos([...cursos, templates.cursos])
        break
      case 'unidades':
        setUnidades([...unidades, templates.unidades])
        break
      case 'instituicoes':
        setInstituicoes([...instituicoes, templates.instituicoes])
        break
      case 'estagios':
        setEstagios([...estagios, templates.estagios])
        break
    }
  }

  const removerLinha = (tipo, index) => {
    switch(tipo) {
      case 'supervisores':
        if (supervisores.length > 1) {
          setSupervisores(supervisores.filter((_, i) => i !== index))
        }
        break
      case 'cursos':
        if (cursos.length > 1) {
          setCursos(cursos.filter((_, i) => i !== index))
        }
        break
      case 'unidades':
        if (unidades.length > 1) {
          setUnidades(unidades.filter((_, i) => i !== index))
        }
        break
      case 'instituicoes':
        if (instituicoes.length > 1) {
          setInstituicoes(instituicoes.filter((_, i) => i !== index))
        }
        break
      case 'estagios':
        if (estagios.length > 1) {
          setEstagios(estagios.filter((_, i) => i !== index))
        }
        break
    }
  }

  // Função para atualizar campo específico
  const atualizarCampo = (tipo, index, campo, valor) => {
    // Aplicar formatação automática
    if (campo === 'telefone') {
      valor = formatarTelefone(valor)
    } else if (campo === 'cpf') {
      valor = formatarCPF(valor)
    }

    switch(tipo) {
      case 'supervisores':
        const novosSupervisores = [...supervisores]
        novosSupervisores[index][campo] = valor
        setSupervisores(novosSupervisores)
        break
      case 'cursos':
        const novosCursos = [...cursos]
        novosCursos[index][campo] = valor
        setCursos(novosCursos)
        break
      case 'unidades':
        const novasUnidades = [...unidades]
        novasUnidades[index][campo] = valor
        setUnidades(novasUnidades)
        break
      case 'instituicoes':
        const novasInstituicoes = [...instituicoes]
        novasInstituicoes[index][campo] = valor
        setInstituicoes(novasInstituicoes)
        break
      case 'estagios':
        const novosEstagios = [...estagios]
        novosEstagios[index][campo] = valor
        setEstagios(novosEstagios)
        break
    }
  }

  // Função para cadastrar todos os itens de um tipo
  const cadastrarTodos = async (tipo) => {
    setLoading(true)
    setError('')
    setSuccess('')

    let dados, endpoint
    
    switch(tipo) {
      case 'supervisores':
        dados = supervisores.filter(s => s.nome.trim())
        endpoint = '/supervisores'
        break
      case 'cursos':
        dados = cursos.filter(c => c.nome.trim())
        endpoint = '/cursos'
        break
      case 'unidades':
        dados = unidades.filter(u => u.nome.trim())
        endpoint = '/unidades'
        break
      case 'instituicoes':
        dados = instituicoes.filter(i => i.nome.trim())
        endpoint = '/instituicoes'
        break
      case 'estagios':
        dados = estagios.filter(e => e.nome_estagiario.trim())
        endpoint = '/estagios'
        break
    }

    if (dados.length === 0) {
      setError('Nenhum dado válido para cadastrar')
      setLoading(false)
      return
    }

    let sucessos = 0
    let erros = 0

    for (const item of dados) {
      try {
        // Converter campos numéricos para estágios
        if (tipo === 'estagios') {
          if (item.carga_horaria) item.carga_horaria = parseInt(item.carga_horaria)
          if (item.num_estagiarios) item.num_estagiarios = parseInt(item.num_estagiarios)
        } else if (tipo === 'cursos') {
          if (item.duracao_semestres) item.duracao_semestres = parseInt(item.duracao_semestres)
        }

        const response = await fetch(`${API_URL}${endpoint}`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(item)
        })

        if (response.ok) {
          sucessos++
        } else {
          erros++
          console.error(`Erro ao cadastrar item:`, await response.text())
        }
      } catch (err) {
        erros++
        console.error('Erro de conexão:', err)
      }
    }

    setLoading(false)

    if (sucessos > 0 && erros === 0) {
      setSuccess(`✅ Todos os ${sucessos} ${tipo} foram cadastrados com sucesso!`)
      
      // Limpar formulário após sucesso
      switch(tipo) {
        case 'supervisores':
          setSupervisores([{ nome: '', email: '', telefone: '', especialidade: '' }])
          break
        case 'cursos':
          setCursos([{ nome: '', codigo: '', duracao_semestres: '' }])
          break
        case 'unidades':
          setUnidades([{ nome: '', tipo: '', endereco: '' }])
          break
        case 'instituicoes':
          setInstituicoes([{ nome: '', endereco: '', contato: '' }])
          break
        case 'estagios':
          setEstagios([{
            nome_estagiario: '',
            cpf: '',
            email: '',
            telefone: '',
            curso: '',
            disciplina: '',
            data_inicio: '',
            data_fim: '',
            carga_horaria: '',
            nivel: 'Graduação',
            num_estagiarios: '1',
            observacoes: ''
          }])
          break
      }
    } else if (sucessos > 0 && erros > 0) {
      setSuccess(`⚠️ ${sucessos} ${tipo} cadastrados com sucesso, ${erros} falharam.`)
    } else {
      setError(`❌ Erro ao cadastrar ${tipo}. Verifique os dados e tente novamente.`)
    }
  }

  const renderFormularioSupervisores = () => (
    <div className="cadastro-massivo-container">
      <div className="cadastro-header">
        <h3>📋 Cadastro de Supervisores</h3>
        <button 
          className="btn-primary"
          onClick={() => adicionarLinha('supervisores')}
        >
          ➕ Adicionar Linha
        </button>
      </div>

      <div className="cadastro-grid">
        <div className="grid-header">
          <div>Nome *</div>
          <div>E-mail *</div>
          <div>Telefone</div>
          <div>Especialidade</div>
          <div>Ações</div>
        </div>

        {supervisores.map((supervisor, index) => (
          <div key={index} className="grid-row">
            <input
              type="text"
              placeholder="Ex: Dr. João Silva"
              value={supervisor.nome}
              onChange={(e) => atualizarCampo('supervisores', index, 'nome', e.target.value)}
            />
            <input
              type="email"
              placeholder="supervisor@instituicao.com"
              value={supervisor.email}
              onChange={(e) => atualizarCampo('supervisores', index, 'email', e.target.value)}
            />
            <input
              type="tel"
              placeholder="(11) 99999-9999"
              value={supervisor.telefone}
              onChange={(e) => atualizarCampo('supervisores', index, 'telefone', e.target.value)}
              maxLength="15"
            />
            <input
              type="text"
              placeholder="Ex: Psicologia Clínica"
              value={supervisor.especialidade}
              onChange={(e) => atualizarCampo('supervisores', index, 'especialidade', e.target.value)}
            />
            <button 
              className="btn-small btn-danger"
              onClick={() => removerLinha('supervisores', index)}
              disabled={supervisores.length === 1}
            >
              🗑️
            </button>
          </div>
        ))}
      </div>

      <div className="cadastro-actions">
        <button 
          className="btn-success"
          onClick={() => cadastrarTodos('supervisores')}
          disabled={loading}
        >
          {loading ? 'Cadastrando...' : '💾 Cadastrar Todos os Supervisores'}
        </button>
      </div>
    </div>
  )

  const renderFormularioCursos = () => (
    <div className="cadastro-massivo-container">
      <div className="cadastro-header">
        <h3>🎓 Cadastro de Cursos</h3>
        <button 
          className="btn-primary"
          onClick={() => adicionarLinha('cursos')}
        >
          ➕ Adicionar Linha
        </button>
      </div>

      <div className="cadastro-grid">
        <div className="grid-header">
          <div>Nome do Curso *</div>
          <div>Código</div>
          <div>Duração (semestres)</div>
          <div>Ações</div>
        </div>

        {cursos.map((curso, index) => (
          <div key={index} className="grid-row">
            <input
              type="text"
              placeholder="Ex: Psicologia"
              value={curso.nome}
              onChange={(e) => atualizarCampo('cursos', index, 'nome', e.target.value)}
            />
            <input
              type="text"
              placeholder="Ex: PSI"
              value={curso.codigo}
              onChange={(e) => atualizarCampo('cursos', index, 'codigo', e.target.value)}
            />
            <input
              type="number"
              placeholder="8"
              value={curso.duracao_semestres}
              onChange={(e) => atualizarCampo('cursos', index, 'duracao_semestres', e.target.value)}
              min="1"
              max="20"
            />
            <button 
              className="btn-small btn-danger"
              onClick={() => removerLinha('cursos', index)}
              disabled={cursos.length === 1}
            >
              🗑️
            </button>
          </div>
        ))}
      </div>

      <div className="cadastro-actions">
        <button 
          className="btn-success"
          onClick={() => cadastrarTodos('cursos')}
          disabled={loading}
        >
          {loading ? 'Cadastrando...' : '💾 Cadastrar Todos os Cursos'}
        </button>
      </div>
    </div>
  )

  const renderFormularioUnidades = () => (
    <div className="cadastro-massivo-container">
      <div className="cadastro-header">
        <h3>🏥 Cadastro de Unidades</h3>
        <button 
          className="btn-primary"
          onClick={() => adicionarLinha('unidades')}
        >
          ➕ Adicionar Linha
        </button>
      </div>

      <div className="cadastro-grid">
        <div className="grid-header">
          <div>Nome da Unidade *</div>
          <div>Tipo</div>
          <div>Endereço</div>
          <div>Ações</div>
        </div>

        {unidades.map((unidade, index) => (
          <div key={index} className="grid-row">
            <input
              type="text"
              placeholder="Ex: Hospital Municipal"
              value={unidade.nome}
              onChange={(e) => atualizarCampo('unidades', index, 'nome', e.target.value)}
            />
            <select
              value={unidade.tipo}
              onChange={(e) => atualizarCampo('unidades', index, 'tipo', e.target.value)}
            >
              <option value="">Selecionar tipo...</option>
              <option value="Hospital">Hospital</option>
              <option value="UBS">Unidade Básica de Saúde</option>
              <option value="Clínica">Clínica</option>
              <option value="Laboratório">Laboratório</option>
              <option value="Farmácia">Farmácia</option>
              <option value="Escola">Escola</option>
              <option value="Universidade">Universidade</option>
              <option value="Outro">Outro</option>
            </select>
            <input
              type="text"
              placeholder="Rua, Cidade - Estado"
              value={unidade.endereco}
              onChange={(e) => atualizarCampo('unidades', index, 'endereco', e.target.value)}
            />
            <button 
              className="btn-small btn-danger"
              onClick={() => removerLinha('unidades', index)}
              disabled={unidades.length === 1}
            >
              🗑️
            </button>
          </div>
        ))}
      </div>

      <div className="cadastro-actions">
        <button 
          className="btn-success"
          onClick={() => cadastrarTodos('unidades')}
          disabled={loading}
        >
          {loading ? 'Cadastrando...' : '💾 Cadastrar Todas as Unidades'}
        </button>
      </div>
    </div>
  )

  const renderFormularioInstituicoes = () => (
    <div className="cadastro-massivo-container">
      <div className="cadastro-header">
        <h3>🏫 Cadastro de Instituições</h3>
        <button 
          className="btn-primary"
          onClick={() => adicionarLinha('instituicoes')}
        >
          ➕ Adicionar Linha
        </button>
      </div>

      <div className="cadastro-grid">
        <div className="grid-header">
          <div>Nome da Instituição *</div>
          <div>Endereço</div>
          <div>Contato</div>
          <div>Ações</div>
        </div>

        {instituicoes.map((instituicao, index) => (
          <div key={index} className="grid-row">
            <input
              type="text"
              placeholder="Ex: Faculdade Guarapuava"
              value={instituicao.nome}
              onChange={(e) => atualizarCampo('instituicoes', index, 'nome', e.target.value)}
            />
            <input
              type="text"
              placeholder="Endereço completo"
              value={instituicao.endereco}
              onChange={(e) => atualizarCampo('instituicoes', index, 'endereco', e.target.value)}
            />
            <input
              type="text"
              placeholder="E-mail ou telefone"
              value={instituicao.contato}
              onChange={(e) => atualizarCampo('instituicoes', index, 'contato', e.target.value)}
            />
            <button 
              className="btn-small btn-danger"
              onClick={() => removerLinha('instituicoes', index)}
              disabled={instituicoes.length === 1}
            >
              🗑️
            </button>
          </div>
        ))}
      </div>

      <div className="cadastro-actions">
        <button 
          className="btn-success"
          onClick={() => cadastrarTodos('instituicoes')}
          disabled={loading}
        >
          {loading ? 'Cadastrando...' : '💾 Cadastrar Todas as Instituições'}
        </button>
      </div>
    </div>
  )

  const renderFormularioEstagios = () => (
    <div className="cadastro-massivo-container">
      <div className="cadastro-header">
        <h3>📝 Cadastro de Estágios</h3>
        <button 
          className="btn-primary"
          onClick={() => adicionarLinha('estagios')}
        >
          ➕ Adicionar Linha
        </button>
      </div>

      <div className="cadastro-grid-wide">
        <div className="grid-header-wide">
          <div>Nome do Estagiário *</div>
          <div>CPF</div>
          <div>E-mail</div>
          <div>Telefone</div>
          <div>Curso</div>
          <div>Disciplina</div>
          <div>Data Início</div>
          <div>Data Fim</div>
          <div>C.H.</div>
          <div>Ações</div>
        </div>

        {estagios.map((estagio, index) => (
          <div key={index} className="grid-row-wide">
            <input
              type="text"
              placeholder="Nome completo"
              value={estagio.nome_estagiario}
              onChange={(e) => atualizarCampo('estagios', index, 'nome_estagiario', e.target.value)}
            />
            <input
              type="text"
              placeholder="000.000.000-00"
              value={estagio.cpf}
              onChange={(e) => atualizarCampo('estagios', index, 'cpf', e.target.value)}
              maxLength="14"
            />
            <input
              type="email"
              placeholder="estudante@email.com"
              value={estagio.email}
              onChange={(e) => atualizarCampo('estagios', index, 'email', e.target.value)}
            />
            <input
              type="tel"
              placeholder="(11) 99999-9999"
              value={estagio.telefone}
              onChange={(e) => atualizarCampo('estagios', index, 'telefone', e.target.value)}
              maxLength="15"
            />
            <input
              type="text"
              placeholder="Ex: Psicologia"
              value={estagio.curso}
              onChange={(e) => atualizarCampo('estagios', index, 'curso', e.target.value)}
            />
            <input
              type="text"
              placeholder="Ex: Estágio I"
              value={estagio.disciplina}
              onChange={(e) => atualizarCampo('estagios', index, 'disciplina', e.target.value)}
            />
            <input
              type="date"
              value={estagio.data_inicio}
              onChange={(e) => atualizarCampo('estagios', index, 'data_inicio', e.target.value)}
            />
            <input
              type="date"
              value={estagio.data_fim}
              onChange={(e) => atualizarCampo('estagios', index, 'data_fim', e.target.value)}
            />
            <input
              type="number"
              placeholder="400"
              value={estagio.carga_horaria}
              onChange={(e) => atualizarCampo('estagios', index, 'carga_horaria', e.target.value)}
              min="1"
            />
            <button 
              className="btn-small btn-danger"
              onClick={() => removerLinha('estagios', index)}
              disabled={estagios.length === 1}
            >
              🗑️
            </button>
          </div>
        ))}
      </div>

      <div className="cadastro-actions">
        <button 
          className="btn-success"
          onClick={() => cadastrarTodos('estagios')}
          disabled={loading}
        >
          {loading ? 'Cadastrando...' : '💾 Cadastrar Todos os Estágios'}
        </button>
      </div>
    </div>
  )

  if (loading && activeTab === '') {
    return <div className="loading">Carregando...</div>
  }

  return (
    <Layout user={user}>
      <div className="page-header">
        <h1>📊 Cadastro Massivo de Dados</h1>
        <p>Use esta interface para cadastrar múltiplos registros de uma vez</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="cadastro-massivo-tabs">
        <button 
          className={`tab-button ${activeTab === 'supervisores' ? 'active' : ''}`}
          onClick={() => setActiveTab('supervisores')}
        >
          👨‍⚕️ Supervisores
        </button>
        <button 
          className={`tab-button ${activeTab === 'cursos' ? 'active' : ''}`}
          onClick={() => setActiveTab('cursos')}
        >
          🎓 Cursos
        </button>
        <button 
          className={`tab-button ${activeTab === 'unidades' ? 'active' : ''}`}
          onClick={() => setActiveTab('unidades')}
        >
          🏥 Unidades
        </button>
        <button 
          className={`tab-button ${activeTab === 'instituicoes' ? 'active' : ''}`}
          onClick={() => setActiveTab('instituicoes')}
        >
          🏫 Instituições
        </button>
        <button 
          className={`tab-button ${activeTab === 'estagios' ? 'active' : ''}`}
          onClick={() => setActiveTab('estagios')}
        >
          📝 Estágios
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'supervisores' && renderFormularioSupervisores()}
        {activeTab === 'cursos' && renderFormularioCursos()}
        {activeTab === 'unidades' && renderFormularioUnidades()}
        {activeTab === 'instituicoes' && renderFormularioInstituicoes()}
        {activeTab === 'estagios' && renderFormularioEstagios()}
      </div>
    </Layout>
  )
}

export default CadastroMassivo