import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function InternalDashboardPage() {
  const [data, setData] = useState(null);

  useEffect(() => { api.get('/dashboard/summary').then(({ data }) => setData(data)); }, []);

  if (!data) return <div>Cargando...</div>;

  return (
    <div className="page">
      <h1>Dashboard</h1>
      <div className="grid grid-4">
        <div className="kpi"><div className="value">{data.totalProducts}</div><div className="label">Productos</div></div>
        <div className="kpi"><div className="value">{data.totalCategories}</div><div className="label">Categorías</div></div>
        <div className="kpi"><div className="value">{data.lowStock}</div><div className="label">Stock bajo</div></div>
        <div className="kpi"><div className="value">${data.inventoryValue.toLocaleString('es-CO')}</div><div className="label">Valor inventario</div></div>
      </div>
      <div className="card" style={{marginTop:16}}>
        <h3>Movimientos recientes</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Producto</th><th>Tipo</th><th>Cantidad</th><th>Usuario</th><th>Fecha</th></tr></thead>
            <tbody>
              {data.recentMovements.map(m => (
                <tr key={m.id}>
                  <td>{m.productName}</td>
                  <td>{m.type}</td>
                  <td>{m.quantity}</td>
                  <td>{m.userName}</td>
                  <td>{new Date(m.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
