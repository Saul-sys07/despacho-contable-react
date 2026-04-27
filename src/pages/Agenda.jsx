// Agenda.jsx
import { useState, useEffect } from 'react'
import api from '../services/api'

export default function Agenda() {
  const [eventos, setEventos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/agenda/').then(r => setEventos(r.data)).finally(()=>setLoading(false))
  }, [])

  if (loading) return <div className="loading-center"><div className="spinner"/> Cargando...</div>

  return (
    <div style={{padding:24,display:'flex',flexDirection:'column',gap:20}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <h1 style={{fontSize:20,fontWeight:600}}>Agenda</h1>
        <button className="btn btn-primary">+ Nueva cita</button>
      </div>
      <div className="card">
        {eventos.map(e => (
          <div key={e.id} style={{display:'flex',gap:14,padding:'12px 16px',borderBottom:'1px solid var(--border)'}}>
            <div style={{width:4,borderRadius:4,background:'var(--navy)',flexShrink:0}}/>
            <div style={{flex:1}}>
              <div style={{fontWeight:500,fontSize:13}}>{e.titulo}</div>
              <div style={{fontSize:11,color:'var(--text-muted)',marginTop:2}}>
                {e.nombre_completo && `${e.nombre_completo} · `}
                {new Date(e.fecha_inicio).toLocaleString('es-MX',{dateStyle:'short',timeStyle:'short'})}
              </div>
            </div>
            <span className={`badge badge-${e.estatus==='completado'?'green':e.estatus==='cancelado'?'red':'blue'}`}>
              {e.tipo}
            </span>
          </div>
        ))}
        {!eventos.length && <div className="empty-state">Sin eventos agendados</div>}
      </div>
    </div>
  )
}
