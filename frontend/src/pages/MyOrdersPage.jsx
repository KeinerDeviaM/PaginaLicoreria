import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { api.get('/orders/my').then(({ data }) => setOrders(data)); }, []);

  return (
    <div className="container page">
      <h1>Mis pedidos</h1>
      <div className="split">
        <section className="card">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Número</th><th>Estado</th><th>Entrega</th><th>Total</th><th></th></tr></thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.orderId}>
                    <td>{order.orderNumber}</td>
                    <td><span className={`badge ${order.status === 'PENDIENTE' ? 'warning' : order.status === 'PAGADO' ? 'success' : order.status === 'ENTREGADO' ? 'info' : 'danger'}`}>{order.status}</span></td>
                    <td>{order.deliveryType}</td>
                    <td>${order.total.toLocaleString('es-CO')}</td>
                    <td className="stack">
                      <button className="btn btn-outline" onClick={()=>setSelected(order)}>Ver</button>
                      {order.status === 'PENDIENTE' && <button className="btn btn-primary" onClick={()=>navigate(`/pay/${order.orderId}`)}>Pagar</button>}
                    </td>
                  </tr>
                ))}
                {!orders.length && <tr><td colSpan="5">No tienes pedidos.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
        {selected && (
          <section className="card">
            <h3>Detalle</h3>
            <p><strong>Número:</strong> {selected.orderNumber}</p>
            <p><strong>Estado:</strong> {selected.status}</p>
            <p><strong>Entrega:</strong> {selected.deliveryType}</p>
            <p><strong>Dirección:</strong> {selected.deliveryAddress || '—'}</p>
            <p><strong>Total:</strong> ${selected.total.toLocaleString('es-CO')}</p>
            <hr className="sep" />
            {selected.details.map(item => (
              <div key={item.detailId} className="stack" style={{justifyContent:'space-between'}}>
                <span>{item.name} x {item.quantity}</span>
                <strong>${item.subtotal.toLocaleString('es-CO')}</strong>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
