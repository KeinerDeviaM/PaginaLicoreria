import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { getAuth } from '../auth';

function money(value) {
  return `$${Number(value || 0).toLocaleString('es-CO')}`;
}

const highlights = [
  'Inventario y ventas sincronizados',
  'Pagos y facturas en el mismo flujo',
  'Roles para admin, trabajador y cliente'
];

export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [msg, setMsg] = useState(null);
  const navigate = useNavigate();
  const { user } = getAuth();

  useEffect(() => {
    api.get('/shop/home').then(({ data }) => setFeatured(data.featuredProducts || []));
  }, []);

  const stats = useMemo(
    () => [
      { value: `${featured.length}+`, label: 'Referencias destacadas' },
      { value: '24/7', label: 'Vista del catálogo' },
      { value: '3', label: 'Roles conectados' }
    ],
    [featured.length]
  );

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
        text: err.response?.data?.message || 'No se pudo agregar el producto al carrito.'
      });
    }
  }

  return (
    <div className="container page">
      <section className="hero">
        <div className="hero-grid">
          <div className="hero-copy glass-card reveal-up">
            <div className="eyebrow">Licorería premium</div>
            <h1>Una tienda con presencia fuerte y operación completa.</h1>
            <p>
              Compra, administra y controla tu licorería desde un mismo entorno. El catálogo se ve
              mejor, las acciones importantes pesan más y la experiencia ya no se siente estática.
            </p>

            <div className="chip-list">
              {highlights.map((item) => (
                <span key={item} className="chip">
                  {item}
                </span>
              ))}
            </div>

            <div className="stack hero-actions">
              <Link className="btn btn-primary" to="/shop/products">
                Ver catálogo
              </Link>
              {user?.role === 'CLIENTE' ? (
                <Link className="btn btn-outline" to="/cart">
                  Ir al carrito
                </Link>
              ) : (
                <Link className="btn btn-wine" to="/register">
                  Crear cuenta
                </Link>
              )}
            </div>
          </div>

          <aside className="hero-panel glass-card reveal-up reveal-delay-1">
            <div className="hero-panel-top">
              <div className="hero-panel-title">
                <div className="small">Panel visual</div>
                <h3>Presencia premium con foco en conversión</h3>
                <p className="small">
                  El objetivo aquí es que el usuario entienda rápido, navegue mejor y sienta una
                  interfaz más viva.
                </p>
              </div>
              <div className="hero-orb" />
            </div>

            <div className="hero-kpis">
              {stats.map((item, index) => (
                <div key={item.label} className={`hero-kpi reveal-up reveal-delay-${Math.min(index + 2, 4)}`}>
                  <strong>{item.value}</strong>
                  <span className="small">{item.label}</span>
                </div>
              ))}
            </div>

            <div className="hero-note">
              Productos destacados, búsqueda clara y acciones principales visibles desde el primer
              pliegue.
            </div>
          </aside>
        </div>
      </section>

      {msg && <div className={`notice ${msg.type}`}>{msg.text}</div>}

      <section className="stats-strip">
        <article className="stat-card reveal-up">
          <span className="small">Catálogo</span>
          <strong>Más claro</strong>
          <p className="small">Tarjetas con jerarquía visual, hover útil y mejor lectura del precio.</p>
        </article>
        <article className="stat-card reveal-up reveal-delay-1">
          <span className="small">Navegación</span>
          <strong>Más directa</strong>
          <p className="small">CTA principales arriba y accesos rápidos según el rol del usuario.</p>
        </article>
        <article className="stat-card reveal-up reveal-delay-2">
          <span className="small">Sensación</span>
          <strong>Menos rígida</strong>
          <p className="small">Fondo con profundidad, animaciones suaves y ritmo visual consistente.</p>
        </article>
      </section>

      <section>
        <div className="section-heading">
          <div>
            <div className="eyebrow">Selección</div>
            <h2>Productos destacados</h2>
            <p className="small">Una muestra rápida para llevar al usuario al detalle o al carrito.</p>
          </div>
          <Link to="/shop/products" className="btn btn-outline">
            Ver todos
          </Link>
        </div>

        <div className="product-grid">
          {featured.map((product, index) => (
            <article
              key={product.id}
              className={`product-card reveal-up reveal-delay-${(index % 4) + 1}`}
            >
              <div className="product-image">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} />
                ) : (
                  product.name.charAt(0)
                )}
              </div>

              <div className="product-body">
                <div className="small">
                  {product.brandName} · {product.categoryName}
                </div>
                <h3>{product.name}</h3>
                <p className="small product-copy">{product.description}</p>

                <div
                  className="stack"
                  style={{ justifyContent: 'space-between', alignItems: 'center', gap: 10 }}
                >
                  <strong className="price-tag">{money(product.salePrice)}</strong>

                  <div className="stack" style={{ gap: 8 }}>
                    <button className="btn btn-primary" onClick={() => addToCart(product.id)}>
                      Agregar
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
      </section>
    </div>
  );
}
