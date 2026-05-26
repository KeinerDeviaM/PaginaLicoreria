import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { getAuth } from '../auth';

const money = (value) => `$${Number(value || 0).toLocaleString('es-CO')}`;
const dateText = (value) => value ? new Date(value).toLocaleString('es-CO') : 'No disponible';

function BarList({ rows, labelFormatter = (x) => x }) {
  const max = Math.max(...rows.map((r) => Number(r.value || 0)), 1);
  return (
    <div className="bar-list">
      {rows.map((row) => (
        <div key={row.name} className="bar-row">
          <div className="bar-header"><span>{row.name}</span><strong>{labelFormatter(row.value)}</strong></div>
          <div className="bar-track"><div className="bar-fill" style={{ width: `${(Number(row.value || 0) / max) * 100}%` }} /></div>
        </div>
      ))}
    </div>
  );
}

export default function InternalDashboardPage() {
  const { user } = getAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const role = user?.role || '';
  const base = role === 'ADMIN' ? '/admin' : '/worker';

  useEffect(() => {
    api.get('/dashboard/summary').then(({ data }) => setData(data.data || data)).catch((err) => setError(err.response?.data?.message || 'No se pudo cargar el dashboard.'));
  }, []);

  if (error) return <div className="notice error">{error}</div>;
  if (!data) return <div className="notice">Cargando dashboard...</div>;

  const cards = [
    { title: 'Productos', value: data.totalProducts },
    { title: 'Categorías', value: data.totalCategories },
    { title: 'Trabajadores', value: data.totalWorkers },
    { title: 'Clientes', value: data.totalCustomers },
    { title: 'Pedidos', value: data.totalOrders },
    { title: 'Pagos pendientes', value: data.pendingPayments },
    { title: 'Stock bajo', value: data.lowStock },
    { title: 'Facturas', value: data.totalInvoices }
  ];

  return (
    <div className="page">
      <div className="card" style={{ marginBottom: 18, background: 'linear-gradient(135deg, rgba(212,175,55,0.10), rgba(255,255,255,0.02))', border: '1px solid rgba(212,175,55,0.18)' }}>
        <div className="stack" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div><h1 style={{ marginBottom: 8 }}>Dashboard</h1><p className="small">Resumen del negocio, alertas, gráficos y accesos rápidos.</p></div>
          <div className="stack" style={{ gap: 10, flexWrap: 'wrap' }}>
            <Link to="/profile" className="btn btn-primary">Mi perfil</Link>
            {role === 'ADMIN' && <><Link to="/admin/workers" className="btn btn-outline">Crear trabajador</Link><Link to="/admin/products" className="btn btn-outline">Crear producto</Link><Link to="/admin/users" className="btn btn-outline">Ver usuarios</Link></>}
            <Link to={`${base}/payments`} className="btn btn-outline">Revisar pagos</Link>
            <Link to={`${base}/orders`} className="btn btn-outline">Ver pedidos</Link>
          </div>
        </div>
      </div>
      <div className="grid grid-4">{cards.map((card) => <div key={card.title} className="kpi"><div className="value">{card.value}</div><div className="label">{card.title}</div></div>)}</div>
      <div className="grid grid-2" style={{ marginTop: 18 }}>
        <section className="card"><h3>Resumen financiero</h3><div className="grid grid-2" style={{ marginTop: 10 }}><div className="card"><div className="small">Ventas acumuladas</div><strong style={{ fontSize: 22 }}>{money(data.totalSales)}</strong></div><div className="card"><div className="small">Valor inventario</div><strong style={{ fontSize: 22 }}>{money(data.inventoryValue)}</strong></div><div className="card"><div className="small">Costo proveedores</div><strong style={{ fontSize: 22 }}>{money(data.supplierSpend)}</strong></div><div className="card"><div className="small">Utilidad estimada</div><strong style={{ fontSize: 22 }}>{money(data.totalSales - data.supplierSpend)}</strong></div></div></section>
        <section className="card"><div className="stack" style={{ justifyContent: 'space-between', alignItems: 'center' }}><h3>Stock bajo</h3><span className="badge warning">{data.lowStockProducts.length}</span></div>{data.lowStockProducts.length === 0 ? <div className="notice" style={{ marginTop: 10 }}>No hay productos con stock bajo.</div> : <div className="table-wrap" style={{ marginTop: 10 }}><table><thead><tr><th>Código</th><th>Producto</th><th>Stock</th><th>Mínimo</th></tr></thead><tbody>{data.lowStockProducts.slice(0, 8).map((item) => <tr key={item.id}><td>{item.code}</td><td>{item.name}</td><td><span className="badge warning">{item.stock}</span></td><td>{item.minimumStock}</td></tr>)}</tbody></table></div>}</section>
      </div>
      <div className="grid grid-2" style={{ marginTop: 18 }}>
        <section className="card"><h3>Productos más vendidos</h3><BarList rows={data.topProducts} labelFormatter={(v) => `${v} uds`} /></section>
        <section className="card"><h3>Vendedores con más ventas</h3><BarList rows={data.topWorkers} labelFormatter={money} /></section>
      </div>
      <div className="grid grid-2" style={{ marginTop: 18 }}>
        <section className="card"><h3>Pedidos recientes</h3>{data.recentOrders.length === 0 ? <div className="notice" style={{ marginTop: 10 }}>No hay pedidos recientes.</div> : <div className="table-wrap" style={{ marginTop: 10 }}><table><thead><tr><th>Número</th><th>Cliente</th><th>Estado</th><th>Total</th></tr></thead><tbody>{data.recentOrders.map((order) => <tr key={order.orderId}><td>{order.orderNumber}</td><td>{order.customerName}</td><td>{order.status}</td><td>{money(order.total)}</td></tr>)}</tbody></table></div>}</section>
        <section className="card"><h3>Pagos recientes</h3>{data.recentPayments.length === 0 ? <div className="notice" style={{ marginTop: 10 }}>No hay pagos recientes.</div> : <div className="table-wrap" style={{ marginTop: 10 }}><table><thead><tr><th>Pedido</th><th>Método</th><th>Estado</th><th>Monto</th></tr></thead><tbody>{data.recentPayments.map((payment) => <tr key={payment.paymentId}><td>{payment.orderNumber}</td><td>{payment.method}</td><td>{payment.status}</td><td>{money(payment.amount)}</td></tr>)}</tbody></table></div>}</section>
      </div>
      <div className="card" style={{ marginTop: 18 }}><h3>Movimientos recientes</h3>{data.recentMovements.length === 0 ? <div className="notice" style={{ marginTop: 10 }}>No hay movimientos recientes.</div> : <div className="table-wrap" style={{ marginTop: 10 }}><table><thead><tr><th>Producto</th><th>Tipo</th><th>Cantidad</th><th>Usuario</th><th>Fecha</th></tr></thead><tbody>{data.recentMovements.map((movement) => <tr key={movement.id}><td>{movement.productName}</td><td>{movement.type}</td><td>{movement.quantity}</td><td>{movement.userName}</td><td>{dateText(movement.createdAt)}</td></tr>)}</tbody></table></div>}</div>
    </div>
  );
}
