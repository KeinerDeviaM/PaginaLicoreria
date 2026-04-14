import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function CartPage() {
  const [cart, setCart] = useState(null);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  const load = () => api.get('/cart').then(({ data }) => setCart(data));
  useEffect(() => { load(); }, []);

  async function update(itemId, quantity) {
    try {
      const { data } = await api.put(`/cart/items/${itemId}`, { quantity });
      setCart(data.data);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'No se pudo actualizar' });
    }
  }

  async function remove(itemId) {
    if (!confirm('¿Eliminar este producto del carrito?')) return;
    const { data } = await api.delete(`/cart/items/${itemId}`);
    setCart(data.data);
  }

  async function clear() {
    if (!confirm('¿Vaciar carrito?')) return;
    const { data } = await api.delete('/cart/items');
    setCart(data.data);
  }

  if (!cart) return <div className="container page">Cargando...</div>;

  return (
    <div className="container page">
      <div className="stack" style={{justifyContent:'space-between', alignItems:'center'}}>
        <div>
          <h1>Mi carrito</h1>
          <p className="small">Revisa tus productos antes de continuar.</p>
        </div>
        <Link className="btn btn-outline" to="/shop/products">Seguir comprando</Link>
      </div>
      {message && <div className={`notice ${message.type}`}>{message.text}</div>}
      {!cart.items.length ? (
        <div className="card">
          <h3>Tu carrito está vacío</h3>
          <Link to="/shop/products" className="btn btn-primary">Ir al catálogo</Link>
        </div>
      ) : (
        <div className="split">
          <section className="card">
            <div className="table-wrap">
              <table>
                <thead><tr><th>Producto</th><th>Precio</th><th>Cantidad</th><th>Subtotal</th><th></th></tr></thead>
                <tbody>
                  {cart.items.map(item => (
                    <tr key={item.itemId}>
                      <td>{item.code} · {item.name}</td>
                      <td>${item.priceUnit.toLocaleString('es-CO')}</td>
                      <td>
                        <div className="stack">
                          <button className="btn btn-outline" onClick={()=> item.quantity > 1 && update(item.itemId, item.quantity - 1)}>-</button>
                          <span style={{alignSelf:'center'}}>{item.quantity}</span>
                          <button className="btn btn-outline" onClick={()=> update(item.itemId, item.quantity + 1)}>+</button>
                        </div>
                      </td>
                      <td>${item.subtotal.toLocaleString('es-CO')}</td>
                      <td><button className="btn btn-danger" onClick={()=>remove(item.itemId)}>Eliminar</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <aside className="card">
            <h3>Resumen</h3>
            <p className="small">Productos: {cart.totalItems}</p>
            <h2>${cart.total.toLocaleString('es-CO')}</h2>
            <div className="stack">
              <button className="btn btn-primary" onClick={()=>navigate('/checkout')}>Continuar compra</button>
              <button className="btn btn-outline" onClick={clear}>Vaciar carrito</button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
