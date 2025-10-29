import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Estagios from './pages/Estagios'
import DashboardNew from './pages/DashboardNew'
import Usuarios from './pages/Usuarios'
import Supervisores from './pages/Supervisores'
import Importacao from './pages/Importacao'
import CadastroMassivo from './pages/CadastroMassivo'
import { Instituicoes, Cursos, Unidades } from './pages/Catalogos'
import Vagas from './pages/Vagas'
import Relatorios from './pages/Relatorios'
import RelatoriosInterativos from './pages/RelatoriosInterativos'
import PlanosAnexo2 from './pages/PlanosAnexo2'
import Anexo2 from './pages/Anexo2'
import CadastroAtividades from './pages/CadastroAtividades'
import PlanoAtividadesView from './pages/PlanoAtividadesView'

const API_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) || process.env.VITE_API_URL || 'http://localhost:8001'
const BASENAME = '/app'

function App() {
  return (
    <BrowserRouter basename={BASENAME}>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<DashboardNew />} />
          <Route path="/estagios" element={<Estagios />} />
          <Route path="/usuarios" element={<Usuarios />} />
          <Route path="/supervisores" element={<Supervisores />} />
          <Route path="/importacao" element={<Importacao />} />
          <Route path="/cadastro-massivo" element={<CadastroMassivo />} />
          <Route path="/instituicoes" element={<Instituicoes />} />
          <Route path="/cursos" element={<Cursos />} />
          <Route path="/unidades" element={<Unidades />} />
          <Route path="/vagas" element={<Vagas />} />
          <Route path="/relatorios" element={<Relatorios />} />
          <Route path="/relatorios-interativos" element={<RelatoriosInterativos />} />
          <Route path="/planos-anexo2" element={<PlanosAnexo2 />} />
          <Route path="/anexo2" element={<Anexo2 />} />
          <Route path="/cadastro-atividades" element={<CadastroAtividades />} />
          <Route path="/plano-atividades/:id" element={<PlanoAtividadesView />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App