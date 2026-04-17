import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';

export default function PaymentPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [payment, setPayment] = useState(null);
  const [method, setMethod] = useState('TRANSFERENCIA');
  const [reference, setReference] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState(null);

  async function load() {
    try {
      const { data } = await api.get(`/orders/${orderId}`);
      setOrder(data?.data || data);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'No se pudo cargar el pedido.' });
    }
  }

  useEffect(() => {
    load();
  }, [orderId]);

  async function submit(e) {
    e.preventDefault();

    try {
      const payload = {
        method,
        reference,
        amount: Number(amount || order?.total || 0)
      };

      const { data } = await api.post(`/payments/${orderId}`, payload);
      setPayment(data?.data || data);
      setMessage({ type: 'success', text: 'Pago registrado. Queda pendiente de confirmación.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'No se pudo registrar el pago.' });
    }
  }

  return (
    <div className="container page">
      <h1>Pago del pedido</h1>

      {message && <div className={`notice ${message.type}`}>{message.text}</div>}

      {!order ? (
        <div className="notice">Cargando pedido...</div>
      ) : (
        <div className="grid-2" style={{ marginTop: 16 }}>
          <section className="card">
            <h3>Resumen del pedido</h3>
            <p><strong>Número:</strong> {order.orderNumber}</p>
            <p><strong>Total:</strong> ${Number(order.total || 0).toLocaleString('es-CO')}</p>
            <p><strong>Estado:</strong> {order.status}</p>

            <div className="stack" style={{ gap: 10 }}>
              <Link to="/orders" className="btn btn-outline">Volver a mis pedidos</Link>
            </div>
          </section>

          <section className="card">
            <h3>Registrar pago</h3>

            {payment ? (
              <>
                <p><strong>Método:</strong> {payment.method}</p>
                <p><strong>Monto:</strong> ${Number(payment.amount || 0).toLocaleString('es-CO')}</p>
                <p><strong>Referencia:</strong> {payment.reference || '—'}</p>
                <p><strong>Estado:</strong> {payment.status}</p>
              </>
            ) : (
              <form onSubmit={submit}>
                <div className="form-group">
                  <label>Método de pago</label>
                  <select value={method} onChange={(e) => setMethod(e.target.value)}>
                    <option value="TRANSFERENCIA">Transferencia</option>
                    <option value="EFECTIVO">Efectivo</option>
                    <option value="TARJETA">Tarjeta</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Referencia</label>
                  <input value={reference} onChange={(e) => setReference(e.target.value)} />
                </div>

                <div className="form-group">
                  <label>Monto</label>
                  <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={String(order.total || 0)} />
                </div>

                <button className="btn btn-primary">Registrar pago</button>
              </form>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
