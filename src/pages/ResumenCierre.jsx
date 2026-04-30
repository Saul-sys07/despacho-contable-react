import { useState, useEffect, useRef } from 'react'
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
  const printRef = useRef()

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

  function imprimir() {
    window.print()
  }

  // Totales generales
  const totales = data.reduce((acc, r) => ({
    ingresos: acc.ingresos + parseFloat(r.base_ingresos || 0),
    egresos:  acc.egresos  + parseFloat(r.base_egresos  || 0),
    utilidad: acc.utilidad + parseFloat(r.utilidad_base || 0),
    iva_ing:  acc.iva_ing  + parseFloat(r.iva_ingresos  || 0),
    iva_egr:  acc.iva_egr  + parseFloat(r.iva_egresos   || 0),
  }), { ingresos: 0, egresos: 0, utilidad: 0, iva_ing: 0, iva_egr: 0 })

  return (
    <div style={{padding:24}}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { font-size: 11px; }
          .print-area { padding: 0; }
        }
      `}</style>

      {/* Controles */}
      <div className="no-print" style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20}}>
        <div>
          <h1 style={{fontSize:20, fontWeight:600}}>Resumen de cierre</h1>
          <div style={{fontSize:12, color:'var(--text-muted)'}}>Concentrado por cliente y entidad</div>
        </div>
        <div style={{display:'flex', gap:8, alignItems:'center'}}>
          <select className="input" style={{width:110}} value={filtro.mes}
            onChange={e => setFiltro(f => ({...f, mes: e.target.value}))}>
            <option value="">Todos los meses</option>
            {MESES.slice(1).map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
          <select className="input" style={{width:90}} value={filtro.anio}
            onChange={e => setFiltro(f => ({...f, anio: e.target.value}))}>
            {[2024,2025,2026].map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <button className="btn" onClick={cargar}>Filtrar</button>
          <button className="btn btn-primary" onClick={imprimir}>🖨 Imprimir</button>
        </div>
      </div>

      {/* Área imprimible */}
      <div ref={printRef} className="print-area">

        {/* Encabezado para impresión */}
        <div style={{marginBottom:16, borderBottom:'2px solid #1D3A5F', paddingBottom:12}}>
          <div style={{fontSize:18, fontWeight:700, color:'#1D3A5F'}}>Despacho Contable — Resumen de Cierre</div>
          <div style={{fontSize:13, color:'#666', marginTop:4}}>
            Periodo: {filtro.mes ? MESES[filtro.mes] : 'Todos los meses'} {filtro.anio}
          </div>
        </div>

        {/* KPIs resumen */}
        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20}}>
          <div className="card" style={{padding:'12px 16px'}}>
            <div style={{fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.04em'}}>Total ingresos base</div>
            <div style={{fontSize:22, fontWeight:600, color:'#15803D', fontFamily:'var(--mono)'}}>
              ${fmt(totales.ingresos)}
            </div>
            <div style={{fontSize:11, color:'var(--text-muted)'}}>IVA: ${fmt(totales.iva_ing)}</div>
          </div>
          <div className="card" style={{padding:'12px 16px'}}>
            <div style={{fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.04em'}}>Total egresos base</div>
            <div style={{fontSize:22, fontWeight:600, color:'var(--red)', fontFamily:'var(--mono)'}}>
              ${fmt(totales.egresos)}
            </div>
            <div style={{fontSize:11, color:'var(--text-muted)'}}>IVA: ${fmt(totales.iva_egr)}</div>
          </div>
          <div className="card" style={{padding:'12px 16px', borderLeft:`3px solid ${totales.utilidad >= 0 ? 'var(--accent)' : 'var(--red)'}`}}>
            <div style={{fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.04em'}}>Utilidad / Pérdida total</div>
            <div style={{fontSize:22, fontWeight:600, fontFamily:'var(--mono)', color: totales.utilidad >= 0 ? '#15803D' : 'var(--red)'}}>
              {totales.utilidad >= 0 ? '+' : ''}${fmt(totales.utilidad)}
            </div>
            <div style={{fontSize:11, color:'var(--text-muted)'}}>Base para ISR consolidado</div>
          </div>
        </div>

        {/* Tabla detalle */}
        {loading ? (
          <div className="loading-center"><div className="spinner"/> Cargando...</div>
        ) : (
          <div className="card table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>RFC</th>
                  <th>Tipo</th>
                  <th style={{textAlign:'right'}}>CFDIs Ing.</th>
                  <th style={{textAlign:'right'}}>Base Ingresos</th>
                  <th style={{textAlign:'right'}}>IVA Ing.</th>
                  <th style={{textAlign:'right'}}>CFDIs Egr.</th>
                  <th style={{textAlign:'right'}}>Base Egresos</th>
                  <th style={{textAlign:'right'}}>IVA Egr.</th>
                  <th style={{textAlign:'right'}}>Utilidad / Pérdida</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r, i) => {
                  const util = parseFloat(r.utilidad_base || 0)
                  return (
                    <tr key={i}>
                      <td style={{fontWeight:500, fontSize:12}}>{r.nombre_completo}</td>
                      <td style={{fontFamily:'var(--mono)', fontSize:11}}>{r.rfc}</td>
                      <td>
                        <span className={`badge badge-${r.tipo==='fisica'?'blue':'gray'}`}>{r.tipo}</span>
                      </td>
                      <td style={{textAlign:'right', fontSize:12}}>{r.num_ingresos}</td>
                      <td style={{textAlign:'right', fontFamily:'var(--mono)', fontSize:12, color:'#15803D'}}>
                        ${fmt(r.base_ingresos)}
                      </td>
                      <td style={{textAlign:'right', fontFamily:'var(--mono)', fontSize:11, color:'var(--text-muted)'}}>
                        ${fmt(r.iva_ingresos)}
                      </td>
                      <td style={{textAlign:'right', fontSize:12}}>{r.num_egresos}</td>
                      <td style={{textAlign:'right', fontFamily:'var(--mono)', fontSize:12, color:'var(--red)'}}>
                        ${fmt(r.base_egresos)}
                      </td>
                      <td style={{textAlign:'right', fontFamily:'var(--mono)', fontSize:11, color:'var(--text-muted)'}}>
                        ${fmt(r.iva_egresos)}
                      </td>
                      <td style={{textAlign:'right', fontFamily:'var(--mono)', fontSize:12, fontWeight:600,
                        color: util >= 0 ? '#15803D' : 'var(--red)'}}>
                        {util >= 0 ? '+' : ''}${fmt(util)}
                      </td>
                    </tr>
                  )
                })}

                {/* Fila de totales */}
                <tr style={{background:'#F8F9FA', fontWeight:700}}>
                  <td colSpan={3} style={{fontWeight:700}}>TOTAL GENERAL</td>
                  <td style={{textAlign:'right'}}>{data.reduce((a,r)=>a+parseInt(r.num_ingresos||0),0)}</td>
                  <td style={{textAlign:'right', fontFamily:'var(--mono)', color:'#15803D'}}>${fmt(totales.ingresos)}</td>
                  <td style={{textAlign:'right', fontFamily:'var(--mono)', color:'var(--text-muted)', fontSize:11}}>${fmt(totales.iva_ing)}</td>
                  <td style={{textAlign:'right'}}>{data.reduce((a,r)=>a+parseInt(r.num_egresos||0),0)}</td>
                  <td style={{textAlign:'right', fontFamily:'var(--mono)', color:'var(--red)'}}>${fmt(totales.egresos)}</td>
                  <td style={{textAlign:'right', fontFamily:'var(--mono)', color:'var(--text-muted)', fontSize:11}}>${fmt(totales.iva_egr)}</td>
                  <td style={{textAlign:'right', fontFamily:'var(--mono)',
                    color: totales.utilidad >= 0 ? '#15803D' : 'var(--red)'}}>
                    {totales.utilidad >= 0 ? '+' : ''}${fmt(totales.utilidad)}
                  </td>
                </tr>

                {!data.length && (
                  <tr><td colSpan={10} style={{textAlign:'center', color:'var(--text-muted)', padding:24}}>
                    Sin datos para este periodo
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
