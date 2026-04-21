import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

const money = (value) => `$${Number(value || 0).toLocaleString('es-CO')}`;
const dateText = (value) => value ? new Date(value).toLocaleString('es-CO') : 'No disponible';

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/orders/my').then(({ data }) => {
      setOrders(data);
      if (data.length) setSelected(data[0]);
    }).catch((err) => setError(err.response?.data?.message || 'No se pudieron cargar tus pedidos.'));
  }, []);

  return (
    <div className="container page">
      <div className="stack" style={{ justifyContent: 'space-between', alignItems: 'end', gap: 16, flexWrap: 'wrap' }}><div><h1>Mis pedidos</h1><p className="small">Consulta el estado y el detalle de tus pedidos.</p></div></div>
      {error && <div className="notice error">{error}</div>}
      <div className="grid-2" style={{ marginTop: 16 }}>
        <section className="card">
          <h3>Listado de pedidos</h3>
          {!orders.length ? <div className="notice">No tienes pedidos registrados.</div> : (
            <div className="table-wrap"><table><thead><tr><th>Número</th><th>Estado</th><th>Entrega</th><th>Total</th><th></th></tr></thead><tbody>{orders.map((order) => <tr key={order.orderId}><td>{order.orderNumber}</td><td>{order.status}</td><td>{order.deliveryType || 'No disponible'}</td><td>{money(order.total)}</td><td><button className="btn btn-outline" onClick={() => setSelected(order)}>Ver detalle</button></td></tr>)}</tbody></table></div>
          )}
        </section>
        <section className="card">
          <h3>Detalle del pedido</h3>
          {!selected ? <div className="notice">Selecciona un pedido para ver el detalle.</div> : (
            <>
              <p><strong>Número:</strong> {selected.orderNumber}</p>
              <p><strong>Estado:</strong> {selected.status}</p>
              <p><strong>Entrega:</strong> {selected.deliveryType || 'No disponible'}</p>
              <p><strong>Dirección:</strong> {selected.deliveryAddress || 'Sin dirección'}</p>
              <p><strong>Total:</strong> {money(selected.total)}</p>
              <p><strong>Fecha:</strong> {dateText(selected.createdAt)}</p>
              <p><strong>Observación:</strong> {selected.notes || 'Sin observación'}</p>
              <div className="stack" style={{ gap: 10, marginTop: 14 }}>
                <Link to={`/pay/${selected.orderId}`} className="btn btn-primary">Pagar pedido</Link>
                <Link to="/invoices" className="btn btn-outline">Ver mis facturas</Link>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
