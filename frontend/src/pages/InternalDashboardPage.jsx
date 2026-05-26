import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { getAuth } from '../auth';

export default function InternalDashboardPage() {
  const [data, setData] = useState(null);
  const { user } = getAuth();
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    api.get('/dashboard/summary').then(({ data }) => setData(data));
  }, []);

  if (!data) return <div className="notice">Cargando dashboard...</div>;

  return (
    <div className="page page-shell">
      <section className="toolbar-card reveal-up">
        <div className="page-header">
          <div>
            <div className="eyebrow">Centro de control</div>
            <h1>Dashboard</h1>
            <p className="small">
              Vista rapida del inventario y la operacion diaria para tomar decisiones mas rapido.
            </p>
          </div>

          <div className="stack">
            {isAdmin && (
              <Link to="/admin/workers" className="btn btn-primary">
                Crear trabajador
              </Link>
            )}
            <Link to={isAdmin ? '/admin/products' : '/worker/products'} className="btn btn-outline">
              Ver productos
            </Link>
          </div>
        </div>
      </section>

      <section className="metric-grid">
        <article className="metric-card reveal-up">
          <span className="small">Catalogo</span>
          <strong>{data.totalProducts}</strong>
          <span className="small">Productos registrados</span>
        </article>

        <article className="metric-card reveal-up reveal-delay-1">
          <span className="small">Estructura</span>
          <strong>{data.totalCategories}</strong>
          <span className="small">Categorias activas</span>
        </article>

        <article className="metric-card reveal-up reveal-delay-2">
          <span className="small">Atencion</span>
          <strong>{data.lowStock}</strong>
          <span className="small">Productos con stock bajo</span>
        </article>

        <article className="metric-card reveal-up reveal-delay-3">
          <span className="small">Valor</span>
          <strong>${Number(data.inventoryValue || 0).toLocaleString('es-CO')}</strong>
          <span className="small">Inventario valorizado</span>
        </article>
      </section>

      <section className="table-card reveal-up reveal-delay-1">
        <div className="table-header">
          <div>
            <h3>Movimientos recientes</h3>
            <p className="small">Ultimos cambios registrados sobre productos y existencias.</p>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Tipo</th>
                <th>Cantidad</th>
                <th>Usuario</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {(data.recentMovements || []).map((movement) => (
                <tr key={movement.id}>
                  <td>{movement.productName}</td>
                  <td>{movement.type}</td>
                  <td>{movement.quantity}</td>
                  <td>{movement.userName}</td>
                  <td>{new Date(movement.createdAt).toLocaleString('es-CO')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
