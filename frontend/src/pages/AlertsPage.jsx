import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function AlertsPage() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    api.get('/alerts/low-stock').then(({ data }) => setRows(data));
  }, []);

  return (
    <div className="page">
      <h1>Alertas de stock</h1>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Código</th><th>Producto</th><th>Categoría</th><th>Marca</th><th>Stock</th><th>Mínimo</th><th>Faltante</th></tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.productId}>
                  <td>{r.code}</td>
                  <td>{r.name}</td>
                  <td>{r.categoryName}</td>
                  <td>{r.brandName}</td>
                  <td>{r.stock}</td>
                  <td>{r.minimumStock}</td>
                  <td><span className={`badge ${r.stock === 0 ? 'danger' : 'warning'}`}>{r.missing}</span></td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan="7">Todo en orden.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
