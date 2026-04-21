import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function NotificationsPage() {
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState('TODAS');

  async function load(nextFilter = filter) {
    const { data } = await api.get('/notifications/admin', { params: nextFilter !== 'TODAS' ? { filter: nextFilter } : {} });
    setRows(Array.isArray(data) ? data : data?.data || []);
  }

  useEffect(() => { load(); }, []);

  async function read(id) { await api.patch(`/notifications/admin/${id}/read`); load(); }
  async function readAll() { await api.patch('/notifications/admin/read-all'); load(); }

  return (
    <div className="page">
      <div className="stack" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div><h1>Notificaciones</h1><p className="small">Seguimiento de compras, pagos, facturas y nuevos productos.</p></div>
        <div className="stack"><select value={filter} onChange={(e) => { setFilter(e.target.value); load(e.target.value); }}><option value="TODAS">Todas</option><option value="PAGOS">Solo pagos</option><option value="VENTAS">Ventas</option><option value="PRODUCTOS">Productos agregados</option></select><button className="btn btn-primary" onClick={readAll}>Marcar todas como leídas</button></div>
      </div>
      <div className="grid">
        {rows.map((n) => (
          <article key={n.id} className="card" style={{ opacity: n.read ? 0.72 : 1 }}>
            <div className="stack" style={{ justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <h3>{n.title}</h3>
                <p>{n.message}</p>
                <div className="small">Actor: {n.actorName} · {n.actorRole} · Ref: {n.referenceType} #{n.referenceId}</div>
              </div>
              <div className="small">{new Date(n.createdAt).toLocaleString('es-CO')}</div>
            </div>
            {!n.read && <button className="btn btn-outline" onClick={() => read(n.id)}>Marcar leída</button>}
          </article>
        ))}
      </div>
    </div>
  );
}
