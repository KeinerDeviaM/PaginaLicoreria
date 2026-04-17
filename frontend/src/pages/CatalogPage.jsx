import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { getAuth } from '../auth';

const normalize = (value) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

function money(value) {
  return `$${Number(value || 0).toLocaleString('es-CO')}`;
}

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

  useEffect(() => {
    load();
  }, []);

  async function addToCart(productId) {
    if (!user || user.role !== 'CLIENTE') {
      navigate('/login');
      return;
    }

    try {
      await api.post('/cart/items', {
        productId,
        quantity: 1
      });

      setMsg({ type: 'success', text: 'Producto agregado al carrito.' });
    } catch (err) {
      setMsg({
        type: 'error',
        text: err.response?.data?.message || 'No se pudo agregar al carrito.'
      });
    }
  }

  const filteredProducts = useMemo(() => {
    const term = normalize(q).trim();
    if (!term) return products;

    return products.filter((product) => {
      const searchable = [
        product.name,
        product.code,
        product.description,
        product.brandName,
        product.categoryName
      ]
        .map(normalize)
        .join(' ');

      return searchable.includes(term);
    });
  }, [products, q]);

  return (
    <div className="container page">
      <div
        className="stack"
        style={{
          justifyContent: 'space-between',
          alignItems: 'end',
          gap: 16,
          flexWrap: 'wrap'
        }}
      >
        <div>
          <h1>Catálogo</h1>
          <p className="small">Busca productos por nombre, código, marca o categoría.</p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9ca3af',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.3-4.3"></path>
              </svg>
            </span>

            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar producto..."
              style={{ minWidth: 280, paddingLeft: 36 }}
            />
          </div>

          <button className="btn btn-primary" onClick={() => load(q)}>
            Buscar
          </button>

          <button
            className="btn btn-outline"
            onClick={() => {
              setQ('');
              load('');
            }}
          >
            Limpiar
          </button>
        </div>
      </div>

      {msg && <div className={`notice ${msg.type}`}>{msg.text}</div>}
      {loading && <div className="notice">Cargando productos...</div>}
      {error && <div className="notice error">{error}</div>}

      {!loading && !error && (
        <>
          <p className="small" style={{ marginTop: 16 }}>
            {q.trim()
              ? `Resultados encontrados: ${filteredProducts.length}`
              : `Productos disponibles: ${filteredProducts.length}`}
          </p>

          <div className="product-grid">
            {filteredProducts.map((product) => (
              <article key={product.id} className="product-card">
                <div className="product-image">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    product.name?.charAt(0)
                  )}
                </div>

                <div className="product-body">
                  <div className="small">{product.brandName} · {product.categoryName}</div>
                  <h3>{product.name}</h3>
                  <p className="small">{product.volumeMl} ml · {product.alcohol}° · Stock {product.stock}</p>

                  <div className="stack" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                    <strong>{money(product.salePrice)}</strong>

                    <div className="stack" style={{ gap: 8, flexWrap: 'wrap' }}>
                      <button className="btn btn-primary" onClick={() => addToCart(product.id)}>
                        Agregar al carrito
                      </button>

                      <Link className="btn btn-outline" to={`/shop/products/${product.id}`}>
                        Ver detalle
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="notice" style={{ marginTop: 18 }}>
              No se encontraron productos con esa búsqueda.
            </div>
          )}
        </>
      )}
    </div>
  );
}
