import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { getAuth } from '../auth';

function money(value) {
  return `$${Number(value || 0).toLocaleString('es-CO')}`;
}

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = getAuth();

  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState(null);
  const [quantity, setQuantity] = useState(1);

  async function load() {
    try {
      setError('');
      const { data } = await api.get(`/shop/products/${id}`);
      setProduct(data?.data || data);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo cargar el producto.');
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function addToCart(goCheckout = false) {
    if (!user || user.role !== 'CLIENTE') {
      navigate('/login');
      return;
    }

    try {
      await api.post('/cart/items', {
        productId: product.id,
        quantity: Number(quantity)
      });

      if (goCheckout) {
        navigate('/checkout');
        return;
      }

      setMsg({ type: 'success', text: 'Producto agregado al carrito.' });
    } catch (err) {
      setMsg({
        type: 'error',
        text: err.response?.data?.message || 'No se pudo agregar el producto al carrito.'
      });
    }
  }

  if (error) {
    return (
      <div className="container page">
        <div className="notice error">{error}</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container page">
        <div className="notice">Cargando producto...</div>
      </div>
    );
  }

  const lowStock = Number(product.stock || 0) <= Number(product.minimumStock || 0);

  return (
    <div className="container page page-shell">
      {msg && <div className={`notice ${msg.type}`}>{msg.text}</div>}

      <div className="page-header">
        <div>
          <div className="eyebrow">Detalle premium</div>
          <h1>{product.name}</h1>
          <p className="small">
            {product.brandName} · {product.categoryName}
          </p>
        </div>
        <Link className="btn btn-outline" to="/shop/products">
          Volver al catalogo
        </Link>
      </div>

      <div className="product-detail">
        <section className="product-stage glass-card reveal-up">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} />
          ) : (
            <div className="product-placeholder">{String(product.name || 'P').charAt(0)}</div>
          )}
        </section>

        <section className="product-detail-card reveal-up reveal-delay-1">
          <div className="stack" style={{ gap: 10, marginBottom: 14 }}>
            <span className={`badge ${product.active ? 'success' : 'danger'}`}>
              {product.active ? 'Disponible' : 'Inactivo'}
            </span>
            {lowStock && <span className="badge warning">Stock bajo</span>}
          </div>

          <p className="small" style={{ fontSize: '0.98rem', lineHeight: 1.7 }}>
            {product.description || 'Producto disponible en el catalogo.'}
          </p>

          <div className="inventory-banner">
            Precio de venta: <strong className="price-tag">{money(product.salePrice)}</strong>
          </div>

          <div className="product-meta-grid">
            <div className="info-tile">
              <div className="small">Volumen</div>
              <strong>{product.volumeMl} ml</strong>
            </div>
            <div className="info-tile">
              <div className="small">Alcohol</div>
              <strong>{product.alcohol}°</strong>
            </div>
            <div className="info-tile">
              <div className="small">Stock actual</div>
              <strong>{product.stock}</strong>
            </div>
            <div className="info-tile">
              <div className="small">Stock minimo</div>
              <strong>{product.minimumStock || 0}</strong>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: 18 }}>
            <label>Cantidad</label>
            <input
              type="number"
              min="1"
              max={Math.max(Number(product.stock || 1), 1)}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          <div className="stack" style={{ gap: 10, marginTop: 18 }}>
            <button className="btn btn-primary" onClick={() => addToCart(false)}>
              Agregar al carrito
            </button>

            <button className="btn btn-wine" onClick={() => addToCart(true)}>
              Comprar ahora
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
