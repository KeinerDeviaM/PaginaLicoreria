import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

function money(value) {
  return `$${Number(value || 0).toLocaleString('es-CO')}`;
}

function dateText(value) {
  if (!value) return 'No disponible';
  return new Date(value).toLocaleString('es-CO');
}

function badgeStyle(status) {
  const s = String(status || '').toUpperCase();

  if (s === 'PENDIENTE') {
    return { background: 'rgba(255,193,7,0.14)', color: '#ffd666', border: '1px solid rgba(255,193,7,0.24)' };
  }

  if (s === 'APROBADO' || s === 'PAGADO') {
    return { background: 'rgba(40,167,69,0.14)', color: '#8ef0a0', border: '1px solid rgba(40,167,69,0.24)' };
  }

  if (s === 'RECHAZADO' || s === 'CANCELADO') {
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
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);
      const { data } = await api.get('/payments');
      const payments = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      setRows(payments);

      if (!selected && payments.length > 0) {
        setSelected(payments[0]);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function open(payment) {
    setSelected(payment);
  }

  async function updateStatus(id, status) {
    try {
      await api.patch(`/payments/${id}/status`, { status });
      setMsg({
        type: 'success',
        text: `Pago ${status.toLowerCase()} correctamente.`
      });
      load();
    } catch (err) {
      setMsg({
        type: 'error',
        text: err.response?.data?.message || 'No se pudo actualizar el pago.'
      });
    }
  }

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const term = search.trim().toLowerCase();

      const searchOk =
        !term ||
        String(r.orderNumber || '').toLowerCase().includes(term) ||
        String(r.method || '').toLowerCase().includes(term) ||
        String(r.reference || '').toLowerCase().includes(term);

      const statusOk =
        statusFilter === 'TODOS' ||
        String(r.status || '').toUpperCase() === statusFilter;

      return searchOk && statusOk;
    });
  }, [rows, search, statusFilter]);

  return (
    <div className="page">
      <div className="stack" style={{ justifyContent: 'space-between', alignItems: 'end', gap: 16, flexWrap: 'wrap' }}>
        <div>
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

      {msg && <div className={`notice ${msg.type}`}>{msg.text}</div>}

      <div className="split" style={{ marginTop: 16 }}>
        <section className="card">
          <div className="stack" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Listado de pagos</h3>
            <span className="badge">{filtered.length}</span>
          </div>

          {loading ? (
            <div className="notice">Cargando pagos...</div>
          ) : !filtered.length ? (
            <div className="notice">No hay pagos registrados.</div>
          ) : (
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
                    <tr key={r.paymentId || r.id}>
                      <td>{r.orderNumber || r.orderId}</td>
                      <td>{money(r.amount)}</td>
                      <td>{r.method}</td>
                      <td>
                        <span className="badge" style={badgeStyle(r.status)}>
                          {r.status}
                        </span>
                      </td>
                      <td>{dateText(r.createdAt)}</td>
                      <td>
                        <button className="btn btn-outline" onClick={() => open(r)}>
                          Ver detalle
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {selected && (
          <section className="card">
            <div className="stack" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Detalle del pago</h3>
              <span className="badge" style={badgeStyle(selected.status)}>
                {selected.status}
              </span>
            </div>

            <div className="grid grid-2" style={{ marginTop: 10 }}>
              <div className="card">
                <div className="small">Pedido</div>
                <strong>{selected.orderNumber || selected.orderId}</strong>
              </div>
              <div className="card">
                <div className="small">Monto</div>
                <strong>{money(selected.amount)}</strong>
              </div>
              <div className="card">
                <div className="small">Método</div>
                <strong>{selected.method || 'No disponible'}</strong>
              </div>
              <div className="card">
                <div className="small">Referencia</div>
                <strong>{selected.reference || '—'}</strong>
              </div>
            </div>

            <div className="card" style={{ marginTop: 16 }}>
              <div className="small">Historial visual</div>
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="stack" style={{ gap: 10 }}>
                  <span className="badge" style={badgeStyle('PENDIENTE')}>1</span>
                  <span>Pago registrado por el cliente</span>
                </div>

                {String(selected.status).toUpperCase() === 'PENDIENTE' && (
                  <div className="stack" style={{ gap: 10 }}>
                    <span className="badge" style={badgeStyle('PENDIENTE')}>2</span>
                    <span>Pago pendiente de revisión</span>
                  </div>
                )}

                {String(selected.status).toUpperCase() === 'APROBADO' && (
                  <div className="stack" style={{ gap: 10 }}>
                    <span className="badge" style={badgeStyle('APROBADO')}>3</span>
                    <span>Pago aprobado</span>
                  </div>
                )}

                {String(selected.status).toUpperCase() === 'RECHAZADO' && (
                  <div className="stack" style={{ gap: 10 }}>
                    <span className="badge" style={badgeStyle('RECHAZADO')}>3</span>
                    <span>Pago rechazado</span>
                  </div>
                )}
              </div>
            </div>

            {String(selected.status || '').toUpperCase() === 'PENDIENTE' ? (
              <div className="stack" style={{ gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
                <button
                  className="btn btn-primary"
                  onClick={() => updateStatus(selected.paymentId || selected.id, 'APROBADO')}
                >
                  Aprobar pago
                </button>

                <button
                  className="btn btn-wine"
                  onClick={() => updateStatus(selected.paymentId || selected.id, 'RECHAZADO')}
                >
                  Rechazar pago
                </button>
              </div>
            ) : (
              <div className="notice info" style={{ marginTop: 16 }}>
                Este pago ya fue procesado.
              </div>
            )}

            <div className="stack" style={{ gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
              <Link className="btn btn-outline" to="/admin/orders">
                Ir a pedidos
              </Link>
              <Link className="btn btn-outline" to="/admin/invoices">
                Ir a facturas
              </Link>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
