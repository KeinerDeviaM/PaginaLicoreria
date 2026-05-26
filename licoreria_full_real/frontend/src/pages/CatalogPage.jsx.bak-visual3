import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { getAuth } from '../auth';

const normalize = (value) => String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const money = (value) => `$${Number(value || 0).toLocaleString('es-CO')}`;

export default function CatalogPage() {
  const [products, setProducts] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState(null);
  const navigate = useNavigate();
  const { user } = getAuth();

  async function load(search = '') {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get('/shop/catalog', { params: search ? { q: search } : {} });
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'No se pudo cargar catálogo');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 2600);
    return () => clearTimeout(t);
  }, [msg]);

  async function addToCart(product) {
    if (!user || user.role !== 'CLIENTE') return navigate('/login');

    if (Number(product.stock || 0) <= 0) {
      setMsg({
        type: 'warning',
        title: 'Sin stock disponible',
        text: `Lo sentimos, ${product.name} no tiene unidades disponibles en este momento.`
      });
      return;
    }

    try {
      await api.post('/cart/items', { productId: product.id, quantity: 1 });
      setMsg({
        type: 'success',
        title: 'Agregado con éxito',
        text: `${product.name} fue agregado al carrito correctamente.`
      });
    } catch (err) {
      const serverMessage = err.response?.data?.message || 'No se pudo agregar al carrito.';
      const isStockIssue = /stock insuficiente/i.test(serverMessage);

      setMsg({
        type: isStockIssue ? 'warning' : 'error',
        title: isStockIssue ? 'No hay suficiente stock' : 'No se pudo agregar',
        text: isStockIssue
          ? `No puedes agregar más unidades de ${product.name} porque no hay suficientes disponibles.`
          : serverMessage
      });
    }
  }

  const filteredProducts = useMemo(() => {
    const term = normalize(q).trim();
    if (!term) return products;
    return products.filter((product) => [product.name, product.code, product.description, product.brandName, product.categoryName].map(normalize).join(' ').includes(term));
  }, [products, q]);

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

      <div className="stack" style={{ justifyContent: 'space-between', alignItems: 'end', gap: 16, flexWrap: 'wrap' }}>
        <div><h1>Catálogo</h1><p className="small">Busca productos por nombre, código, marca o categoría.</p></div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar producto..." style={{ minWidth: 280 }} />
          <button className="btn btn-primary" onClick={() => load(q)}>Buscar</button>
          <button className="btn btn-outline" onClick={() => { setQ(''); load(''); }}>Limpiar</button>
        </div>
      </div>

      {loading && <div className="notice">Cargando productos...</div>}
      {error && <div className="notice error">{error}</div>}

      {!loading && !error && (
        <>
          <p className="small" style={{ marginTop: 16 }}>
            {q.trim() ? `Resultados encontrados: ${filteredProducts.length}` : `Productos disponibles: ${filteredProducts.length}`}
          </p>

          <div className="product-grid">
            {filteredProducts.map((product) => {
              const outOfStock = Number(product.stock || 0) <= 0;
              const lowStock = Number(product.stock || 0) > 0 && Number(product.stock || 0) <= 3;

              return (
                <article key={product.id} className={`product-card ${outOfStock ? 'product-card-out' : ''}`}>
                  <div className="product-image">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : product.name?.charAt(0)}
                  </div>

                  <div className="product-body">
                    <div className="small">{product.brandName} · {product.categoryName}</div>
                    <h3>{product.name}</h3>
                    <p className="small">{product.volumeMl} ml · {product.alcohol}°</p>

                    <div className="product-stock-row">
                      <span className={`stock-pill ${outOfStock ? 'danger' : lowStock ? 'warning' : 'success'}`}>
                        {outOfStock ? 'Agotado' : lowStock ? `Últimas ${product.stock} unidades` : `Disponible: ${product.stock}`}
                      </span>
                    </div>

                    <div className="stack" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                      <strong>{money(product.salePrice)}</strong>
                      <div className="stack" style={{ gap: 8 }}>
                        <button
                          className={`btn ${outOfStock ? 'btn-outline' : 'btn-primary'}`}
                          disabled={outOfStock}
                          onClick={() => addToCart(product)}
                          title={outOfStock ? 'Producto agotado' : 'Agregar al carrito'}
                        >
                          {outOfStock ? 'Sin stock' : 'Agregar al carrito'}
                        </button>
                        <Link className="btn btn-outline" to={`/shop/products/${product.id}`}>Ver detalle</Link>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {filteredProducts.length === 0 && <div className="notice" style={{ marginTop: 18 }}>No se encontraron productos con esa búsqueda.</div>}
        </>
      )}
    </div>
  );
}
