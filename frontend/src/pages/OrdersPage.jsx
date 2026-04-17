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

  if (s === 'PAGADO' || s === 'ENTREGADO' || s === 'APROBADO') {
    return { background: 'rgba(40,167,69,0.14)', color: '#8ef0a0', border: '1px solid rgba(40,167,69,0.24)' };
  }

  if (s === 'CANCELADO' || s === 'RECHAZADO') {
    return { background: 'rgba(220,53,69,0.14)', color: '#ff9a9a', border: '1px solid rgba(220,53,69,0.24)' };
  }

  return { background: 'rgba(255,255,255,0.06)', color: '#f5f5f5', border: '1px solid rgba(255,255,255,0.10)' };
}

export default function OrdersPage() {
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState('PENDIENTE');
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);
      const { data } = await api.get('/orders');
      const orders = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      setRows(orders);

      if (!selected && orders.length > 0) {
        setSelected(orders[0]);
        setStatus(orders[0].status || 'PENDIENTE');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function open(order) {
    setSelected(order);
    setStatus(order.status || 'PENDIENTE');
  }

  async function updateStatus() {
    try {
      const { data } = await api.patch(`/orders/${selected.orderId || selected.id}/status`, { status });
      const updated = data?.data || data;

      setSelected(updated);
      setMsg({ type: 'success', text: 'Estado del pedido actualizado correctamente.' });
      load();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'No se pudo actualizar el estado del pedido.' });
    }
  }

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;

    return rows.filter((r) =>
      String(r.orderNumber || '').toLowerCase().includes(term) ||
      String(r.customerName || '').toLowerCase().includes(term) ||
      String(r.customerEmail || '').toLowerCase().includes(term)
    );
  }, [rows, search]);

  return (
    <div className="page">
      <div className="stack" style={{ justifyContent: 'space-between', alignItems: 'end', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1>Pedidos</h1>
          <p className="small">Consulta pedidos, revisa detalles y actualiza su estado.</p>
        </div>

        <input
          placeholder="Buscar por número o cliente"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 280 }}
        />
      </div>

      {msg && <div className={`notice ${msg.type}`}>{msg.text}</div>}

      <div className="split" style={{ marginTop: 16 }}>
        <section className="card">
          <div className="stack" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Listado de pedidos</h3>
            <span className="badge">{filtered.length}</span>
          </div>

          {loading ? (
            <div className="notice">Cargando pedidos...</div>
          ) : !filtered.length ? (
            <div className="notice">No hay pedidos disponibles.</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Número</th>
                    <th>Cliente</th>
                    <th>Estado</th>
                    <th>Total</th>
                    <th>Fecha</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.orderId || r.id}>
                      <td>{r.orderNumber || r.number}</td>
                      <td>{r.customerName}</td>
                      <td>
                        <span className="badge" style={badgeStyle(r.status)}>
                          {r.status}
                        </span>
                      </td>
                      <td>{money(r.total)}</td>
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
              <h3>Detalle del pedido</h3>
              <span className="badge" style={badgeStyle(selected.status)}>
                {selected.status}
              </span>
            </div>

            <div className="grid grid-2" style={{ marginTop: 10 }}>
              <div className="card">
                <div className="small">Número</div>
                <strong>{selected.orderNumber || selected.number}</strong>
              </div>
              <div className="card">
                <div className="small">Total</div>
                <strong>{money(selected.total)}</strong>
              </div>
              <div className="card">
                <div className="small">Cliente</div>
                <strong>{selected.customerName || 'No disponible'}</strong>
              </div>
              <div className="card">
                <div className="small">Correo</div>
                <strong>{selected.customerEmail || 'No disponible'}</strong>
              </div>
              <div className="card">
                <div className="small">Entrega</div>
                <strong>{selected.deliveryType || 'No disponible'}</strong>
              </div>
              <div className="card">
                <div className="small">Dirección</div>
                <strong>{selected.deliveryAddress || 'Sin dirección'}</strong>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: 16 }}>
              <label>Cambiar estado</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="PENDIENTE">PENDIENTE</option>
                <option value="PAGADO">PAGADO</option>
                <option value="ENTREGADO">ENTREGADO</option>
                <option value="CANCELADO">CANCELADO</option>
              </select>
            </div>

            <div className="stack" style={{ gap: 10, flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={updateStatus}>
                Guardar estado
              </button>

              <Link className="btn btn-outline" to="/admin/payments">
                Ir a pagos
              </Link>

              <Link className="btn btn-outline" to="/admin/invoices">
                Ir a facturas
              </Link>
            </div>

            <hr className="sep" />

            <h4 style={{ marginBottom: 10 }}>Productos del pedido</h4>

            {(selected.details || []).length === 0 ? (
              <div className="notice">Este pedido no tiene detalles cargados.</div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Cantidad</th>
                      <th>Precio</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selected.details || []).map((item) => (
                      <tr key={item.detailId || `${item.productId}-${item.name}`}>
                        <td>{item.name}</td>
                        <td>{item.quantity}</td>
                        <td>{money(item.price)}</td>
                        <td>{money(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="card" style={{ marginTop: 16 }}>
              <div className="small">Historial visual</div>
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="stack" style={{ gap: 10 }}>
                  <span className="badge" style={badgeStyle('PENDIENTE')}>1</span>
                  <span>Pedido registrado</span>
                </div>
                <div className="stack" style={{ gap: 10 }}>
                  <span className="badge" style={badgeStyle(selected.status)}>{selected.status}</span>
                  <span>Estado actual del pedido</span>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
