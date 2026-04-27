// ClienteDetalle.jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function ClienteDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [cliente, setCliente]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [tabEntidad, setTabEntidad] = useState(0)

  useEffect(() => {
    api.get(`/clientes/${id}`).then(r => setCliente(r.data)).finally(()=>setLoading(false))
  }, [id])

  if (loading) return <div className="loading-center"><div className="spinner"/> Cargando...</div>
  if (!cliente) return <div style={{padding:24}}>Cliente no encontrado</div>

  const entidad = cliente.entidades?.[tabEntidad]

  return (
    <div style={{padding:24,display:'flex',flexDirection:'column',gap:20}}>
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        <button className="btn btn-sm" onClick={()=>navigate('/clientes')}>← Volver</button>
        <div>
          <h1 style={{fontSize:18,fontWeight:600}}>{cliente.nombre_completo}</h1>
          <div style={{fontSize:12,color:'var(--text-muted)'}}>{cliente.entidades?.length||0} entidades fiscales</div>
        </div>
      </div>

      {/* Tabs de entidades */}
      {cliente.entidades?.length > 0 && (
        <div style={{display:'flex',gap:8,borderBottom:'1px solid var(--border)',paddingBottom:0}}>
          {cliente.entidades.map((e,i) => (
            <button key={e.id}
              onClick={()=>setTabEntidad(i)}
              style={{
                padding:'8px 14px', border:'none', background:'none',
                borderBottom: tabEntidad===i ? '2px solid var(--navy)' : '2px solid transparent',
                color: tabEntidad===i ? 'var(--navy)' : 'var(--text-muted)',
                fontWeight: tabEntidad===i ? 600 : 400,
                cursor:'pointer', fontSize:13,
              }}
            >
              <span className={`badge badge-${e.tipo==='fisica'?'blue':'gray'}`} style={{marginRight:6}}>
                {e.tipo}
              </span>
              {e.razon_social}
            </button>
          ))}
        </div>
      )}

      {entidad && (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          {/* Info entidad */}
          <div className="card" style={{padding:16}}>
            <div style={{fontWeight:600,marginBottom:12}}>Datos fiscales</div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              <div style={{display:'flex',justifyContent:'space-between'}}>
                <span style={{color:'var(--text-muted)',fontSize:12}}>RFC</span>
                <span className="mono">{entidad.rfc}</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between'}}>
                <span style={{color:'var(--text-muted)',fontSize:12}}>Tipo</span>
                <span className={`badge badge-${entidad.tipo==='fisica'?'blue':'gray'}`}>{entidad.tipo}</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between'}}>
                <span style={{color:'var(--text-muted)',fontSize:12}}>Estatus SAT</span>
                <span className={`badge badge-${
                  entidad.estatus_sat==='al_corriente'?'green':
                  entidad.estatus_sat==='pendiente'?'amber':'red'
                }`}>{entidad.estatus_sat}</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between'}}>
                <span style={{color:'var(--text-muted)',fontSize:12}}>Régimen</span>
                <span className="mono">{entidad.regimen_fiscal||'—'}</span>
              </div>
            </div>
          </div>

          {/* Calendario fiscal */}
          <div className="card" style={{padding:16}}>
            <div style={{fontWeight:600,marginBottom:12}}>Obligaciones fiscales</div>
            {entidad.calendario?.map(c => (
              <div key={c.id} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid var(--border)'}}>
                <span style={{fontSize:12}}>{c.descripcion||c.obligacion}</span>
                <span style={{fontSize:12,color:'var(--text-muted)'}}>Día {c.dia_limite}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tareas pendientes */}
      {entidad?.tareas_pendientes?.length > 0 && (
        <div className="card">
          <div style={{padding:'10px 16px',borderBottom:'1px solid var(--border)',fontWeight:600,fontSize:13}}>
            Tareas pendientes
          </div>
          {entidad.tareas_pendientes.map(t => (
            <div key={t.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 16px',borderBottom:'1px solid var(--border)'}}>
              <div style={{width:14,height:14,borderRadius:3,border:'1.5px solid var(--gray-300)',flexShrink:0}}/>
              <div style={{flex:1,fontSize:12}}>{t.titulo}</div>
              {t.fecha_vencimiento && (
                <span style={{fontSize:11,color:'var(--text-muted)'}}>
                  {new Date(t.fecha_vencimiento).toLocaleDateString('es-MX')}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
