import React, { useEffect, useState } from 'react';
import { api } from '../api';

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
      const ordersData = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
        ? data
        : [];

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

  useEffect(() => {
    loadOrders();
  }, []);

  return (
    <div className="container page">
      <div
        className="stack"
        style={{ justifyContent: 'space-between', alignItems: 'end', gap: 16, flexWrap: 'wrap' }}
      >
        <div>
          <h1>Mis pedidos</h1>
          <p className="small">Consulta el estado y el detalle de tus pedidos.</p>
        </div>
      </div>

      {error && <div className="notice error">{error}</div>}

      <div className="grid-2" style={{ marginTop: 16 }}>
        <section className="card">
          <h3>Listado de pedidos</h3>

          {loading ? (
            <div className="notice">Cargando pedidos...</div>
          ) : orders.length === 0 ? (
            <div className="notice">No tienes pedidos registrados.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
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
                      <td>{order.status}</td>
                      <td>{order.deliveryType || 'No disponible'}</td>
                      <td>${Number(order.total || 0).toLocaleString('es-CO')}</td>
                      <td>
                        <button
                          className="btn btn-outline"
                          onClick={() => setSelected(order)}
                        >
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

        <section className="card">
          <h3>Detalle del pedido</h3>

          {!selected ? (
            <div className="notice">Selecciona un pedido para ver el detalle.</div>
          ) : (
            <>
              <p><strong>Número:</strong> {selected.orderNumber || selected.number}</p>
              <p><strong>Estado:</strong> {selected.status}</p>
              <p><strong>Entrega:</strong> {selected.deliveryType || 'No disponible'}</p>
              <p><strong>Dirección:</strong> {selected.deliveryAddress || 'Sin dirección'}</p>
              <p><strong>Total:</strong> ${Number(selected.total || 0).toLocaleString('es-CO')}</p>
              <p>
                <strong>Fecha:</strong>{' '}
                {selected.createdAt
                  ? new Date(selected.createdAt).toLocaleString('es-CO')
                  : 'No disponible'}
              </p>
              <p><strong>Observación:</strong> {selected.notes || 'Sin observación'}</p>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
