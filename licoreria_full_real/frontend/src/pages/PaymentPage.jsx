import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { useToast } from '../toast';

const money = (value) => `$${Number(value || 0).toLocaleString('es-CO')}`;

export default function PaymentPage() {
  const { orderId } = useParams();
  const { showToast } = useToast();

  const [order, setOrder] = useState(null);
  const [payment, setPayment] = useState(null);
  const [method, setMethod] = useState('TRANSFERENCIA');
  const [reference, setReference] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/orders/${orderId}`),
      api.get(`/payments/order/${orderId}`).catch(() => ({ data: null }))
    ])
      .then(([orderRes, paymentRes]) => {
        const orderData = orderRes.data.data || orderRes.data;
        setOrder(orderData);
        setAmount(orderData.total || 0);
        setPayment(paymentRes.data?.data || paymentRes.data || null);
      })
      .catch((err) => showToast({ type: 'error', title: 'Error', text: err.response?.data?.message || 'No se pudo cargar el pedido.' }))
      .finally(() => setLoading(false));
  }, [orderId, showToast]);

  async function submit(e) {
    e.preventDefault();

    if (!order) {
      showToast({ type: 'error', title: 'Pedido no cargado', text: 'No se pudo cargar el pedido.' });
      return;
    }

    const numericAmount = Number(amount || 0);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      showToast({ type: 'warning', title: 'Monto inválido', text: 'Ingresa un monto válido.' });
      return;
    }

    if (numericAmount !== Number(order.total)) {
      showToast({ type: 'warning', title: 'Monto incorrecto', text: 'El monto debe coincidir exactamente con el total del pedido.' });
      return;
    }

    if (method !== 'EFECTIVO' && !reference.trim()) {
      showToast({ type: 'warning', title: 'Referencia requerida', text: 'La referencia es obligatoria para este método.' });
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
      showToast({ type: 'success', title: 'Pago registrado', text: 'Pago registrado. Queda pendiente de confirmación.' });
    } catch (err) {
      showToast({ type: 'error', title: 'No se pudo registrar', text: err.response?.data?.message || 'No se pudo registrar el pago.' });
    }
  }

  if (loading) {
    return (
      <div className="page">
        <section className="card skeleton-box"></section>
      </div>
    );
  }

  return (
    <div className="page">
      <section className="card reveal-on-scroll hero" style={{ marginBottom: 18 }}>
        <div>
          <div className="small" style={{ color: '#d4af37', marginBottom: 8 }}>Pago del pedido</div>
          <h1>Completa tu pago</h1>
          <p className="small">Registra tu pago y espera la confirmación del equipo interno.</p>
        </div>
      </section>

      {!order ? (
        <section className="card reveal-on-scroll">
          <h3>No se encontró el pedido</h3>
        </section>
      ) : (
        <div className="split">
          <section className="card reveal-on-scroll">
            <h3>Resumen del pedido</h3>
            <div className="card" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <p><strong>Número:</strong> {order.orderNumber}</p>
              <p><strong>Total:</strong> <span style={{ color: '#d4af37', fontWeight: 800 }}>{money(order.total)}</span></p>
              <p><strong>Estado:</strong> {order.status}</p>
              <p><strong>Entrega:</strong> {order.deliveryType}</p>
            </div>

            <div className="stack" style={{ marginTop: 14 }}>
              <Link to="/orders" className="btn btn-outline">Volver a mis pedidos</Link>
            </div>
          </section>

          <section className="card reveal-on-scroll">
            <h3>Registrar pago</h3>

            {payment ? (
              <div className="card" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <p><strong>Método:</strong> {payment.method}</p>
                <p><strong>Monto:</strong> {money(payment.amount)}</p>
                <p><strong>Referencia:</strong> {payment.reference || '—'}</p>
                <p><strong>Estado:</strong> {payment.status}</p>
              </div>
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
                    placeholder="Número de referencia"
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

                <button className="btn btn-primary">Registrar pago</button>
              </form>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
