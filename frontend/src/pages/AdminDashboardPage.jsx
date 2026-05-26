import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    users: 0,
    workers: 0,
    products: 0,
    lowStock: 0,
    orders: 0,
    paymentsPending: 0
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [usersRes, workersRes, productsRes, ordersRes, paymentsRes] = await Promise.all([
          api.get('/users'),
          api.get('/users/workers'),
          api.get('/products'),
          api.get('/orders'),
          api.get('/payments')
        ]);

        const users = Array.isArray(usersRes.data?.data) ? usersRes.data.data : usersRes.data || [];
        const workers = Array.isArray(workersRes.data?.data) ? workersRes.data.data : workersRes.data || [];
        const products = Array.isArray(productsRes.data?.data) ? productsRes.data.data : productsRes.data || [];
        const orders = Array.isArray(ordersRes.data?.data) ? ordersRes.data.data : ordersRes.data || [];
        const payments = Array.isArray(paymentsRes.data?.data) ? paymentsRes.data.data : paymentsRes.data || [];

        setStats({
          users: users.length,
          workers: workers.length,
          products: products.length,
          lowStock: products.filter((p) => Number(p.stock || 0) <= Number(p.minimumStock || 0)).length,
          orders: orders.length,
          paymentsPending: payments.filter((p) => String(p.status || '').toUpperCase() === 'PENDIENTE').length
        });
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return (
      <div className="page">
        <div className="grid grid-3">
          <section className="card skeleton-box"></section>
          <section className="card skeleton-box"></section>
          <section className="card skeleton-box"></section>
          <section className="card skeleton-box"></section>
          <section className="card skeleton-box"></section>
          <section className="card skeleton-box"></section>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <section className="card reveal-on-scroll hero" style={{ marginBottom: 18 }}>
        <div>
          <div className="small" style={{ color: '#d4af37', marginBottom: 8 }}>Panel administrativo</div>
          <h1>Dashboard general</h1>
          <p className="small">Resumen ejecutivo del estado actual del sistema.</p>
        </div>
      </section>

      <div className="grid grid-3">
        <section className="card reveal-on-scroll stat-card">
          <div className="small">Usuarios registrados</div>
          <h2>{stats.users}</h2>
        </section>

        <section className="card reveal-on-scroll stat-card">
          <div className="small">Trabajadores</div>
          <h2>{stats.workers}</h2>
        </section>

        <section className="card reveal-on-scroll stat-card">
          <div className="small">Productos</div>
          <h2>{stats.products}</h2>
        </section>

        <section className="card reveal-on-scroll stat-card">
          <div className="small">Stock bajo</div>
          <h2>{stats.lowStock}</h2>
        </section>

        <section className="card reveal-on-scroll stat-card">
          <div className="small">Pedidos</div>
          <h2>{stats.orders}</h2>
        </section>

        <section className="card reveal-on-scroll stat-card">
          <div className="small">Pagos pendientes</div>
          <h2>{stats.paymentsPending}</h2>
        </section>
      </div>

      <section className="card reveal-on-scroll" style={{ marginTop: 18 }}>
        <h3>Estado del sistema</h3>
        <p className="small">
          Este panel te permite ver rápidamente el comportamiento general del negocio:
          cuentas registradas, inventario, pedidos y pagos aún por revisar.
        </p>
      </section>
    </div>
  );
}
