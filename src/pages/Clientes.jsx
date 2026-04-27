// Clientes.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

export function Clientes() {
  const [clientes, setClientes] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/clientes/').then(r => setClientes(r.data)).finally(() => setLoading(false))
  }, [])

  const filtrados = clientes.filter(c =>
    c.nombre_completo.toLowerCase().includes(busqueda.toLowerCase())
  )

  if (loading) return <div className="loading-center"><div className="spinner"/> Cargando...</div>

  return (
    <div style={{padding:24}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
        <h1 style={{fontSize:20,fontWeight:600}}>Clientes</h1>
        <button className="btn btn-primary">+ Nuevo cliente</button>
      </div>
      <div style={{marginBottom:16}}>
        <input className="input" placeholder="Buscar cliente..." value={busqueda}
          onChange={e=>setBusqueda(e.target.value)} style={{maxWidth:300}}/>
      </div>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Entidades</th>
              <th>Portal</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map(c => (
              <tr key={c.id} style={{cursor:'pointer'}} onClick={()=>navigate(`/clientes/${c.id}`)}>
                <td>
                  <div style={{fontWeight:500}}>{c.nombre_completo}</div>
                  <div style={{fontSize:11,color:'var(--text-muted)'}}>{c.email||'—'}</div>
                </td>
                <td>{c.num_entidades || 0} entidad{c.num_entidades!==1?'es':''}</td>
                <td>
                  {c.portal_activo
                    ? <span className="badge badge-green">Activo</span>
                    : <span className="badge badge-gray">Inactivo</span>}
                </td>
                <td>
                  <button className="btn btn-sm" onClick={e=>{e.stopPropagation();navigate(`/clientes/${c.id}`)}}>
                    Ver →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtrados.length && <div className="empty-state">Sin clientes</div>}
      </div>
    </div>
  )
}

export default Clientes
