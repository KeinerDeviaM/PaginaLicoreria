import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { getAuth } from '../auth';

export default function PaymentsPage() {
  const { user } = getAuth();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [payment, setPayment] = useState(null);
  const [msg, setMsg] = useState(null);

  async function load() {
    const { data } = await api.get('/orders');
    setOrders(data);
  }

  useEffect(() => { load(); }, []);

  async function viewPayment(order) {
    setSelectedOrder(order);
    try {
      const { data } = await api.get(`/payments/order/${order.orderId}`);
      setPayment(data);
    } catch (err) {
      setPayment(null);
      setMsg({ type: 'info', text: 'Este pedido aún no tiene pago registrado.' });
    }
  }

  async function manage(action) {
    try {
      const { data } = await api.patch(`/payments/${payment.paymentId}/${action}`);
      setPayment(data.data);
      setMsg({ type: 'success', text: data.message });
      load();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'No se pudo procesar el pago' });
    }
  }

  return (
    <div className="page">
      <h1>Pagos</h1>
      {msg && <div className={`notice ${msg.type}`}>{msg.text}</div>}
      <div className="split">
        <section className="card">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Pedido</th><th>Cliente</th><th>Estado pedido</th><th>Total</th><th></th></tr></thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.orderId}>
                    <td>{o.orderNumber}</td>
                    <td>{o.customerName}</td>
                    <td>{o.status}</td>
                    <td>${o.total.toLocaleString('es-CO')}</td>
                    <td><button className="btn btn-outline" onClick={()=>viewPayment(o)}>Ver pago</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        {selectedOrder && (
          <section className="card">
            <h3>Detalle de pago</h3>
            <p><strong>Pedido:</strong> {selectedOrder.orderNumber}</p>
            <p><strong>Cliente:</strong> {selectedOrder.customerName}</p>
            {!payment ? (
              <div className="notice info">Este pedido no tiene pago aún.</div>
            ) : (
              <>
                <p><strong>Método:</strong> {payment.method}</p>
                <p><strong>Estado:</strong> {payment.status}</p>
                <p><strong>Referencia:</strong> {payment.reference || '—'}</p>
                <p><strong>Monto:</strong> ${payment.amount.toLocaleString('es-CO')}</p>
                {(user.role === 'ADMIN' || user.role === 'TRABAJADOR') && payment.status === 'PENDIENTE' && (
                  <div className="stack">
                    <button className="btn btn-success" onClick={()=>manage('approve')}>Aprobar pago</button>
                    <button className="btn btn-danger" onClick={()=>manage('reject')}>Rechazar pago</button>
                  </div>
                )}
              </>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
