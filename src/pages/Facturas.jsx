import { useState, useEffect } from 'react'
import api from '../services/api'

const MESES = ['','Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

export default function Facturas() {
  const [facturas, setFacturas] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    api.get('/facturas/').then(r => setFacturas(r.data)).finally(()=>setLoading(false))
  }, [])

  const total_pendiente = facturas
    .filter(f => f.estatus === 'enviada')
    .reduce((s,f) => s + parseFloat(f.total), 0)

  if (loading) return <div className="loading-center"><div className="spinner"/> Cargando...</div>

  return (
    <div style={{padding:24,display:'flex',flexDirection:'column',gap:20}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <h1 style={{fontSize:20,fontWeight:600}}>Facturación</h1>
          {total_pendiente > 0 && (
            <div style={{fontSize:12,color:'var(--text-muted)',marginTop:2}}>
              Por cobrar: <strong>${total_pendiente.toLocaleString('es-MX',{minimumFractionDigits:2})}</strong>
            </div>
          )}
        </div>
        <button className="btn btn-primary">+ Nueva factura</button>
      </div>

      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Concepto</th>
              <th>Periodo</th>
              <th>Total</th>
              <th>Estatus</th>
              <th>Vencimiento</th>
            </tr>
          </thead>
          <tbody>
            {facturas.map(f => (
              <tr key={f.id}>
                <td style={{fontWeight:500}}>{f.nombre_completo}</td>
                <td style={{color:'var(--text-muted)'}}>{f.concepto}</td>
                <td>{f.mes_servicio ? `${MESES[f.mes_servicio]} ${f.anio_servicio}` : '—'}</td>
                <td style={{fontFamily:'var(--mono)',fontWeight:500}}>
                  ${parseFloat(f.total).toLocaleString('es-MX',{minimumFractionDigits:2})}
                </td>
                <td>
                  <span className={`badge badge-${
                    f.estatus==='pagada'?'green':
                    f.estatus==='vencida'?'red':
                    f.estatus==='enviada'?'amber':'gray'
                  }`}>{f.estatus}</span>
                </td>
                <td style={{fontSize:12,color:'var(--text-muted)'}}>
                  {f.fecha_vencimiento ? new Date(f.fecha_vencimiento).toLocaleDateString('es-MX') : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!facturas.length && <div className="empty-state">Sin facturas aún</div>}
      </div>
    </div>
  )
}
