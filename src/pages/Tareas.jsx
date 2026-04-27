// Tareas.jsx
import { useState, useEffect } from 'react'
import api from '../services/api'

export default function Tareas() {
  const [tareas,  setTareas]  = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/tareas/').then(r => setTareas(r.data)).finally(()=>setLoading(false))
  }, [])

  async function completar(id) {
    await api.put(`/tareas/${id}/estatus`, { estatus: 'completada' })
    setTareas(prev => prev.map(t => t.id===id ? {...t, estatus:'completada'} : t))
  }

  if (loading) return <div className="loading-center"><div className="spinner"/> Cargando...</div>

  const pendientes  = tareas.filter(t => t.estatus === 'pendiente')
  const completadas = tareas.filter(t => t.estatus === 'completada')

  return (
    <div style={{padding:24,display:'flex',flexDirection:'column',gap:20}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <h1 style={{fontSize:20,fontWeight:600}}>Tareas</h1>
        <button className="btn btn-primary">+ Nueva tarea</button>
      </div>

      <div className="card">
        <div style={{padding:'10px 16px',borderBottom:'1px solid var(--border)',fontSize:12,fontWeight:600,color:'var(--text-muted)'}}>
          PENDIENTES ({pendientes.length})
        </div>
        {pendientes.map(t => (
          <div key={t.id} style={{display:'flex',alignItems:'flex-start',gap:10,padding:'10px 16px',borderBottom:'1px solid var(--border)'}}>
            <button
              onClick={()=>completar(t.id)}
              style={{width:16,height:16,borderRadius:3,border:'1.5px solid var(--gray-300)',background:'none',cursor:'pointer',flexShrink:0,marginTop:2}}
            />
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:500}}>{t.titulo}</div>
              <div style={{fontSize:11,color:'var(--text-muted)',marginTop:2}}>
                {t.razon_social || t.nombre_completo || '—'}
                {t.tipo_entidad && <span className={`badge badge-${t.tipo_entidad==='fisica'?'blue':'gray'}`} style={{marginLeft:6}}>{t.tipo_entidad}</span>}
              </div>
            </div>
            {t.fecha_vencimiento && (
              <span style={{fontSize:11,color:'var(--text-muted)',flexShrink:0}}>
                {new Date(t.fecha_vencimiento).toLocaleDateString('es-MX')}
              </span>
            )}
            <span className={`badge badge-${t.prioridad==='alta'?'red':t.prioridad==='media'?'amber':'gray'}`}>
              {t.prioridad}
            </span>
          </div>
        ))}
        {!pendientes.length && <div className="empty-state">Sin tareas pendientes</div>}
      </div>

      {completadas.length > 0 && (
        <div className="card">
          <div style={{padding:'10px 16px',borderBottom:'1px solid var(--border)',fontSize:12,fontWeight:600,color:'var(--text-muted)'}}>
            COMPLETADAS ({completadas.length})
          </div>
          {completadas.slice(0,5).map(t => (
            <div key={t.id} style={{display:'flex',gap:10,padding:'8px 16px',borderBottom:'1px solid var(--border)',opacity:0.6}}>
              <div style={{width:16,height:16,borderRadius:3,background:'var(--accent)',flexShrink:0,marginTop:2}}/>
              <div style={{fontSize:13,textDecoration:'line-through'}}>{t.titulo}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
