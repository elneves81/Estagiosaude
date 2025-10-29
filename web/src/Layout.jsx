// Layout principal com navegação
import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

function Layout({ children, user }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  // Load persisted sidebar state
  useEffect(() => {
    try {
      const v = localStorage.getItem('sidebarCollapsed')
      if (v === 'true') setCollapsed(true)
    } catch {}
  }, [])

  const toggleCollapsed = () => {
    setCollapsed(prev => {
      const next = !prev
      try { localStorage.setItem('sidebarCollapsed', String(next)) } catch {}
      return next
    })
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userType')
    navigate('/login')
  }

  const menuItems = [
    // Dashboard aponta para a rota dedicada do painel
    { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { path: '/usuarios', label: 'Usuários', icon: '👥', adminOnly: true },
    { path: '/supervisores', label: 'Supervisores', icon: '👨‍💼' },
    { path: '/estagios', label: 'Estágios', icon: '📋' },
    { path: '/importacao', label: 'Importar Planilhas', icon: '📤' },
    { path: '/cadastro-massivo', label: 'Cadastro Massivo', icon: '📊' },
  { path: '/instituicoes', label: 'Instituições de Ensino', icon: '�' },
    { path: '/cursos', label: 'Cursos', icon: '📚' },
    { path: '/unidades', label: 'Unidades', icon: '🏢' },
  { path: '/vagas', label: 'Vagas', icon: '🧑‍🎓', adminOnly: true },
    { path: '/relatorios', label: 'Relatórios', icon: '📑' },
    { path: '/relatorios-interativos', label: 'Relatórios Interativos', icon: '🧩' },
  { path: '/planos-anexo2', label: 'Planos Anexo II', icon: '📝' },
  { path: '/anexo2', label: 'Editar/Importar Plano', icon: '✏️' },
  { path: '/cadastro-atividades', label: 'Cadastrar Atividades', icon: '➕' },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <div className="layout">
      <nav className={`sidebar${collapsed ? ' collapsed' : ''}`}>
        <div className="sidebar-header">
          <h2>Sistema de Estágios</h2>
          <div className="user-info">
            <span>{user?.nome}</span>
            <small>({user?.tipo})</small>
          </div>
          <button className="sidebar-toggle" onClick={toggleCollapsed} title={collapsed ? 'Expandir menu' : 'Encolher menu'}>
            {collapsed ? '➤' : '◀︎'} {collapsed ? '' : ' Encolher'}
          </button>
        </div>

        <ul className="nav-menu">
          {menuItems.map((item) => {
            // Ocultar itens só para admin se usuário não for admin
            if (item.adminOnly && user?.tipo !== 'admin') {
              return null
            }

            return (
              <li key={item.path} className={isActive(item.path) ? 'active' : ''}>
                <button onClick={() => navigate(item.path)}>
                  <span className="icon">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              </li>
            )
          })}
        </ul>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <span className="icon">🚪</span>
            <span>Sair</span>
          </button>
        </div>
      </nav>

      <main className="main-content">
        <div className="content-wrapper">
          {children}
        </div>
      </main>
    </div>
  )
}

export default Layout