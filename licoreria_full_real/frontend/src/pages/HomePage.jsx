import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { getAuth } from '../auth';

function money(value) { return `$${Number(value || 0).toLocaleString('es-CO')}`; }

export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [msg, setMsg] = useState(null);
  const navigate = useNavigate();
  const { user } = getAuth();

  useEffect(() => { api.get('/shop/home').then(({ data }) => setFeatured(data.featuredProducts || [])); }, []);

  async function addToCart(productId) {
    if (!user || user.role !== 'CLIENTE') return navigate('/login');
    try {
      await api.post('/cart/items', { productId, quantity: 1 });
      setMsg({ type: 'success', text: 'Producto agregado al carrito.' });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'No se pudo agregar el producto al carrito.' });
    }
  }

  return (
    <div className="container page">
      <section className="hero">
        <div className="small" style={{ color: 'var(--gold)', fontWeight: 700, textTransform: 'uppercase' }}>Licorería premium</div>
        <h1>Compra, administra y controla tu licorería en una sola plataforma</h1>
        <p>Explora el catálogo, agrega productos al carrito, registra pagos y controla inventario, alertas y finanzas con un panel más profesional.</p>
        <div className="stack">
          <Link className="btn btn-primary" to="/shop/products">Ver catálogo</Link>
          {user?.role === 'CLIENTE' && <Link className="btn btn-outline" to="/cart">Ir al carrito</Link>}
        </div>
      </section>
      {msg && <div className={`notice ${msg.type}`}>{msg.text}</div>}
      <section className="page">
        <div className="stack" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Productos destacados</h2>
          <Link to="/shop/products" className="btn btn-outline">Ver todos</Link>
        </div>
        <div className="product-grid">
          {featured.map((product) => (
            <article key={product.id} className="product-card">
              <div className="product-image">{product.imageUrl ? <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : product.name.charAt(0)}</div>
              <div className="product-body">
                <div className="small">{product.brandName} · {product.categoryName}</div>
                <h3>{product.name}</h3>
                <p className="small">{product.description}</p>
                <div className="stack" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <strong>{money(product.salePrice)}</strong>
                  <div className="stack" style={{ gap: 8 }}>
                    <button className="btn btn-primary" onClick={() => addToCart(product.id)}>Agregar al carrito</button>
                    <Link className="btn btn-outline" to={`/shop/products/${product.id}`}>Ver detalle</Link>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
