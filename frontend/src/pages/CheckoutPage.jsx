import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function CheckoutPage() {
  const [cart, setCart] = useState(null);
  const [form, setForm] = useState({ deliveryType: 'DOMICILIO', deliveryAddress: '', notes: '' });
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { api.get('/cart').then(({ data }) => setCart(data)); }, []);

  async function submit(e) {
    e.preventDefault();
    try {
      const { data } = await api.post('/orders', form);
      navigate(`/pay/${data.data.orderId}`);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'No se pudo crear el pedido' });
    }
  }

  if (!cart) return <div className="container page">Cargando...</div>;

  return (
    <div className="container page">
      <h1>Checkout</h1>
      {message && <div className={`notice ${message.type}`}>{message.text}</div>}
      {!cart.items.length ? (
        <div className="card">No hay productos en el carrito.</div>
      ) : (
        <div className="split">
          <form className="card" onSubmit={submit}>
            <div className="form-group">
              <label>Tipo de entrega</label>
              <select value={form.deliveryType} onChange={(e)=>setForm({...form, deliveryType:e.target.value})}>
                <option value="DOMICILIO">DOMICILIO</option>
                <option value="RECOGIDA_TIENDA">RECOGIDA_TIENDA</option>
              </select>
            </div>
            {form.deliveryType === 'DOMICILIO' && (
              <div className="form-group">
                <label>Dirección</label>
                <input value={form.deliveryAddress} onChange={(e)=>setForm({...form, deliveryAddress:e.target.value})} />
              </div>
            )}
            <div className="form-group">
              <label>Observación</label>
              <textarea value={form.notes} onChange={(e)=>setForm({...form, notes:e.target.value})} />
            </div>
            <button className="btn btn-primary">Crear pedido</button>
          </form>
          <aside className="card">
            <h3>Resumen</h3>
            {cart.items.map(item => (
              <div key={item.itemId} className="stack" style={{justifyContent:'space-between', marginBottom:8}}>
                <span>{item.name} x {item.quantity}</span>
                <strong>${item.subtotal.toLocaleString('es-CO')}</strong>
              </div>
            ))}
            <hr className="sep" />
            <h2>${cart.total.toLocaleString('es-CO')}</h2>
          </aside>
        </div>
      )}
    </div>
  );
}
