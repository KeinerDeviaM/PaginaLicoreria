import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

const money = (value) => `$${Number(value || 0).toLocaleString('es-CO')}`;
const dateText = (value) => value ? new Date(value).toLocaleString('es-CO') : 'No disponible';

function badgeStyle(status) {
  const s = String(status || '').toUpperCase();

  if (s === 'PENDIENTE') {
    return { background: 'rgba(255,193,7,0.14)', color: '#ffd666', border: '1px solid rgba(255,193,7,0.24)' };
  }

  if (s === 'APROBADO') {
    return { background: 'rgba(40,167,69,0.14)', color: '#8ef0a0', border: '1px solid rgba(40,167,69,0.24)' };
  }

  if (s === 'RECHAZADO') {
    return { background: 'rgba(220,53,69,0.14)', color: '#ff9a9a', border: '1px solid rgba(220,53,69,0.24)' };
  }

  return { background: 'rgba(255,255,255,0.06)', color: '#f5f5f5', border: '1px solid rgba(255,255,255,0.10)' };
}

export default function PaymentsPage() {
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [msg, setMsg] = useState(null);

  async function load() {
    const { data } = await api.get('/payments');
    const payments = Array.isArray(data) ? data : data?.data || [];
    setRows(payments);
    if (!selected && payments.length > 0) setSelected(payments[0]);
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => rows.filter((r) => {
    const term = search.trim().toLowerCase();
    const searchOk = !term || JSON.stringify(r).toLowerCase().includes(term);
    const statusOk = statusFilter === 'TODOS' || String(r.status || '').toUpperCase() === statusFilter;
    return searchOk && statusOk;
  }), [rows, search, statusFilter]);

  async function updateStatus(id, action) {
    try {
      const { data } = await api.patch(`/payments/${id}/${action}`);
      setSelected(data.data || data);
      setMsg({ type: 'success', text: `Pago ${action === 'approve' ? 'aprobado' : 'rechazado'} correctamente.` });
      load();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'No se pudo actualizar el pago.' });
    }
  }

  return (
    <div className="page">
      <section className="card reveal-on-scroll hero" style={{ marginBottom: 18 }}>
        <div className="stack" style={{ justifyContent: 'space-between', alignItems: 'end', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div className="small" style={{ color: '#d4af37', marginBottom: 8 }}>Control financiero</div>
            <h1>Pagos</h1>
            <p className="small">Revisa pagos, valida referencias y aprueba o rechaza operaciones.</p>
          </div>

          <div className="stack" style={{ gap: 8, flexWrap: 'wrap' }}>
            <input
              placeholder="Buscar por pedido o referencia"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ maxWidth: 260 }}
            />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="TODOS">Todos</option>
              <option value="PENDIENTE">Pendientes</option>
              <option value="APROBADO">Aprobados</option>
              <option value="RECHAZADO">Rechazados</option>
            </select>
          </div>
        </div>
      </section>

      {msg && <div className={`notice ${msg.type}`}>{msg.text}</div>}

      <div className="split">
        <section className="card reveal-on-scroll">
          <div className="table-header">
            <div>
              <h3>Listado de pagos</h3>
              <p className="small">{filtered.length} resultados visibles.</p>
            </div>
            <span className="result-pill">{filtered.length} pagos</span>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Monto</th>
                  <th>Método</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.paymentId}>
                    <td>{r.orderNumber}</td>
                    <td>{money(r.amount)}</td>
                    <td>{r.method}</td>
                    <td>
                      <span className="badge" style={badgeStyle(r.status)}>
                        {r.status}
                      </span>
                    </td>
                    <td>{dateText(r.createdAt)}</td>
                    <td>
                      <button className="btn btn-outline" onClick={() => setSelected(r)}>
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {selected && (
          <section className="card reveal-on-scroll">
            <div className="page-header" style={{ alignItems: 'center' }}>
              <div>
                <h3>Detalle del pago</h3>
                <p className="small">Valida referencia y estado antes de procesar.</p>
              </div>
              <span className="badge" style={badgeStyle(selected.status)}>
                {selected.status}
              </span>
            </div>

            <div className="panel-grid" style={{ marginTop: 10 }}>
              <div className="info-tile"><div className="small">Pedido</div><strong>{selected.orderNumber}</strong></div>
              <div className="info-tile"><div className="small">Monto</div><strong>{money(selected.amount)}</strong></div>
              <div className="info-tile"><div className="small">Método</div><strong>{selected.method}</strong></div>
              <div className="info-tile"><div className="small">Referencia</div><strong>{selected.reference || '—'}</strong></div>
              <div className="info-tile"><div className="small">Estado</div><strong>{selected.status}</strong></div>
              <div className="info-tile"><div className="small">Aprobado por</div><strong>{selected.approvedBy || 'Pendiente'}</strong></div>
            </div>

            {selected.status === 'PENDIENTE' ? (
              <div className="stack" style={{ gap: 10, marginTop: 16 }}>
                <button className="btn btn-primary" onClick={() => updateStatus(selected.paymentId, 'approve')}>Aprobar pago</button>
                <button className="btn btn-wine" onClick={() => updateStatus(selected.paymentId, 'reject')}>Rechazar pago</button>
              </div>
            ) : (
              <div className="notice info" style={{ marginTop: 16 }}>Este pago ya fue procesado.</div>
            )}

            <div className="stack" style={{ gap: 10, marginTop: 16 }}>
              <Link className="btn btn-outline" to="/admin/orders">Ir a pedidos</Link>
              <Link className="btn btn-outline" to="/admin/invoices">Ir a facturas</Link>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
