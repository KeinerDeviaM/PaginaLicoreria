import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function CheckoutPage() {
  const navigate = useNavigate();

  const [cart, setCart] = useState(null);
  const [deliveryType, setDeliveryType] = useState('DOMICILIO');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  async function loadCart() {
    try {
      setLoading(true);
      setMessage(null);

      const { data } = await api.get('/cart');
      const cartData = data?.data || data || null;

      setCart(cartData);
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'No se pudo cargar el carrito.'
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCart();
  }, []);

  const items = useMemo(() => cart?.items || [], [cart]);

  const total = useMemo(() => {
    if (typeof cart?.total === 'number') return cart.total;
    return items.reduce((acc, item) => acc + Number(item.subtotal || 0), 0);
  }, [cart, items]);

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setMessage(null);

      const payload = {
        deliveryType,
        deliveryAddress,
        notes
      };

      const { data } = await api.post('/orders', payload);

      setMessage({
        type: 'success',
        text: data?.message || 'Pedido creado correctamente.'
      });

      setTimeout(() => {
        navigate('/orders');
      }, 1000);
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'No se pudo crear el pedido.'
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="container page">
        <div className="notice">Cargando checkout...</div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="container page">
        <div className="card">
          <h2>Tu carrito está vacío</h2>
          <p className="small">Agrega productos antes de realizar tu pedido.</p>
          <Link to="/shop/products" className="btn btn-primary">
            Ir al catálogo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container page">
      <div
        className="stack"
        style={{ justifyContent: 'space-between', alignItems: 'end', gap: 16, flexWrap: 'wrap' }}
      >
        <div>
          <h1>Finalizar compra</h1>
          <p className="small">Confirma tu pedido y completa los datos de entrega.</p>
        </div>
      </div>

      {message && (
        <div className={`notice ${message.type === 'error' ? 'error' : 'success'}`}>
          {message.text}
        </div>
      )}

      <div className="grid-2" style={{ marginTop: 16 }}>
        <section className="card">
          <h3>Resumen del carrito</h3>

          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Precio</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.productId || item.id}>
                    <td>{item.code || item.productCode} · {item.name || item.productName}</td>
                    <td>{item.quantity}</td>
                    <td>${Number(item.price || 0).toLocaleString('es-CO')}</td>
                    <td>${Number(item.subtotal || 0).toLocaleString('es-CO')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 16 }}>
            <strong>Total: ${Number(total || 0).toLocaleString('es-CO')}</strong>
          </div>
        </section>

        <section className="card">
          <h3>Datos del pedido</h3>

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
              <label>Observación</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Indicaciones adicionales"
              />
            </div>

            <div className="stack" style={{ gap: 10 }}>
              <button className="btn btn-primary" disabled={saving}>
                {saving ? 'Procesando...' : 'Confirmar pedido'}
              </button>

              <Link to="/cart" className="btn btn-outline">
                Volver al carrito
              </Link>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
