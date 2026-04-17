import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function AlertsPage() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      const { data } = await api.get('/alerts');
      const alerts = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
        ? data
        : [];
      setRows(alerts);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudieron cargar las alertas.');
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="page">
      <div className="stack" style={{ justifyContent: 'space-between', alignItems: 'end', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1>Alertas de inventario</h1>
          <p className="small">Productos con stock por debajo del mínimo configurado.</p>
        </div>
      </div>

      {error && <div className="notice error">{error}</div>}

      {!rows.length ? (
        <div className="notice" style={{ marginTop: 16 }}>No hay alertas activas.</div>
      ) : (
        <div className="card" style={{ marginTop: 16, border: '1px solid rgba(255,193,7,0.28)', background: 'rgba(255,193,7,0.06)' }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Marca</th>
                  <th>Stock</th>
                  <th>Mínimo</th>
                  <th>Faltante</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const stock = Number(r.stock || 0);
                  const minimum = Number(r.minimumStock || 0);
                  const missing = Math.max(minimum - stock, 0);

                  return (
                    <tr key={r.id}>
                      <td>{r.code}</td>
                      <td>{r.name}</td>
                      <td>{r.categoryName}</td>
                      <td>{r.brandName}</td>
                      <td>
                        <span className="badge warning" style={{ background: 'rgba(255,193,7,0.16)', color: '#ffd666', border: '1px solid rgba(255,193,7,0.28)' }}>
                          {stock}
                        </span>
                      </td>
                      <td>{minimum}</td>
                      <td>
                        <strong style={{ color: '#ffd666' }}>{missing}</strong>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
