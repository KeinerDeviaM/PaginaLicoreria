import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function AlertsPage() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/alerts').then(({ data }) => setRows(data.data || data)).catch((err) => setError(err.response?.data?.message || 'No se pudieron cargar las alertas.'));
  }, []);

  return (
    <div className="page">
      <div className="stack" style={{ justifyContent: 'space-between', alignItems: 'end', gap: 16, flexWrap: 'wrap' }}><div><h1>Alertas de inventario</h1><p className="small">Productos con stock por debajo del mínimo configurado.</p></div></div>
      {error && <div className="notice error">{error}</div>}
      {!rows.length ? <div className="notice" style={{ marginTop: 16 }}>No hay alertas activas.</div> : <div className="card" style={{ marginTop: 16, border: '1px solid rgba(255,193,7,0.28)', background: 'rgba(255,193,7,0.06)' }}><div className="table-wrap"><table><thead><tr><th>Código</th><th>Producto</th><th>Categoría</th><th>Marca</th><th>Stock</th><th>Mínimo</th><th>Faltante</th></tr></thead><tbody>{rows.map((r) => <tr key={r.id}><td>{r.code}</td><td>{r.name}</td><td>{r.categoryName}</td><td>{r.brandName}</td><td><span className="badge warning">{r.stock}</span></td><td>{r.minimumStock}</td><td><strong style={{ color: '#ffd666' }}>{r.missing}</strong></td></tr>)}</tbody></table></div></div>}
    </div>
  );
}
