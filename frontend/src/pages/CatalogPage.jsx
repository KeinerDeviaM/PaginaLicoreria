import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function CatalogPage() {
  const [products, setProducts] = useState([]);
  const [q, setQ] = useState('');

  async function load(search = '') {
    const { data } = await api.get('/shop/catalog', { params: search ? { q: search } : {} });
    setProducts(data);
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="container page">
      <div className="stack" style={{justifyContent:'space-between', alignItems:'end'}}>
        <div>
          <h1>Catálogo</h1>
          <p className="small">Explora nuestra selección disponible.</p>
        </div>
        <div className="stack">
          <input placeholder="Buscar..." value={q} onChange={e=>setQ(e.target.value)} style={{minWidth:260}} />
          <button className="btn btn-primary" onClick={()=>load(q)}>Buscar</button>
          <button className="btn btn-outline" onClick={()=>{setQ(''); load('');}}>Limpiar</button>
        </div>
      </div>
      <div className="product-grid">
        {products.map(product => (
          <article key={product.id} className="product-card">
            <div className="product-image">{product.name.charAt(0)}</div>
            <div className="product-body">
              <div className="small">{product.brandName} · {product.categoryName}</div>
              <h3>{product.name}</h3>
              <p className="small">{product.volumeMl} ml · {product.alcohol}° · Stock {product.stock}</p>
              <div className="stack" style={{justifyContent:'space-between', alignItems:'center'}}>
                <strong>${product.salePrice?.toLocaleString('es-CO')}</strong>
                <Link className="btn btn-primary" to={`/shop/products/${product.id}`}>Ver detalle</Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
