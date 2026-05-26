import React from 'react';
import { Link } from 'react-router-dom';

const heroImages = [
  'https://images.pexels.com/photos/602750/pexels-photo-602750.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/1283219/pexels-photo-1283219.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'https://images.pexels.com/photos/301692/pexels-photo-301692.jpeg?auto=compress&cs=tinysrgb&w=1200'
];

const categories = [
  {
    title: 'Whiskies',
    text: 'Botellas ideales para regalar, coleccionar o disfrutar en ocasiones especiales.',
    image: 'https://images.pexels.com/photos/5947020/pexels-photo-5947020.jpeg?auto=compress&cs=tinysrgb&w=1200'
  },
  {
    title: 'Vinos',
    text: 'Encuentra opciones para cenas, celebraciones y momentos que merecen una buena copa.',
    image: 'https://images.pexels.com/photos/1407846/pexels-photo-1407846.jpeg?auto=compress&cs=tinysrgb&w=1200'
  },
  {
    title: 'Cervezas',
    text: 'Alternativas frescas y prácticas para reuniones, eventos y fines de semana.',
    image: 'https://images.pexels.com/photos/1552630/pexels-photo-1552630.jpeg?auto=compress&cs=tinysrgb&w=1200'
  }
];

const featured = [
  {
    name: 'Whisky premium',
    price: 'Desde $95.000',
    image: 'https://images.pexels.com/photos/5947020/pexels-photo-5947020.jpeg?auto=compress&cs=tinysrgb&w=1200'
  },
  {
    name: 'Vinos seleccionados',
    price: 'Desde $42.000',
    image: 'https://images.pexels.com/photos/1407846/pexels-photo-1407846.jpeg?auto=compress&cs=tinysrgb&w=1200'
  },
  {
    name: 'Ron y tequila',
    price: 'Desde $78.000',
    image: 'https://images.pexels.com/photos/1283219/pexels-photo-1283219.jpeg?auto=compress&cs=tinysrgb&w=1200'
  }
];

const fallbackImage = 'https://images.pexels.com/photos/602750/pexels-photo-602750.jpeg?auto=compress&cs=tinysrgb&w=1200';

function SafeImage({ src, alt, style }) {
  return (
    <img
      src={src}
      alt={alt}
      style={style}
      onError={(e) => {
        if (e.currentTarget.src !== fallbackImage) {
          e.currentTarget.src = fallbackImage;
        }
      }}
    />
  );
}

