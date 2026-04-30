import { useState, useEffect } from 'react'
import api from '../services/api'

const MESES = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio',
               'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function fmt(n) {
  return parseFloat(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })
}

export default function ResumenCierre() {
  const [data,    setData]    = useState([])
  const [loading, setLoading] = useState(false)
  const [filtro,  setFiltro]  = useState({ anio: new Date().getFullYear(), mes: new Date().getMonth() + 1 })

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtro.anio) params.append('anio', filtro.anio)
      if (filtro.mes)  params.append('mes',  filtro.mes)
      const { data } = await api.get(`/dashboard/resumen-cierre?${params}`)
      setData(data)
    } finally {
      setLoading(false)
    }
  }

  const totales = data.reduce((acc, r) => ({
    ingresos: acc.ingresos + parseFloat(r.base_ingresos || 0),
    egresos:  acc.egresos  + parseFloat(r.base_egresos  || 0),
    utilidad: acc.utilidad + parseFloat(r.utilidad_base || 0),
  }), { ingresos: 0, egresos: 0, utilidad: 0 })

  return (
    <div style={{padding:24}}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          @page { size: landscape; margin: 1.5cm; }
          body { font-size: 10px; }
          th, td { padding: 5px 8px !important; }
          .card { box-shadow: none !important; border: 1px solid #ddd !important; }
        }
      `}</style>

      {/* Controles */}
      <div className="no-print" style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20}}>
        <div>
          <h1 style={{fontSize:20, fontWeight:600}}>Resumen de cierre</h1>
          <div style={{fontSize:12, color:'var(--text-muted)'}}>Concentrado por cliente</div>
        </div>
        <div style={{display:'flex', gap:8, alignItems:'center'}}>
          <select className="input" style={{width:120}} value={filtro.mes}
            onChange={e => setFiltro(f => ({...f, mes: e.target.value}))}>
            <option value="">Todos los meses</option>
            {MESES.slice(1).map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
          <select className="input" style={{width:90}} value={filtro.anio}
            onChange={e => setFiltro(f => ({...f, anio: e.target.value}))}>
            {[2024,2025,2026].map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <button className="btn" onClick={cargar}>Filtrar</button>
          <button className="btn btn-primary" onClick={() => window.print()}>🖨 Imprimir</button>
        </div>
      </div>

      {/* Encabezado imprimible */}
      <div style={{marginBottom:16, borderBottom:'2px solid #1D3A5F', paddingBottom:10}}>
        <div style={{fontSize:17, fontWeight:700, color:'#1D3A5F'}}>Despacho Contable — Resumen de Cierre</div>
        <div style={{fontSize:12, color:'#666', marginTop:3}}>
          Periodo: {filtro.mes ? MESES[filtro.mes] : 'Todos los meses'} {filtro.anio}
        </div>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="loading-center"><div className="spinner"/> Cargando...</div>
      ) : (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Cliente</th>
                <th>RFC</th>
                <th>Tipo</th>
                <th style={{textAlign:'right'}}>Base Ingresos</th>
                <th style={{textAlign:'right'}}>Base Egresos</th>
                <th style={{textAlign:'right'}}>Utilidad / Pérdida</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r, i) => {
                const util = parseFloat(r.utilidad_base || 0)
                return (
                  <tr key={i}>
                    <td style={{color:'var(--text-muted)', fontSize:11}}>{i + 1}</td>
                    <td style={{fontWeight:500}}>{r.nombre_completo}</td>
                    <td style={{fontFamily:'var(--mono)', fontSize:11}}>{r.rfc}</td>
                    <td>
                      <span className={`badge badge-${r.tipo==='fisica'?'blue':'gray'}`}>{r.tipo}</span>
                    </td>
                    <td style={{textAlign:'right', fontFamily:'var(--mono)', color:'#15803D', fontWeight:500}}>
                      ${fmt(r.base_ingresos)}
                    </td>
                    <td style={{textAlign:'right', fontFamily:'var(--mono)', color:'var(--red)', fontWeight:500}}>
                      ${fmt(r.base_egresos)}
                    </td>
                    <td style={{textAlign:'right', fontFamily:'var(--mono)', fontWeight:700,
                      color: util >= 0 ? '#15803D' : 'var(--red)'}}>
                      {util >= 0 ? '+' : ''}${fmt(util)}
                    </td>
                  </tr>
                )
              })}

              {/* Totales */}
              <tr style={{background:'#F8F9FA', borderTop:'2px solid #1D3A5F'}}>
                <td colSpan={4} style={{fontWeight:700, fontSize:13}}>TOTAL GENERAL</td>
                <td style={{textAlign:'right', fontFamily:'var(--mono)', fontWeight:700, color:'#15803D', fontSize:13}}>
                  ${fmt(totales.ingresos)}
                </td>
                <td style={{textAlign:'right', fontFamily:'var(--mono)', fontWeight:700, color:'var(--red)', fontSize:13}}>
                  ${fmt(totales.egresos)}
                </td>
                <td style={{textAlign:'right', fontFamily:'var(--mono)', fontWeight:700, fontSize:13,
                  color: totales.utilidad >= 0 ? '#15803D' : 'var(--red)'}}>
                  {totales.utilidad >= 0 ? '+' : ''}${fmt(totales.utilidad)}
                </td>
              </tr>

              {!data.length && (
                <tr>
                  <td colSpan={7} style={{textAlign:'center', color:'var(--text-muted)', padding:32}}>
                    Sin datos para este periodo
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}