import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function HomePage() {
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    api.get('/shop/home').then(({ data }) => setFeatured(data.featuredProducts || []));
  }, []);

  return (
    <div className="container page">
      <section className="hero">
        <div className="small" style={{color:'var(--gold)', fontWeight:700, textTransform:'uppercase'}}>Licorería premium</div>
        <h1>Compra, administra y controla tu licorería en una sola plataforma</h1>
        <p>Explora el catálogo, agrega productos al carrito, registra pagos y controla la operación completa con roles de admin y trabajador.</p>
        <div className="stack">
          <Link className="btn btn-primary" to="/shop/products">Ver catálogo</Link>
          <Link className="btn btn-outline" to="/login">Acceder al sistema</Link>
        </div>
      </section>

      <section className="page">
        <div className="stack" style={{justifyContent:'space-between', alignItems:'center'}}>
          <h2>Productos destacados</h2>
          <Link to="/shop/products" className="btn btn-outline">Ver todos</Link>
        </div>
        <div className="product-grid">
          {featured.map(product => (
            <article key={product.id} className="product-card">
              <div className="product-image">{product.name.charAt(0)}</div>
              <div className="product-body">
                <div className="small">{product.brandName} · {product.categoryName}</div>
                <h3>{product.name}</h3>
                <p className="small">{product.description}</p>
                <div className="stack" style={{justifyContent:'space-between', alignItems:'center'}}>
                  <strong>${product.salePrice?.toLocaleString('es-CO')}</strong>
                  <Link className="btn btn-primary" to={`/shop/products/${product.id}`}>Ver detalle</Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
