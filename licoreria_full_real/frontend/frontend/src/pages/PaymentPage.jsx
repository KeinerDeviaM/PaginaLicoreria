import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';

const money = (value) => `$${Number(value || 0).toLocaleString('es-CO')}`;

export default function PaymentPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [payment, setPayment] = useState(null);
  const [method, setMethod] = useState('TRANSFERENCIA');
  const [reference, setReference] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState(null);

  useEffect(() => {
    api.get(`/orders/${orderId}`)
      .then(({ data }) => {
        const orderData = data.data || data;
        setOrder(orderData);
        setAmount(orderData.total || 0);
      })
      .catch((err) => setMessage({ type: 'error', text: err.response?.data?.message || 'No se pudo cargar el pedido.' }));

    api.get(`/payments/order/${orderId}`)
      .then(({ data }) => setPayment(data.data || data))
      .catch(() => {});
  }, [orderId]);

  async function submit(e) {
    e.preventDefault();
    setMessage(null);

    if (!order) {
      setMessage({ type: 'error', text: 'Pedido no cargado.' });
      return;
    }

    const numericAmount = Number(amount || 0);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setMessage({ type: 'error', text: 'Ingresa un monto válido.' });
      return;
    }

    if (numericAmount !== Number(order.total)) {
      setMessage({ type: 'error', text: 'El monto debe coincidir exactamente con el total del pedido.' });
      return;
    }

    if (method !== 'EFECTIVO' && !reference.trim()) {
      setMessage({ type: 'errorr', text: 'La referencia es obligatoria para este método.' });
      return;
    }

    try {
      const { data } = await api.post('/payments', {
        orderId: Number(orderId),
        method,
        reference: reference.trim(),
        amount: numericAmount
      });
      setPayment(data.data || data);
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
            <p><strong>Total:</strong> {money(order.total)}</p>
            <p><strong>Estado:</strong> {order.status}</p>
            <p><strong>Entrega:</strong> {order.deliveryType}</p>
            <div className="stack" style={{ gap: 10 }}>
              <Link to="/orders" className="btn btn-outline">Volver a mis pedidos</Link>
            </div>
          </section>

          <section className="card">
            <h3>Registrar pago</h3>
            {payment ? (
              <>
                <p><strong>Método:</strong> {payment.method}</p>
                <p><strong>Monto:</strong> {money(payment.amount)}</p>
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
                  <input
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    disabled={method === 'EFECTIVO'}
                  />
                </div>

                <div className="form-group">
                  <label>Monto</label>
                  <input
                    type="number"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>

                <button className="btn btn-primary" disabled={!order}>Registrar pago</button>
              </form>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
