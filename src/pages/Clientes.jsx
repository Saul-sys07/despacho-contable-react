import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import './Clientes.css'

export default function Clientes() {
  const [clientes,  setClientes]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [busqueda,  setBusqueda]  = useState('')
  const [modal,     setModal]     = useState(false)
  const [form,      setForm]      = useState({ nombre_completo:'', telefono:'', email:'', notas:'' })
  const [guardando, setGuardando] = useState(false)
  const navigate = useNavigate()

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    try {
      const { data } = await api.get('/clientes')
      setClientes(data)
    } finally {
      setLoading(false)
    }
  }

  async function guardarCliente(e) {
    e.preventDefault()
    setGuardando(true)
    try {
      await api.post('/clientes', form)
      setModal(false)
      setForm({ nombre_completo:'', telefono:'', email:'', notas:'' })
      cargar()
    } catch(err) {
      alert(err.response?.data?.detail || 'Error al guardar')
    } finally {
      setGuardando(false)
    }
  }

  const filtrados = clientes.filter(c =>
    c.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()) ||
    (c.email||'').toLowerCase().includes(busqueda.toLowerCase())
  )

  if (loading) return <div className="loading-center"><div className="spinner"/> Cargando clientes...</div>

  return (
    <div className="clientes-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Clientes</h1>
          <div className="page-sub">{clientes.length} clientes registrados</div>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>
          + Nuevo cliente
        </button>
      </div>

      <input
        className="input"
        placeholder="Buscar por nombre o correo..."
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
        style={{ maxWidth: 340 }}
      />

      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Entidades</th>
              <th>Contacto</th>
              <th>Portal</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map(c => (
              <tr key={c.id} onClick={() => navigate(`/clientes/${c.id}`)} style={{cursor:'pointer'}}>
                <td>
                  <div style={{display:'flex', alignItems:'center', gap:10}}>
                    <div className="client-avatar-sm">
                      {c.nombre_completo.split(' ').map(w=>w[0]).slice(0,2).join('')}
                    </div>
                    <div>
                      <div style={{fontWeight:500}}>{c.nombre_completo}</div>
                      {c.notas && <div style={{fontSize:11,color:'var(--text-muted)'}}>{c.notas}</div>}
                    </div>
                  </div>
                </td>
                <td style={{fontSize:12,fontFamily:'var(--mono)',color:'var(--text-muted)'}}>
                  {c.num_entidades || 0} entidad{c.num_entidades !== 1 ? 'es' : ''}
                </td>
                <td>
                  <div style={{fontSize:12}}>{c.telefono || '—'}</div>
                  <div style={{fontSize:11,color:'var(--text-muted)'}}>{c.email || ''}</div>
                </td>
                <td>
                  {c.portal_activo
                    ? <span className="badge badge-green">Activo</span>
                    : <span className="badge badge-gray">Inactivo</span>}
                </td>
                <td>
                  <button className="btn btn-sm" onClick={e => { e.stopPropagation(); navigate(`/clientes/${c.id}`) }}>
                    Ver →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtrados.length && (
          <div className="empty-state">
            {busqueda ? 'Sin resultados' : 'Sin clientes registrados'}
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <span>Nuevo cliente</span>
              <button className="modal-close" onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={guardarCliente} className="modal-body">
              <div className="field">
                <label>Nombre completo *</label>
                <input className="input" required
                  placeholder="Ej. Juan García López"
                  value={form.nombre_completo}
                  onChange={e => setForm({...form, nombre_completo: e.target.value})}
                />
              </div>
              <div className="field">
                <label>Teléfono</label>
                <input className="input"
                  placeholder="5512345678"
                  value={form.telefono}
                  onChange={e => setForm({...form, telefono: e.target.value})}
                />
              </div>
              <div className="field">
                <label>Correo electrónico</label>
                <input className="input" type="email"
                  placeholder="correo@ejemplo.com"
                  value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                />
              </div>
              <div className="field">
                <label>Notas</label>
                <textarea className="input" rows={2}
                  placeholder="Notas adicionales..."
                  value={form.notas}
                  onChange={e => setForm({...form, notas: e.target.value})}
                />
              </div>
              <div style={{display:'flex', gap:8, justifyContent:'flex-end', marginTop:4}}>
                <button type="button" className="btn" onClick={() => setModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={guardando}>
                  {guardando ? 'Guardando...' : 'Guardar cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
