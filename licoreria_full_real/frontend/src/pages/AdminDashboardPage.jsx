import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        setError('');
        const { data } = await api.get('/admin/stats');
        setStats(data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'No se pudo cargar el dashboard');
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="container page">
        <div className="notice">Cargando dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container page">
        <div className="notice error">{error}</div>
      </div>
    );
  }

  const cards = [
    { title: 'Productos', value: stats?.totalProducts ?? 0 },
    { title: 'Trabajadores', value: stats?.totalWorkers ?? 0 },
    { title: 'Clientes', value: stats?.totalCustomers ?? 0 },
    { title: 'Pedidos', value: stats?.totalOrders ?? 0 },
    { title: 'Pagos', value: stats?.totalPayments ?? 0 },
    { title: 'Facturas', value: stats?.totalInvoices ?? 0 },
    { title: 'Stock bajo', value: stats?.lowStockCount ?? 0 },
    { title: 'Pagos pendientes', value: stats?.pendingPaymentsCount ?? 0 }
  ];

  return (
    <div className="container page">
      <div className="card" style={{ marginBottom: 20 }}>
        <h1 style={{ marginBottom: 8 }}>Dashboard admin</h1>
        <p className="small" style={{ marginBottom: 18 }}>
          Resumen general del sistema.
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link
            to="/admin/workers"
            className="btn btn-primary"
            style={{
              padding: '14px 22px',
              fontSize: '16px',
              fontWeight: '700',
              borderRadius: '14px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            Crear trabajador
          </Link>

          <Link
            to="/admin/notifications"
            className="btn btn-outline"
            style={{
              padding: '14px 22px',
              fontSize: '16px',
              borderRadius: '14px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            Ver notificaciones
          </Link>
        </div>
      </div>

      <div className="grid-4" style={{ marginTop: 20 }}>
        {cards.map((card) => (
          <div key={card.title} className="card">
            <p className="small">{card.title}</p>
            <h2 style={{ marginTop: 8 }}>{card.value}</h2>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <p className="small">Ventas acumuladas</p>
        <h2>${Number(stats?.totalSales || 0).toLocaleString('es-CO')}</h2>
      </div>
    </div>
  );
}