export default function HomePage() {
  return (
    <div className="page">
      <section
        className="card reveal-on-scroll hero"
        style={{
          marginBottom: 22,
          padding: 32,
          background: `
            radial-gradient(circle at top left, rgba(212,175,55,0.14), transparent 22%),
            radial-gradient(circle at right center, rgba(255,255,255,0.05), transparent 20%),
            linear-gradient(135deg, rgba(18,18,18,0.98), rgba(10,10,10,0.96))
          `
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.15fr 0.85fr',
            gap: 24,
            alignItems: 'center'
          }}
        >
          <div>
            <div
              className="small"
              style={{
                display: 'inline-block',
                padding: '8px 14px',
                borderRadius: 999,
                border: '1px solid rgba(212,175,55,0.28)',
                background: 'rgba(212,175,55,0.08)',
                color: '#d4af37',
                marginBottom: 14
              }}
            >
              Licores, vinos, cervezas y más
            </div>

            <h1
              style={{
                fontSize: 'clamp(2.3rem, 5vw, 4.5rem)',
                lineHeight: 1.05,
                marginBottom: 14,
                maxWidth: 760
              }}
            >
              Encuentra tus bebidas favoritas al mejor precio y en un solo lugar
            </h1>

            <p
              className="small"
              style={{
                fontSize: '1rem',
                lineHeight: 1.8,
                maxWidth: 680,
                marginBottom: 22
              }}
            >
              Compra whiskies, rones, vodkas, tequilas, vinos y cervezas con una experiencia rápida,
              clara y pensada para que encuentres lo que buscas sin complicaciones.
            </p>

            <div className="stack" style={{ gap: 12, flexWrap: 'wrap' }}>
              <Link to="/shop/products" className="btn btn-primary">Comprar ahora</Link>
              <Link to="/cart" className="btn btn-outline">Ver carrito</Link>
            </div>
          </div>

          <div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12
              }}
            >
              <div className="product-image-wrap" style={{ gridRow: 'span 2' }}>
                <SafeImage
                  src={heroImages[0]}
                  alt="Bebidas premium"
                  style={{ width: '100%', height: 360, objectFit: 'cover', borderRadius: 18 }}
                />
              </div>

              <div className="product-image-wrap">
                <SafeImage
                  src={heroImages[1]}
                  alt="Botella destacada"
                  style={{ width: '100%', height: 172, objectFit: 'cover', borderRadius: 18 }}
                />
              </div>

              <div className="product-image-wrap">
                <SafeImage
                  src={heroImages[2]}
                  alt="Selección de licores"
                  style={{ width: '100%', height: 172, objectFit: 'cover', borderRadius: 18 }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="card reveal-on-scroll" style={{ marginBottom: 22 }}>
        <div className="page-header">
          <div>
            <div className="small" style={{ color: '#d4af37', marginBottom: 8 }}>Compra por categoría</div>
            <h2 style={{ marginBottom: 8 }}>Explora lo más buscado</h2>
            <p className="small" style={{ maxWidth: 760, lineHeight: 1.8 }}>
              Encuentra más rápido lo que quieres tomar hoy.
            </p>
          </div>
        </div>

        <div className="grid grid-3" style={{ marginTop: 18 }}>
          {categories.map((item) => (
            <article key={item.title} className="card reveal-on-scroll catalog-card">
              <div className="product-image-wrap" style={{ marginBottom: 14 }}>
                <SafeImage
                  src={item.image}
                  alt={item.title}
                  style={{ width: '100%', height: 240, objectFit: 'cover', borderRadius: 16 }}
                />
              </div>
              <h3 style={{ marginBottom: 8 }}>{item.title}</h3>
              <p className="small" style={{ lineHeight: 1.7 }}>{item.text}</p>
              <div style={{ marginTop: 14 }}>
                <Link to="/shop/products" className="btn btn-outline">Ver categoría</Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="card reveal-on-scroll" style={{ marginBottom: 22 }}>
        <div className="page-header">
          <div>
            <div className="small" style={{ color: '#d4af37', marginBottom: 8 }}>Destacados</div>
            <h2 style={{ marginBottom: 8 }}>Ideas para comprar hoy</h2>
            <p className="small" style={{ maxWidth: 760, lineHeight: 1.8 }}>
              Algunas opciones que pueden llamar la atención del cliente desde la página principal.
            </p>
          </div>
        </div>

        <div className="grid grid-3" style={{ marginTop: 18 }}>
          {featured.map((item) => (
            <article key={item.name} className="card reveal-on-scroll catalog-card">
              <div className="product-image-wrap" style={{ marginBottom: 14 }}>
                <SafeImage
                  src={item.image}
                  alt={item.name}
                  style={{ width: '100%', height: 260, objectFit: 'cover', borderRadius: 16 }}
                />
              </div>

              <div className="small" style={{ color: '#d4af37', marginBottom: 8 }}>Producto destacado</div>
              <h3 style={{ marginBottom: 8 }}>{item.name}</h3>
              <p className="small" style={{ marginBottom: 12 }}>{item.price}</p>

              <Link to="/shop/products" className="btn btn-primary">Ver catálogo</Link>
            </article>
          ))}
        </div>
      </section>

      <section
        className="card reveal-on-scroll"
        style={{
          background: 'linear-gradient(135deg, rgba(212,175,55,0.08), rgba(255,255,255,0.02))',
          border: '1px solid rgba(212,175,55,0.18)'
        }}
      >
        <div className="stack" style={{ justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div className="small" style={{ color: '#d4af37', marginBottom: 8 }}>Empieza ahora</div>
            <h2 style={{ marginBottom: 8 }}>Explora el catálogo y haz tu pedido hoy</h2>
            <p className="small" style={{ lineHeight: 1.8 }}>
              Entra al catálogo, elige tus productos favoritos y compra de forma rápida.
            </p>
          </div>

          <div className="stack" style={{ gap: 10, flexWrap: 'wrap' }}>
            <Link to="/shop/products" className="btn btn-primary">Ver productos</Link>
            <Link to="/orders" className="btn btn-outline">Mis pedidos</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
