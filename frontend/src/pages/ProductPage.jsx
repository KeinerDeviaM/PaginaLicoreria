import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { getAuth } from '../auth';

export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/shop/products/${id}`).then(({ data }) => setProduct(data));
  }, [id]);

  async function addToCart() {
    const { user } = getAuth();
    if (!user || user.role !== 'CLIENTE') {
      navigate('/login');
      return;
    }
    try {
      const { data } = await api.post('/cart/items', { productId: Number(id), quantity: qty });
      setMessage({ type: 'success', text: data.message });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'No se pudo agregar al carrito' });
    }
  }

  if (!product) return <div className="container page">Cargando...</div>;

  return (
    <div className="container page">
      {message && <div className={`notice ${message.type}`}>{message.text}</div>}
      <div className="split">
        <section className="card">
          <div className="product-image" style={{height:420}}>{product.name.charAt(0)}</div>
        </section>
        <section className="card">
          <div className="small">{product.brandName} · {product.categoryName}</div>
          <h1>{product.name}</h1>
          <p>{product.description}</p>
          <div className="grid grid-2">
            <div className="card"><div className="small">Volumen</div><strong>{product.volumeMl} ml</strong></div>
            <div className="card"><div className="small">Alcohol</div><strong>{product.alcohol}°</strong></div>
            <div className="card"><div className="small">Proveedor</div><strong>{product.supplierName}</strong></div>
            <div className="card"><div className="small">Stock</div><strong>{product.stock}</strong></div>
          </div>
          <hr className="sep" />
          <h2>${product.salePrice.toLocaleString('es-CO')}</h2>
          <div className="stack">
            <button className="btn btn-outline" onClick={()=>setQty(Math.max(1, qty-1))}>-</button>
            <input value={qty} onChange={e=>setQty(Number(e.target.value) || 1)} style={{width:90}} />
            <button className="btn btn-outline" onClick={()=>setQty(Math.min(product.stock, qty+1))}>+</button>
          </div>
          <div className="stack" style={{marginTop:14}}>
            <button className="btn btn-primary" onClick={addToCart}>Agregar al carrito</button>
            <Link className="btn btn-outline" to="/cart">Ver carrito</Link>
            <Link className="btn btn-outline" to="/shop/products">Volver</Link>
          </div>
        </section>
      </div>

      {product.related?.length > 0 && (
        <section className="page">
          <h2>Relacionados</h2>
          <div className="product-grid">
            {product.related.map(r => (
              <article key={r.id} className="product-card">
                <div className="product-image">{r.name.charAt(0)}</div>
                <div className="product-body">
                  <div className="small">{r.brandName}</div>
                  <h3>{r.name}</h3>
                  <div className="stack" style={{justifyContent:'space-between', alignItems:'center'}}>
                    <strong>${r.salePrice?.toLocaleString('es-CO')}</strong>
                    <Link className="btn btn-primary" to={`/shop/products/${r.id}`}>Ver</Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
