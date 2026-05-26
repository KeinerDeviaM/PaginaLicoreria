import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import { useToast } from '../toast';

const money = (value) => `$${Number(value || 0).toLocaleString('es-CO')}`;

export default function ProductPage() {
  const { id } = useParams();
  const { showToast } = useToast();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [errorText, setErrorText] = useState('');

  async function load() {
    try {
      setLoading(true);
      setErrorText('');

      const { data } = await api.get('/shop/catalog');
      const products = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : [];

      const found = products.find(
        (p) => String(p.id) === String(id) || String(p.productId) === String(id)
      );

      if (!found) {
        setItem(null);
        setErrorText('No fue posible cargar el detalle del producto.');
        return;
      }

      setItem(found);
    } catch (err) {
      setItem(null);
      setErrorText(err.response?.data?.message || err.message || 'No fue posible cargar el detalle del producto.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  const stockLabel = useMemo(() => {
    const stock = Number(item?.stock || 0);
    if (stock <= 0) return { text: 'Agotado', cls: 'danger' };
    if (stock <= 5) return { text: 'Últimas unidades', cls: 'warning' };
    return { text: 'Disponible', cls: 'success' };
  }, [item]);

  async function handleAddToCart() {
    if (!item) return;

    if (Number(quantity) <= 0) {
      showToast({
        type: 'warning',
        title: 'Cantidad inválida',
        text: 'La cantidad debe ser mayor a 0.'
      });
      return;
    }

    if (Number(quantity) > Number(item.stock || 0)) {
      showToast({
        type: 'warning',
        title: 'Stock insuficiente',
        text: `Solo hay ${item.stock || 0} unidades disponibles.`
      });
      return;
    }

    try {
      await api.post('/cart/items', {
        productId: item.id || item.productId,
        quantity: Number(quantity)
      });

      showToast({
        type: 'success',
        title: 'Agregado al carrito',
        text: `${item.name} fue agregado correctamente.`
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'No se pudo agregar',
        text: err.response?.data?.message || 'Ocurrió un error al agregar al carrito.'
      });
    }
  }

  if (loading) {
    return (
      <div className="page">
        <section className="card">
          <div className="notice">Cargando producto...</div>
        </section>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="page">
        <section className="card">
          <h3>Producto no encontrado</h3>
          <p className="small">{errorText || 'No fue posible cargar el detalle del producto.'}</p>
          <div style={{ marginTop: 14 }}>
            <Link to="/shop/products" className="btn btn-outline">Volver al catálogo</Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page">
      <section className="card reveal-on-scroll hero" style={{ marginBottom: 18 }}>
        <div className="small" style={{ color: '#d4af37', marginBottom: 8 }}>
          {item.categoryName || 'Categoría'} · {item.brandName || 'Marca'}
        </div>
        <h1 style={{ marginBottom: 10 }}>{item.name}</h1>
        <p className="small" style={{ maxWidth: 760, lineHeight: 1.8 }}>
          {item.description || 'Producto disponible en nuestro catálogo.'}
        </p>
      </section>

      <section className="card reveal-on-scroll">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.05fr 0.95fr',
            gap: 24,
            alignItems: 'start'
          }}
        >
          <div>
            <div
              className="product-image-wrap"
              style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015))',
                padding: 18,
                borderRadius: 22
              }}
            >
              <img
                src={item.imageUrl || 'https://via.placeholder.com/900x1100?text=Producto'}
                alt={item.name}
                style={{
                  width: '100%',
                  height: 620,
                  objectFit: 'cover',
                  borderRadius: 18,
                  display: 'block'
                }}
              />
            </div>
          </div>

          <div>
            <div className="card" style={{ marginBottom: 16, background: 'rgba(255,255,255,0.02)' }}>
              <div className="stack" style={{ justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div>
                  <div className="small">Precio</div>
                  <strong
                    className="price"
                    style={{
                      fontSize: '2rem',
                      color: '#d4af37',
                      lineHeight: 1.1,
                      display: 'block',
                      marginTop: 6
                    }}
                  >
                    {money(item.salePrice)}
                  </strong>
                </div>

                <div>
                  <span className={`badge ${stockLabel.cls}`}>{stockLabel.text}</span>
                </div>
              </div>
            </div>

            <div
              className="panel-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
                marginBottom: 16
              }}
            >
              <div className="info-tile">
                <div className="small">Stock disponible</div>
                <strong>{item.stock || 0}</strong>
              </div>
              <div className="info-tile">
                <div className="small">Volumen</div>
                <strong>{item.volumeMl || 0} ml</strong>
              </div>
              <div className="info-tile">
                <div className="small">Alcohol</div>
                <strong>{item.alcohol || 0}%</strong>
              </div>
              <div className="info-tile">
                <div className="small">Código</div>
                <strong>{item.code || 'No disponible'}</strong>
              </div>
            </div>

            <div className="card" style={{ marginBottom: 16 }}>
              <h3 style={{ marginBottom: 12 }}>Comprar este producto</h3>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '130px 1fr',
                  gap: 12,
                  alignItems: 'end'
                }}
              >
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Cantidad</label>
                  <input
                    type="number"
                    min="1"
                    max={item.stock || 1}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>

                <button
                  className="btn btn-primary"
                  onClick={handleAddToCart}
                  disabled={Number(item.stock || 0) <= 0}
                  style={{ minHeight: 44 }}
                >
                  {Number(item.stock || 0) <= 0 ? 'Producto agotado' : 'Agregar al carrito'}
                </button>
              </div>

              <div className="small" style={{ marginTop: 12, lineHeight: 1.7 }}>
                Compra rápida y revisa tu pedido antes de confirmar el pago.
              </div>
            </div>

            <div className="card" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <h3 style={{ marginBottom: 12 }}>Información del producto</h3>
              <div className="small" style={{ lineHeight: 1.9 }}>
                <p><strong>Marca:</strong> {item.brandName || 'No disponible'}</p>
                <p><strong>Categoría:</strong> {item.categoryName || 'No disponible'}</p>
                <p><strong>Presentación:</strong> {item.volumeMl || 0} ml</p>
                <p><strong>Graduación alcohólica:</strong> {item.alcohol || 0}%</p>
                <p><strong>Descripción:</strong> {item.description || 'Sin descripción adicional.'}</p>
              </div>
            </div>

            <div className="stack" style={{ gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
              <Link to="/shop/products" className="btn btn-outline">Volver al catálogo</Link>
              <Link to="/cart" className="btn btn-outline">Ir al carrito</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="card reveal-on-scroll" style={{ marginTop: 18 }}>
        <div className="grid grid-3">
          <div className="card" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <h3>Ideal para compartir</h3>
            <p className="small">Una excelente opción para reuniones, celebraciones o para disfrutar en casa.</p>
          </div>
          <div className="card" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <h3>Compra con confianza</h3>
            <p className="small">Consulta el precio, la presentación y la disponibilidad antes de hacer tu pedido.</p>
          </div>
          <div className="card" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <h3>Haz tu pedido hoy</h3>
            <p className="small">Agrega este producto al carrito y completa tu compra de forma rápida y sencilla.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

