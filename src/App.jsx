import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login       from './pages/Login'
import Layout      from './components/layout/Layout'
import Dashboard   from './pages/Dashboard'
import Clientes    from './pages/Clientes'
import ClienteDetalle from './pages/ClienteDetalle'
import Tareas      from './pages/Tareas'
import Agenda      from './pages/Agenda'
import Facturas    from './pages/Facturas'
import ResumenCierre from './pages/ResumenCierre'

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="clientes/:id" element={<ClienteDetalle />} />
          <Route path="tareas" element={<Tareas />} />
          <Route path="agenda" element={<Agenda />} />
          <Route path="facturas" element={<Facturas />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="cierre" element={<ResumenCierre />} />
      </Routes>
    </BrowserRouter>
  )
}
