import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function InternalDashboardPage() {
  const [stats, setStats] = useState({
    products: 0,
    activeProducts: 0,
    lowStock: 0,
    users: 0,
    orders: 0,
    pendingPayments: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [productsRes, usersRes, ordersRes, paymentsRes] = await Promise.all([
          api.get('/products'),
          api.get('/users'),
          api.get('/orders'),
          api.get('/payments')
        ]);

        const products = Array.isArray(productsRes.data) ? productsRes.data : productsRes.data?.data || [];
        const users = Array.isArray(usersRes.data) ? usersRes.data : usersRes.data?.data || [];
        const orders = Array.isArray(ordersRes.data) ? ordersRes.data : ordersRes.data?.data || [];
        const payments = Array.isArray(paymentsRes.data) ? paymentsRes.data : paymentsRes.data?.data || [];

        setStats({
          products: products.length,
          activeProducts: products.filter((x) => x.active !== false).length,
          lowStock: products.filter((x) => Number(x.stock || 0) <= Number(x.minimumStock || 0)).length,
          users: users.length,
          orders: orders.length,
          pendingPayments: payments.filter((x) => String(x.status || '').toUpperCase() === 'PENDIENTE').length
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
          <div className="small" style={{ color: '#d4af37', marginBottom: 8 }}>Panel interno</div>
          <h1>Resumen general</h1>
          <p className="small">Vista rápida del estado actual de productos, usuarios, pedidos y pagos.</p>
        </div>
      </section>

      <div className="grid grid-3">
        <section className="card reveal-on-scroll stat-card">
          <div className="small">Productos registrados</div>
          <h2>{stats.products}</h2>
        </section>

        <section className="card reveal-on-scroll stat-card">
          <div className="small">Productos activos</div>
          <h2>{stats.activeProducts}</h2>
        </section>

        <section className="card reveal-on-scroll stat-card">
          <div className="small">Stock bajo</div>
          <h2>{stats.lowStock}</h2>
        </section>

        <section className="card reveal-on-scroll stat-card">
          <div className="small">Usuarios</div>
          <h2>{stats.users}</h2>
        </section>

        <section className="card reveal-on-scroll stat-card">
          <div className="small">Pedidos</div>
          <h2>{stats.orders}</h2>
        </section>

        <section className="card reveal-on-scroll stat-card">
          <div className="small">Pagos pendientes</div>
          <h2>{stats.pendingPayments}</h2>
        </section>
      </div>
    </div>
  );
}
