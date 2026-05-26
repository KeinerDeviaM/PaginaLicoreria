import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { getAuth } from '../auth';

const money = (value) => `$${Number(value || 0).toLocaleString('es-CO')}`;

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = getAuth();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    api.get(`/shop/products/${id}`)
      .then(({ data }) => setProduct(data.data || data))
      .catch((err) => setError(err.response?.data?.message || 'No se pudo cargar el producto.'));
  }, [id]);

  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 2800);
    return () => clearTimeout(t);
  }, [msg]);

  async function addToCart(goCheckout = false) {
    if (!user || user.role !== 'CLIENTE') return navigate('/login');

    const stock = Number(product?.stock || 0);
    const qty = Number(quantity || 0);

    if (stock <= 0) {
      setMsg({
        type: 'warning',
        title: 'Producto agotado',
        text: 'Este producto no tiene unidades disponibles en este momento.'
      });
      return;
    }

    if (!Number.isFinite(qty) || qty <= 0) {
      setMsg({
        type: 'warning',
        title: 'Cantidad inválida',
        text: 'Debes seleccionar una cantidad válida para continuar.'
      });
      return;
    }

    if (qty > stock) {
      setMsg({
        type: 'warning',
        title: 'Stock insuficiente',
        text: `Solo hay ${stock} unidad${stock === 1 ? '' : 'es'} disponible${stock === 1 ? '' : 's'} de este producto.`
      });
      return;
    }

    try {
      await api.post('/cart/items', { productId: product.id, quantity: qty });

      if (goCheckout) return navigate('/checkout');

      setMsg({
        type: 'success',
        title: 'Agregado con éxito',
        text: `${product.name} fue agregado al carrito correctamente.`
      });
    } catch (err) {
      const serverMessage = err.response?.data?.message || 'No se pudo agregar el producto.';
      const isStockIssue = /stock insuficiente/i.test(serverMessage);

      setMsg({
        type: isStockIssue ? 'warning' : 'error',
        title: isStockIssue ? 'No hay suficiente stock' : 'No se pudo agregar',
        text: isStockIssue
          ? `No puedes agregar ${qty} unidad${qty === 1 ? '' : 'es'} porque no hay suficientes disponibles.`
          : serverMessage
      });
    }
  }

  if (error) return <div className="container page"><div className="notice error">{error}</div></div>;
  if (!product) return <div className="container page"><div className="notice">Cargando producto...</div></div>;

  const stock = Number(product.stock || 0);
  const outOfStock = stock <= 0;
  const lowStock = stock > 0 && stock <= 3;

  return (
    <div className="container page">
      {msg && (
        <div className={`floating-toast ${msg.type}`}>
          <div className="floating-toast-icon">
            {msg.type === 'success' ? '✓' : msg.type === 'warning' ? '!' : '×'}
          </div>
          <div>
            <strong>{msg.title}</strong>
            <div>{msg.text}</div>
          </div>
        </div>
      )}

      <div className="grid-2" style={{ alignItems: 'start', gap: 20 }}>
        <section className="card">
          <div style={{ width: '100%', height: 420, borderRadius: 18, overflow: 'hidden', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ fontSize: 80, fontWeight: 800, color: '#d4af37' }}>{String(product.name || 'P').charAt(0)}</div>
            )}
          </div>
        </section>

        <section className="card">
          <div className="small" style={{ marginBottom: 8 }}>{product.brandName} · {product.categoryName}</div>
          <h1 style={{ marginBottom: 10 }}>{product.name}</h1>
          <p style={{ marginBottom: 18 }}>{product.description || 'Producto disponible en el catálogo.'}</p>

          <div className="grid grid-2">
            <div className="card"><div className="small">Precio de venta</div><strong style={{ fontSize: 24 }}>{money(product.salePrice)}</strong></div>
            <div className="card"><div className="small">Volumen</div><strong>{product.volumeMl} ml</strong></div>
            <div className="card"><div className="small">Alcohol</div><strong>{product.alcohol}°</strong></div>
            <div className="card">
              <div className="small">Disponibilidad</div>
              <strong>{stock}</strong>
              <div style={{ marginTop: 10 }}>
                <span className={`stock-pill ${outOfStock ? 'danger' : lowStock ? 'warning' : 'success'}`}>
                  {outOfStock ? 'Agotado' : lowStock ? `Últimas ${stock} unidades` : 'Disponible para compra'}
                </span>
              </div>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: 18 }}>
            <label>Cantidad</label>
            <input
              type="number"
              min="1"
              max={Math.max(stock, 1)}
              disabled={outOfStock}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
            {!outOfStock && (
              <div className="small" style={{ marginTop: 8 }}>
                Puedes comprar hasta {stock} unidad{stock === 1 ? '' : 'es'}.
              </div>
            )}
          </div>

          <div className="stack" style={{ gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
            <button className={`btn ${outOfStock ? 'btn-outline' : 'btn-primary'}`} disabled={outOfStock} onClick={() => addToCart(false)}>
              {outOfStock ? 'Sin stock' : 'Agregar al carrito'}
            </button>
            <button className="btn btn-outline" disabled={outOfStock} onClick={() => addToCart(true)}>Comprar ahora</button>
            <Link className="btn btn-outline" to="/shop/products">Volver al catálogo</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
