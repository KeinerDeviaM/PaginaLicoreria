import React, { useEffect, useState } from 'react';
import { api } from '../api';

const money = (value) => `$${Number(value || 0).toLocaleString('es-CO')}`;
const dateText = (value) => value ? new Date(value).toLocaleString('es-CO') : 'No disponible';

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

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadOrders() {
    try {
      setLoading(true);
      setError('');

      const { data } = await api.get('/orders');
      const ordersData = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];

      setOrders(ordersData);

      if (ordersData.length > 0) {
        setSelected(ordersData[0]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudieron cargar tus pedidos.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadOrders(); }, []);

  return (
    <div className="page">
      <section className="card reveal-on-scroll hero" style={{ marginBottom: 18 }}>
        <div>
          <div className="small" style={{ color: '#d4af37', marginBottom: 8 }}>Área del cliente</div>
          <h1>Mis pedidos</h1>
          <p className="small">Consulta el estado y el detalle de tus pedidos.</p>
        </div>
      </section>

      {error && <div className="notice error">{error}</div>}

      <div className="grid-2">
        <section className="card reveal-on-scroll">
          <div className="table-header">
            <div>
              <h3>Listado de pedidos</h3>
              <p className="small">{orders.length} pedidos registrados.</p>
            </div>
          </div>

          {loading ? (
            <div className="notice">Cargando pedidos...</div>
          ) : orders.length === 0 ? (
            <div className="notice">No tienes pedidos registrados.</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Número</th>
                    <th>Estado</th>
                    <th>Entrega</th>
                    <th>Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.orderId || order.id}>
                      <td>{order.orderNumber || order.number}</td>
                      <td>
                        <span className="badge" style={badgeStyle(order.status)}>
                          {order.status}
                        </span>
                      </td>
                      <td>{order.deliveryType || 'No disponible'}</td>
                      <td>{money(order.total)}</td>
                      <td>
                        <button className="btn btn-outline" onClick={() => setSelected(order)}>
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

        <section className="card reveal-on-scroll">
          <h3>Detalle del pedido</h3>

          {!selected ? (
            <div className="notice">Selecciona un pedido para ver el detalle.</div>
          ) : (
            <div className="panel-grid">
              <div className="info-tile"><div className="small">Número</div><strong>{selected.orderNumber || selected.number}</strong></div>
              <div className="info-tile"><div className="small">Estado</div><strong>{selected.status}</strong></div>
              <div className="info-tile"><div className="small">Entrega</div><strong>{selected.deliveryType || 'No disponible'}</strong></div>
              <div className="info-tile"><div className="small">Dirección</div><strong>{selected.deliveryAddress || 'Sin dirección'}</strong></div>
              <div className="info-tile"><div className="small">Total</div><strong>{money(selected.total)}</strong></div>
              <div className="info-tile"><div className="small">Fecha</div><strong>{dateText(selected.createdAt)}</strong></div>
              <div className="info-tile"><div className="small">Observación</div><strong>{selected.notes || 'Sin observación'}</strong></div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
