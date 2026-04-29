import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import './ClienteDetalle.css'

const TIPOS_DOC = [
  { value: 'opinion_cumplimiento', label: 'Opinión de cumplimiento' },
  { value: 'declaracion_isr',      label: 'Declaración ISR' },
  { value: 'declaracion_iva',      label: 'Declaración IVA' },
  { value: 'suas',                 label: 'SUAS' },
  { value: 'contrato',             label: 'Contrato / Poder' },
  { value: 'acuse',                label: 'Acuse' },
  { value: 'otro',                 label: 'Otro' },
]

const MESES = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio',
               'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export default function ClienteDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [cliente,       setCliente]       = useState(null)
  const [loading,       setLoading]       = useState(true)
  const [tabEntidad,    setTabEntidad]    = useState(0)
  const [tab,           setTab]           = useState('archivero')
  const [documentos,    setDocumentos]    = useState([])
  const [cfdis,         setCfdis]         = useState(null)
  const [desglose,      setDesglose]      = useState(null)
  const [modalDoc,      setModalDoc]      = useState(false)
  const [modalEnt,      setModalEnt]      = useState(false)
  const [modalCfdi,     setModalCfdi]     = useState(false)
  const [formDoc,       setFormDoc]       = useState({ tipo_doc:'opinion_cumplimiento', mes:'', anio: new Date().getFullYear(), notas:'' })
  const [formEnt,       setFormEnt]       = useState({ tipo:'fisica', razon_social:'', rfc:'', regimen_fiscal:'' })
  const [archivos,      setArchivos]      = useState([])
  const [xmlsIng,       setXmlsIng]       = useState([])
  const [xmlsEgr,       setXmlsEgr]       = useState([])
  const [guardando,     setGuardando]     = useState(false)
  const [filtroPeriodo, setFiltroPeriodo] = useState({ anio: new Date().getFullYear(), mes: '' })

  useEffect(() => { cargarCliente() }, [id])

  async function cargarCliente() {
    setLoading(true)
    try {
      const { data } = await api.get(`/clientes/${id}`)
      setCliente(data)
      if (data.entidades?.length > 0) {
        cargarDocumentos(data.entidades[0].id)
        cargarCfdis(data.entidades[0].id)
      }
    } finally {
      setLoading(false)
    }
  }

  async function cargarDocumentos(entidad_id) {
    const params = new URLSearchParams({ entidad_id })
    if (filtroPeriodo.anio) params.append('anio', filtroPeriodo.anio)
    if (filtroPeriodo.mes)  params.append('mes',  filtroPeriodo.mes)
    const { data } = await api.get(`/documentos?${params}`)
    setDocumentos(data)
  }

  async function cargarCfdis(entidad_id) {
    const params = new URLSearchParams()
    if (filtroPeriodo.anio) params.append('anio', filtroPeriodo.anio)
    if (filtroPeriodo.mes)  params.append('mes',  filtroPeriodo.mes)
    const [resumen, des] = await Promise.all([
      api.get(`/cfdi/resumen/${entidad_id}?${params}`),
      api.get(`/cfdi/desglose/${entidad_id}?${params}`),
    ])
    setCfdis(resumen.data)
    setDesglose(des.data)
  }

  function cambiarEntidad(idx) {
    setTabEntidad(idx)
    const eid = cliente.entidades[idx].id
    cargarDocumentos(eid)
    cargarCfdis(eid)
  }

  async function guardarEntidad(e) {
    e.preventDefault()
    setGuardando(true)
    try {
      await api.post('/entidades', { ...formEnt, cliente_id: id })
      setModalEnt(false)
      setFormEnt({ tipo:'fisica', razon_social:'', rfc:'', regimen_fiscal:'' })
      cargarCliente()
    } catch(err) {
      alert(err.response?.data?.detail || 'Error al guardar')
    } finally {
      setGuardando(false)
    }
  }

  async function subirDocumento(e) {
    e.preventDefault()
    if (!archivos.length) return alert('Selecciona al menos un archivo')
    setGuardando(true)
    try {
      const entidad_id = cliente.entidades[tabEntidad].id
      for (const archivo of archivos) {
        await api.post('/documentos', {
          entidad_id,
          tipo_doc:       formDoc.tipo_doc,
          mes:            formDoc.mes ? parseInt(formDoc.mes) : null,
          anio:           formDoc.anio ? parseInt(formDoc.anio) : null,
          nombre_archivo: archivo.name,
          storage_url:    `pendiente/${archivo.name}`,
          tamano_bytes:   archivo.size,
          notas:          formDoc.notas,
        })
      }
      setModalDoc(false)
      setArchivos([])
      setFormDoc({ tipo_doc:'opinion_cumplimiento', mes:'', anio: new Date().getFullYear(), notas:'' })
      cargarDocumentos(entidad_id)
    } catch(err) {
      alert(err.response?.data?.detail || 'Error al subir')
    } finally {
      setGuardando(false)
    }
  }

  async function procesarCfdis(e) {
    e.preventDefault()
    if (!xmlsIng.length && !xmlsEgr.length) return alert('Selecciona al menos un archivo XML')
    setGuardando(true)
    try {
      const entidad_id = cliente.entidades[tabEntidad].id
      if (xmlsIng.length > 0) {
        const fd = new FormData()
        fd.append('entidad_id', entidad_id)
        fd.append('clasificacion', 'ingreso')
        for (const f of xmlsIng) fd.append('xmls', f)
        const { data } = await api.post('/cfdi/procesar', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        alert(`Ingresos: ${data.procesados} procesados, ${data.duplicados} duplicados`)
      }
      if (xmlsEgr.length > 0) {
        const fd2 = new FormData()
        fd2.append('entidad_id', entidad_id)
        fd2.append('clasificacion', 'egreso')
        for (const f of xmlsEgr) fd2.append('xmls', f)
        const { data } = await api.post('/cfdi/procesar', fd2, { headers: { 'Content-Type': 'multipart/form-data' } })
        alert(`Egresos: ${data.procesados} procesados, ${data.duplicados} duplicados`)
      }
      setModalCfdi(false)
      setXmlsIng([])
      setXmlsEgr([])
      cargarCfdis(entidad_id)
    } catch(err) {
      alert(err.response?.data?.detail || 'Error al procesar')
    } finally {
      setGuardando(false)
    }
  }

  function TablaDesglose({ titulo, color, filas }) {
    return (
      <div className="card">
        <div style={{padding:'10px 16px', borderBottom:'1px solid var(--border)', fontWeight:600, fontSize:13, color}}>
          {titulo}
        </div>
        <table>
          <thead>
            <tr>
              <th>RFC / Nombre</th>
              <th style={{textAlign:'right'}}>Fact.</th>
              <th style={{textAlign:'right'}}>IVA</th>
              <th style={{textAlign:'right'}}>Base</th>
              <th style={{textAlign:'right'}}>IVA $</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((r, i) => {
              const tasa = Number(r.tasa_iva)
              return (
                <tr key={i}>
                  <td>
                    <div style={{fontFamily:'var(--mono)', fontSize:11}}>{r.rfc}</div>
                    <div style={{fontSize:11, color:'var(--text-muted)'}}>{r.nombre || '—'}</div>
                  </td>
                  <td style={{textAlign:'right', fontSize:12}}>{r.num_facturas}</td>
                  <td style={{textAlign:'right'}}>
                    <span className={`badge badge-${tasa===16?'blue':tasa===8?'amber':'gray'}`}>
                      {tasa}%
                    </span>
                  </td>
                  <td style={{textAlign:'right', fontFamily:'var(--mono)', fontSize:12}}>
                    ${parseFloat(r.base).toLocaleString('es-MX', {minimumFractionDigits:2})}
                  </td>
                  <td style={{textAlign:'right', fontFamily:'var(--mono)', fontSize:12}}>
                    ${parseFloat(r.iva).toLocaleString('es-MX', {minimumFractionDigits:2})}
                  </td>
                </tr>
              )
            })}
            {!filas.length && (
              <tr><td colSpan={5} style={{textAlign:'center', color:'var(--text-muted)', fontSize:12, padding:12}}>Sin registros</td></tr>
            )}
          </tbody>
        </table>
      </div>
    )
  }

  if (loading) return <div className="loading-center"><div className="spinner"/> Cargando...</div>
  if (!cliente) return <div style={{padding:24}}>Cliente no encontrado</div>

  const entidad = cliente.entidades?.[tabEntidad]

  const docsPorMes = {}
  documentos.forEach(d => {
    const key = `${d.anio}-${String(d.mes||0).padStart(2,'0')}`
    if (!docsPorMes[key]) docsPorMes[key] = { anio: d.anio, mes: d.mes, docs: [] }
    docsPorMes[key].docs.push(d)
  })
  const mesesOrdenados = Object.keys(docsPorMes).sort().reverse()

  return (
    <div className="detalle-page">

      {/* HEADER */}
      <div className="detalle-header card">
        <div style={{display:'flex', alignItems:'center', gap:12}}>
          <button className="btn btn-sm" onClick={() => navigate('/clientes')}>← Volver</button>
          <div className="detalle-avatar">
            {cliente.nombre_completo.split(' ').map(w=>w[0]).slice(0,2).join('')}
          </div>
          <div>
            <h1 className="detalle-nombre">{cliente.nombre_completo}</h1>
            <div className="detalle-sub">
              {cliente.entidades?.length || 0} entidades · {cliente.telefono || ''} {cliente.email ? `· ${cliente.email}` : ''}
            </div>
          </div>
        </div>
        <div style={{display:'flex', gap:8}}>
          {cliente.portal_activo
            ? <span className="badge badge-green">Portal activo</span>
            : <span className="badge badge-gray">Sin portal</span>}
          <button className="btn btn-sm" onClick={() => setModalEnt(true)}>+ Entidad</button>
        </div>
      </div>

      {/* TABS ENTIDADES */}
      {cliente.entidades?.length > 0 && (
        <div className="entidad-tabs">
          {cliente.entidades.map((e, i) => (
            <button key={e.id}
              className={`entidad-tab${tabEntidad === i ? ' active' : ''}`}
              onClick={() => cambiarEntidad(i)}
            >
              <span className={`badge badge-${e.tipo === 'fisica' ? 'blue' : 'gray'}`}>{e.tipo}</span>
              {e.razon_social}
              <span className="mono" style={{fontSize:11, color:'var(--text-muted)', marginLeft:4}}>{e.rfc}</span>
            </button>
          ))}
          <div style={{marginLeft:'auto', display:'flex', alignItems:'center', gap:8, paddingRight:16}}>
            <span className={`badge badge-${entidad?.estatus_sat==='al_corriente'?'green':entidad?.estatus_sat==='pendiente'?'amber':'red'}`}>
              SAT: {entidad?.estatus_sat || 'no verificado'}
            </span>
          </div>
        </div>
      )}

      {!cliente.entidades?.length && (
        <div className="card" style={{padding:24, textAlign:'center', color:'var(--text-muted)'}}>
          Sin entidades registradas.
          <button className="btn btn-primary" style={{marginLeft:12}} onClick={() => setModalEnt(true)}>
            + Agregar entidad
          </button>
        </div>
      )}

      {entidad && (
        <>
          {/* FILTRO + TABS CONTENIDO */}
          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
            <div className="content-tabs">
              {['archivero','cfdi','info'].map(t => (
                <button key={t} className={`content-tab${tab===t?' active':''}`} onClick={() => setTab(t)}>
                  {t==='archivero' ? '🗂 Archivero' : t==='cfdi' ? '📊 CFDIs / Utilidad' : '📋 Info fiscal'}
                </button>
              ))}
            </div>
            <div style={{display:'flex', gap:8, alignItems:'center'}}>
              <select className="input" style={{width:80}} value={filtroPeriodo.mes}
                onChange={e => setFiltroPeriodo(p => ({...p, mes: e.target.value}))}>
                <option value="">Todos</option>
                {MESES.slice(1).map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}
              </select>
              <select className="input" style={{width:90}} value={filtroPeriodo.anio}
                onChange={e => setFiltroPeriodo(p => ({...p, anio: e.target.value}))}>
                {[2024,2025,2026].map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <button className="btn btn-sm" onClick={() => { cargarDocumentos(entidad.id); cargarCfdis(entidad.id) }}>
                Filtrar
              </button>
            </div>
          </div>

          {/* ARCHIVERO */}
          {tab === 'archivero' && (
            <div>
              <div style={{display:'flex', justifyContent:'flex-end', marginBottom:12}}>
                <button className="btn btn-primary" onClick={() => setModalDoc(true)}>+ Registrar documento</button>
              </div>
              {mesesOrdenados.length === 0 && (
                <div className="card" style={{padding:32, textAlign:'center', color:'var(--text-muted)'}}>
                  Sin documentos registrados para este periodo
                </div>
              )}
              {mesesOrdenados.map(key => {
                const grupo = docsPorMes[key]
                return (
                  <div key={key} className="card mes-grupo">
                    <div className="mes-header">
                      <span className="mes-label">{grupo.mes ? MESES[grupo.mes] : 'Sin mes'} {grupo.anio || ''}</span>
                      <span style={{fontSize:11, color:'var(--text-muted)'}}>{grupo.docs.length} documento{grupo.docs.length!==1?'s':''}</span>
                    </div>
                    <div className="docs-lista">
                      {grupo.docs.map(d => (
                        <div key={d.id} className="doc-row">
                          <div className="doc-icon">📄</div>
                          <div className="doc-info">
                            <div className="doc-nombre">{d.nombre_archivo}</div>
                            <div className="doc-meta">
                              {TIPOS_DOC.find(t => t.value===d.tipo_doc)?.label || d.tipo_doc}
                              {d.subido_por_nombre && ` · ${d.subido_por_nombre}`}
                            </div>
                          </div>
                          <span className={`badge badge-${d.estatus==='subido'?'blue':'green'}`}>{d.estatus}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* CFDIs */}
          {tab === 'cfdi' && (
            <div style={{display:'flex', flexDirection:'column', gap:16}}>
              <div style={{display:'flex', justifyContent:'flex-end'}}>
                <button className="btn btn-primary" onClick={() => setModalCfdi(true)}>+ Cargar XMLs del SAT</button>
              </div>
              {cfdis && (
                <div className="cfdi-resumen">
                  <div className="card cfdi-card">
                    <div className="cfdi-label">Ingresos base (sin IVA)</div>
                    <div className="cfdi-valor cfdi-ing">${cfdis.ingresos.base.toLocaleString('es-MX',{minimumFractionDigits:2})}</div>
                    <div className="cfdi-sub">{cfdis.ingresos.cantidad} CFDIs · IVA ${cfdis.ingresos.iva.toLocaleString('es-MX',{minimumFractionDigits:2})}</div>
                  </div>
                  <div className="card cfdi-card">
                    <div className="cfdi-label">Egresos base (sin IVA)</div>
                    <div className="cfdi-valor cfdi-egr">${cfdis.egresos.base.toLocaleString('es-MX',{minimumFractionDigits:2})}</div>
                    <div className="cfdi-sub">{cfdis.egresos.cantidad} CFDIs · IVA ${cfdis.egresos.iva.toLocaleString('es-MX',{minimumFractionDigits:2})}</div>
                  </div>
                  <div className={`card cfdi-card ${cfdis.utilidad_base>=0?'cfdi-util-pos':'cfdi-util-neg'}`}>
                    <div className="cfdi-label">Utilidad / Pérdida base</div>
                    <div className={`cfdi-valor ${cfdis.utilidad_base>=0?'cfdi-ing':'cfdi-egr'}`}>
                      {cfdis.utilidad_base>=0?'+':''}${cfdis.utilidad_base.toLocaleString('es-MX',{minimumFractionDigits:2})}
                    </div>
                    <div className="cfdi-sub">Base para cálculo ISR</div>
                  </div>
                </div>
              )}
              {desglose && (
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14}}>
                  <TablaDesglose titulo="📥 Ingresos por cliente"  color="#15803D" filas={desglose.ingresos} />
                  <TablaDesglose titulo="📤 Egresos por proveedor" color="var(--red)" filas={desglose.egresos} />
                </div>
              )}
            </div>
          )}

          {/* INFO FISCAL */}
          {tab === 'info' && (
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
              <div className="card" style={{padding:16}}>
                <div style={{fontWeight:600, marginBottom:12}}>Datos fiscales</div>
                <div className="info-rows">
                  <div className="info-row"><span>RFC</span><span className="mono">{entidad.rfc}</span></div>
                  <div className="info-row"><span>Tipo</span><span className={`badge badge-${entidad.tipo==='fisica'?'blue':'gray'}`}>{entidad.tipo}</span></div>
                  <div className="info-row"><span>Régimen</span><span className="mono">{entidad.regimen_fiscal||'—'}</span></div>
                  <div className="info-row">
                    <span>Estatus SAT</span>
                    <span className={`badge badge-${entidad.estatus_sat==='al_corriente'?'green':entidad.estatus_sat==='pendiente'?'amber':'red'}`}>
                      {entidad.estatus_sat}
                    </span>
                  </div>
                </div>
              </div>
              <div className="card" style={{padding:16}}>
                <div style={{fontWeight:600, marginBottom:12}}>Obligaciones fiscales</div>
                {entidad.calendario?.map(c => (
                  <div key={c.id} className="info-row" style={{padding:'6px 0', borderBottom:'1px solid var(--border)'}}>
                    <span style={{fontSize:12}}>{c.descripcion||c.obligacion}</span>
                    <span style={{fontSize:12, color:'var(--text-muted)'}}>Día {c.dia_limite}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL NUEVA ENTIDAD */}
      {modalEnt && (
        <div className="modal-overlay" onClick={() => setModalEnt(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <span>Nueva entidad fiscal</span>
              <button className="modal-close" onClick={() => setModalEnt(false)}>✕</button>
            </div>
            <form onSubmit={guardarEntidad} className="modal-body">
              <div className="field">
                <label>Tipo *</label>
                <select className="input" value={formEnt.tipo} onChange={e => setFormEnt({...formEnt, tipo:e.target.value})}>
                  <option value="fisica">Persona física</option>
                  <option value="moral">Persona moral</option>
                </select>
              </div>
              <div className="field">
                <label>Razón social *</label>
                <input className="input" required placeholder="Ej. Sistemas en Grabación SA de CV"
                  value={formEnt.razon_social} onChange={e => setFormEnt({...formEnt, razon_social:e.target.value})}/>
              </div>
              <div className="field">
                <label>RFC *</label>
                <input className="input" required placeholder="Ej. SEGR950101ABC"
                  value={formEnt.rfc} onChange={e => setFormEnt({...formEnt, rfc:e.target.value.toUpperCase()})}/>
              </div>
              <div className="field">
                <label>Régimen fiscal</label>
                <input className="input" placeholder="Ej. 612, 601..."
                  value={formEnt.regimen_fiscal} onChange={e => setFormEnt({...formEnt, regimen_fiscal:e.target.value})}/>
              </div>
              <div style={{display:'flex', gap:8, justifyContent:'flex-end'}}>
                <button type="button" className="btn" onClick={() => setModalEnt(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={guardando}>
                  {guardando ? 'Guardando...' : 'Guardar entidad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR DOCUMENTO */}
      {modalDoc && (
        <div className="modal-overlay" onClick={() => setModalDoc(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <span>Registrar documento</span>
              <button className="modal-close" onClick={() => setModalDoc(false)}>✕</button>
            </div>
            <form onSubmit={subirDocumento} className="modal-body">
              <div className="field">
                <label>Tipo de documento *</label>
                <select className="input" value={formDoc.tipo_doc} onChange={e => setFormDoc({...formDoc, tipo_doc:e.target.value})}>
                  {TIPOS_DOC.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                <div className="field">
                  <label>Mes</label>
                  <select className="input" value={formDoc.mes} onChange={e => setFormDoc({...formDoc, mes:e.target.value})}>
                    <option value="">Sin mes</option>
                    {MESES.slice(1).map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Año</label>
                  <input className="input" type="number" value={formDoc.anio}
                    onChange={e => setFormDoc({...formDoc, anio:e.target.value})}/>
                </div>
              </div>
              <div className="field">
                <label>Archivo(s) *</label>
                <input type="file" multiple onChange={e => setArchivos(Array.from(e.target.files))} style={{fontSize:13}}/>
                {archivos.length > 0 && (
                  <div style={{fontSize:11, color:'var(--text-muted)', marginTop:4}}>
                    {archivos.length} archivo{archivos.length!==1?'s':''} seleccionado{archivos.length!==1?'s':''}
                  </div>
                )}
              </div>
              <div className="field">
                <label>Notas</label>
                <input className="input" placeholder="Opcional..." value={formDoc.notas}
                  onChange={e => setFormDoc({...formDoc, notas:e.target.value})}/>
              </div>
              <div style={{display:'flex', gap:8, justifyContent:'flex-end'}}>
                <button type="button" className="btn" onClick={() => setModalDoc(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={guardando}>
                  {guardando ? 'Registrando...' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CARGAR XMLs */}
      {modalCfdi && (
        <div className="modal-overlay" onClick={() => setModalCfdi(false)}>
          <div className="modal-box modal-box-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <span>Cargar XMLs del SAT</span>
              <button className="modal-close" onClick={() => setModalCfdi(false)}>✕</button>
            </div>
            <form onSubmit={procesarCfdis} className="modal-body">
              <div className="cfdi-upload-grid">
                <div className="cfdi-upload-zone">
                  <div className="cfdi-upload-label ing">📥 XMLs de INGRESOS</div>
                  <div style={{fontSize:11, color:'var(--text-muted)', marginBottom:8}}>Facturas emitidas por el cliente</div>
                  <input type="file" multiple accept=".xml" onChange={e => setXmlsIng(Array.from(e.target.files))}/>
                  {xmlsIng.length > 0 && <div style={{fontSize:11, color:'var(--accent)', marginTop:6}}>✓ {xmlsIng.length} archivo{xmlsIng.length!==1?'s':''} listos</div>}
                </div>
                <div className="cfdi-upload-zone">
                  <div className="cfdi-upload-label egr">📤 XMLs de EGRESOS</div>
                  <div style={{fontSize:11, color:'var(--text-muted)', marginBottom:8}}>Facturas recibidas por el cliente</div>
                  <input type="file" multiple accept=".xml" onChange={e => setXmlsEgr(Array.from(e.target.files))}/>
                  {xmlsEgr.length > 0 && <div style={{fontSize:11, color:'var(--accent)', marginTop:6}}>✓ {xmlsEgr.length} archivo{xmlsEgr.length!==1?'s':''} listos</div>}
                </div>
              </div>
              <div style={{display:'flex', gap:8, justifyContent:'flex-end', marginTop:8}}>
                <button type="button" className="btn" onClick={() => setModalCfdi(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={guardando}>
                  {guardando ? 'Procesando...' : 'Procesar XMLs'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}