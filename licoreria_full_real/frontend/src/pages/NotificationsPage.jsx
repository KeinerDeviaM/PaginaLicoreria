import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function NotificationsPage() {
  const [rows, setRows] = useState([]);

  async function load() {
    const { data } = await api.get('/notifications/admin');
    setRows(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []);
  }

  useEffect(() => { load(); }, []);

  async function read(id) {
    await api.patch(`/notifications/admin/${id}/read`);
    load();
  }

  async function readAll() {
    await api.patch('/notifications/admin/read-all');
    load();
  }

  return (
    <div className="page">
      <section className="card reveal-on-scroll hero" style={{ marginBottom: 18 }}>
        <div className="stack" style={{ justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div className="small" style={{ color: '#d4af37', marginBottom: 8 }}>Centro de actividad</div>
            <h1>Notificaciones</h1>
            <p className="small">Seguimiento de compras, pagos y facturas.</p>
          </div>
          <button className="btn btn-primary" onClick={readAll}>
            Marcar todas como leídas
          </button>
        </div>
      </section>

      <div className="grid">
        {rows.map((n) => (
          <article key={n.id} className="card reveal-on-scroll" style={{ opacity: n.read ? 0.72 : 1 }}>
            <div className="stack" style={{ justifyContent: 'space-between', alignItems: 'start', gap: 12 }}>
              <div>
                <h3>{n.title}</h3>
                <p>{n.message}</p>
                <div className="small">
                  Actor: {n.actorName} · {n.actorRole} · Ref: {n.referenceType} #{n.referenceId}
                </div>
              </div>
              <div className="small">{new Date(n.createdAt).toLocaleString('es-CO')}</div>
            </div>

            {!n.read && (
              <button className="btn btn-outline" onClick={() => read(n.id)}>
                Marcar leída
              </button>
            )}
          </article>
        ))}

        {!rows.length && (
          <section className="card reveal-on-scroll">
            <h3>No hay notificaciones</h3>
            <p className="small">Aún no se han registrado eventos recientes.</p>
          </section>
        )}
      </div>
    </div>
  );
}
