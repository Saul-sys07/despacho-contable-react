import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import './Layout.css'

const NAV = [
  { to: '/',         label: 'Panel',       icon: '▦' },
  { to: '/clientes', label: 'Clientes',    icon: '◎' },
  { to: '/tareas',   label: 'Tareas',      icon: '✓' },
  { to: '/agenda',   label: 'Agenda',      icon: '▦' },
  { to: '/facturas', label: 'Facturación', icon: '$' },
  { to: '/cierre', label: 'Cierre mensual', icon: '📊' },
]

export default function Layout() {
  const navigate  = useNavigate()
  const usuario   = JSON.parse(localStorage.getItem('usuario') || '{}')

  function logout() {
    localStorage.clear()
    navigate('/login')
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="1" width="6" height="6" rx="1.5" fill="white" opacity="0.9"/>
              <rect x="9" y="1" width="6" height="6" rx="1.5" fill="white" opacity="0.6"/>
              <rect x="1" y="9" width="6" height="6" rx="1.5" fill="white" opacity="0.6"/>
              <rect x="9" y="9" width="6" height="6" rx="1.5" fill="white" opacity="0.35"/>
            </svg>
          </div>
          <div>
            <div className="logo-name">DespachoApp</div>
            <div className="logo-sub">Gestión fiscal</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">Principal</div>
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="user-avatar">
              {(usuario.nombre || 'U')[0].toUpperCase()}
            </div>
            <div className="user-info">
              <div className="user-name">{usuario.nombre || 'Usuario'}</div>
              <div className="user-rol">{usuario.rol || 'contador'}</div>
            </div>
          </div>
          <button className="btn-logout" onClick={logout}>↩</button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
