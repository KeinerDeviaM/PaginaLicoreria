import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';

export default function PaymentPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [payment, setPayment] = useState(null);
  const [form, setForm] = useState({ method: 'TRANSFERENCIA', reference: '' });
  const [message, setMessage] = useState(null);

  useEffect(() => {
    api.get(`/orders/${orderId}`).then(({ data }) => setOrder(data));
    api.get(`/payments/order/${orderId}`).then(({ data }) => setPayment(data)).catch(() => {});
  }, [orderId]);

  async function submit(e) {
    e.preventDefault();
    try {
      const { data } = await api.post('/payments', { orderId: Number(orderId), method: form.method, reference: form.reference, amount: order.total });
      setPayment(data.data);
      setMessage({ type: 'success', text: 'Pago registrado. Queda pendiente de confirmación.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'No se pudo registrar el pago' });
    }
  }

  if (!order) return <div className="container page">Cargando...</div>;

  return (
    <div className="container page">
      <h1>Pago del pedido</h1>
      {message && <div className={`notice ${message.type}`}>{message.text}</div>}
      <div className="split">
        <section className="card">
          <h3>Resumen del pedido</h3>
          <p><strong>Número:</strong> {order.orderNumber}</p>
          <p><strong>Estado:</strong> {order.status}</p>
          <p><strong>Entrega:</strong> {order.deliveryType}</p>
          <p><strong>Total:</strong> ${order.total.toLocaleString('es-CO')}</p>
        </section>
        <section className="card">
          <h3>{payment ? 'Pago registrado' : 'Registrar pago'}</h3>
          {payment ? (
            <>
              <p><strong>Método:</strong> {payment.method}</p>
              <p><strong>Estado:</strong> {payment.status}</p>
              <p><strong>Referencia:</strong> {payment.reference || '—'}</p>
              <p><strong>Monto:</strong> ${payment.amount.toLocaleString('es-CO')}</p>
              <Link className="btn btn-outline" to="/orders">Ir a mis pedidos</Link>
            </>
          ) : (
            <form onSubmit={submit}>
              <div className="form-group">
                <label>Método de pago</label>
                <select value={form.method} onChange={(e)=>setForm({...form, method:e.target.value})}>
                  <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                  <option value="TARJETA">TARJETA</option>
                  <option value="EFECTIVO">EFECTIVO</option>
                </select>
              </div>
              <div className="form-group">
                <label>Referencia</label>
                <input value={form.reference} onChange={(e)=>setForm({...form, reference:e.target.value})} />
              </div>
              <div className="notice info">Monto a pagar: ${order.total.toLocaleString('es-CO')}</div>
              <button className="btn btn-primary">Registrar pago</button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
