import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import './Dashboard.css'

const MESES = ['','Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function KPI({ label, valor, badge, badgeType = 'blue' }) {
  return (
    <div className="kpi-card card">
      <div className="kpi-label">{label}</div>
      <div className="kpi-valor">{valor}</div>
      {badge && <span className={`badge badge-${badgeType}`}>{badge}</span>}
    </div>
  )
}

function diasRestantes(fechaStr) {
  if (!fechaStr) return null
  const diff = Math.ceil((new Date(fechaStr) - new Date()) / 86400000)
  return diff
}

export default function Dashboard() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const hoy = new Date()

  useEffect(() => {
    api.get('/dashboard')
      .then(r => setData(r.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="loading-center">
      <div className="spinner" /> Cargando panel...
    </div>
  )

  const { kpis, tareas_proximas, clientes_recientes, actividad_reciente } = data || {}

  return (
    <div className="dashboard">
      {/* Topbar */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Panel general</h1>
          <div className="page-sub">
            {hoy.toLocaleDateString('es-MX', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/clientes')}>
          + Nuevo cliente
        </button>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        <KPI
          label="Clientes activos"
          valor={kpis?.total_clientes ?? 0}
          badge="+0 este mes"
          badgeType="blue"
        />
        <KPI
          label="Documentos en nube"
          valor={kpis?.total_documentos ?? 0}
          badge="PDFs y anexos"
          badgeType="gray"
        />
        <KPI
          label="Tareas pendientes"
          valor={kpis?.tareas_pendientes ?? 0}
          badge={kpis?.tareas_pendientes > 0 ? 'Requieren atención' : 'Al día'}
          badgeType={kpis?.tareas_pendientes > 0 ? 'amber' : 'green'}
        />
        <KPI
          label="Por cobrar"
          valor={`$${(kpis?.por_cobrar ?? 0).toLocaleString('es-MX', {minimumFractionDigits:2})}`}
          badge={kpis?.facturas_vencidas > 0 ? `${kpis.facturas_vencidas} vencidas` : 'Al corriente'}
          badgeType={kpis?.facturas_vencidas > 0 ? 'red' : 'green'}
        />
      </div>

      {/* Dos columnas */}
      <div className="dash-cols">
        {/* Clientes recientes */}
        <div className="card">
          <div className="card-head">
            <span className="card-title">Clientes recientes</span>
            <button className="btn btn-sm" onClick={() => navigate('/clientes')}>Ver todos →</button>
          </div>
          <div>
            {(clientes_recientes || []).map(c => (
              <div key={c.id} className="client-row" onClick={() => navigate(`/clientes/${c.id}`)}>
                <div className="client-avatar">
                  {c.nombre_completo.split(' ').map(w=>w[0]).slice(0,2).join('')}
                </div>
                <div className="client-info">
                  <div className="client-name">{c.nombre_completo}</div>
                  <div className="client-rfcs mono">{c.rfcs || '—'}</div>
                </div>
                {c.portal_activo
                  ? <span className="badge badge-green">Portal activo</span>
                  : <span className="badge badge-gray">Sin portal</span>
                }
              </div>
            ))}
            {!clientes_recientes?.length && (
              <div className="empty-state">Sin clientes aún</div>
            )}
          </div>
        </div>

        {/* Tareas próximas + Actividad */}
        <div className="dash-right">
          <div className="card">
            <div className="card-head">
              <span className="card-title">Tareas próximas</span>
              <button className="btn btn-sm" onClick={() => navigate('/tareas')}>Ver todas →</button>
            </div>
            {(tareas_proximas || []).map(t => {
              const dias = diasRestantes(t.fecha_vencimiento)
              return (
                <div key={t.id} className="tarea-row">
                  <div className="tarea-check" />
                  <div className="tarea-info">
                    <div className="tarea-titulo">{t.titulo}</div>
                    <div className="tarea-meta">
                      {t.razon_social || t.nombre_completo || ''}
                      {t.tipo_entidad && <span className={`badge badge-${t.tipo_entidad==='fisica'?'blue':'gray'} ml4`}>{t.tipo_entidad}</span>}
                    </div>
                  </div>
                  <span className={`badge badge-${dias<=0?'red':dias<=2?'amber':'blue'}`}>
                    {dias<=0 ? 'Hoy' : dias===1 ? 'Mañana' : `${dias}d`}
                  </span>
                </div>
              )
            })}
            {!tareas_proximas?.length && (
              <div className="empty-state">Sin tareas próximas</div>
            )}
          </div>

          <div className="card">
            <div className="card-head">
              <span className="card-title">Actividad reciente</span>
            </div>
            {(actividad_reciente || []).slice(0,5).map((a,i) => (
              <div key={i} className="act-row">
                <div className="act-dot" />
                <div className="act-info">
                  <div className="act-titulo">{a.detalle || a.accion}</div>
                  <div className="act-meta">{a.usuario_nombre} · {a.razon_social || ''}</div>
                </div>
              </div>
            ))}
            {!actividad_reciente?.length && (
              <div className="empty-state">Sin actividad aún</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
