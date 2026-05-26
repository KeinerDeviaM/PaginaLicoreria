import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useToast } from '../toast';

const money = (value) => `$${Number(value || 0).toLocaleString('es-CO')}`;

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [cart, setCart] = useState(null);
  const [deliveryType, setDeliveryType] = useState('DOMICILIO');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/cart')
      .then(({ data }) => setCart(data.data || data))
      .catch((err) => showToast({ type: 'error', title: 'Error', text: err.response?.data?.message || 'No se pudo cargar el carrito.' }))
      .finally(() => setLoading(false));
  }, [showToast]);

  async function handleSubmit(e) {
    e.preventDefault();

    if (deliveryType === 'DOMICILIO' && !deliveryAddress.trim()) {
      showToast({ type: 'warning', title: 'Dirección requerida', text: 'La dirección es obligatoria para entrega a domicilio.' });
      return;
    }

    try {
      setSaving(true);
      const { data } = await api.post('/orders', {
        deliveryType,
        deliveryAddress: deliveryType === 'DOMICILIO' ? deliveryAddress.trim() : '',
        notes: notes.trim()
      });

      showToast({ type: 'success', title: 'Pedido creado', text: data.message || 'Pedido creado correctamente.' });
      setTimeout(() => navigate(`/pay/${data.data.orderId}`), 700);
    } catch (err) {
      showToast({ type: 'error', title: 'No se pudo crear', text: err.response?.data?.message || 'No se pudo crear el pedido.' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="page">
        <div className="split">
          <section className="card skeleton-box"></section>
          <section className="card skeleton-box"></section>
        </div>
      </div>
    );
  }

  if (!cart?.items?.length) {
    return (
      <div className="page">
        <section className="card reveal-on-scroll" style={{ textAlign: 'center', padding: 28 }}>
          <h2>No hay productos para procesar</h2>
          <p className="small" style={{ marginBottom: 18 }}>Tu carrito está vacío.</p>
          <Link to="/shop/products" className="btn btn-primary">Ir al catálogo</Link>
        </section>
      </div>
    );
  }

  return (
    <div className="page">
      <section className="card reveal-on-scroll hero" style={{ marginBottom: 18 }}>
        <div>
          <div className="small" style={{ color: '#d4af37', marginBottom: 8 }}>Paso final</div>
          <h1>Finalizar compra</h1>
          <p className="small">Confirma tus datos de entrega antes de generar el pedido.</p>
        </div>
      </section>

      <div className="split">
        <section className="card reveal-on-scroll">
          <h3>Resumen del pedido</h3>
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
                {cart.items.map((item) => (
                  <tr key={item.itemId}>
                    <td>{item.code} · {item.name}</td>
                    <td>{item.quantity}</td>
                    <td>{money(item.priceUnit)}</td>
                    <td>{money(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card" style={{ marginTop: 16, background: 'rgba(255,255,255,0.02)' }}>
            <p><strong>Subtotal:</strong> {money(cart.subtotal)}</p>
            <p><strong>Descuento:</strong> -{money(cart.discountTotal)}</p>
            <p><strong>Total:</strong> <span style={{ color: '#d4af37', fontWeight: 800 }}>{money(cart.total)}</span></p>
          </div>
        </section>

        <section className="card reveal-on-scroll">
          <h3>Datos de entrega</h3>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Tipo de entrega</label>
              <select value={deliveryType} onChange={(e) => setDeliveryType(e.target.value)}>
                <option value="DOMICILIO">Domicilio</option>
                <option value="RECOGER_EN_TIENDA">Recoger en tienda</option>
              </select>
            </div>

            <div className="form-group">
              <label>Dirección</label>
              <input
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Dirección de entrega"
                disabled={deliveryType !== 'DOMICILIO'}
              />
            </div>

            <div className="form-group">
              <label>Observaciones</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Indicaciones adicionales"
              />
            </div>

            <div className="stack">
              <button className="btn btn-primary" disabled={saving}>
                {saving ? 'Procesando...' : 'Confirmar pedido'}
              </button>
              <Link to="/cart" className="btn btn-outline">Volver al carrito</Link>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
