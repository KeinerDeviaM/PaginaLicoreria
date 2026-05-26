import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api';

const money = (value) => `$${Number(value || 0).toLocaleString('es-CO')}`;

function normalizeList(data) {
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data)) return data;
  return [];
}

function sameMonth(dateValue, nowDate) {
  if (!dateValue) return false;
  const d = new Date(dateValue);
  return d.getMonth() === nowDate.getMonth() && d.getFullYear() === nowDate.getFullYear();
}

function SimpleBarChart({ rows, valueKey, labelKey, color = 'linear-gradient(90deg, rgba(212,175,55,0.95), rgba(212,175,55,0.45))', formatValue }) {
  const max = Math.max(...rows.map((r) => Number(r[valueKey] || 0)), 1);

  if (!rows.length) {
    return <div className="notice">No hay datos suficientes para mostrar.</div>;
  }

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {rows.map((row, index) => {
        const rawValue = Number(row[valueKey] || 0);
        const width = `${Math.max((rawValue / max) * 100, 6)}%`;

        return (
          <div key={`${row[labelKey]}-${index}`}>
            <div className="stack" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, gap: 10 }}>
              <strong style={{ fontSize: '.98rem' }}>{row[labelKey]}</strong>
              <span className="small">{formatValue ? formatValue(rawValue) : rawValue}</span>
            </div>

            <div
              style={{
                height: 12,
                width: '100%',
                background: 'rgba(255,255,255,0.06)',
                borderRadius: 999,
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.05)'
              }}
            >
              <div
                style={{
                  height: '100%',
                  width,
                  background: color,
                  borderRadius: 999,
                  transition: 'width .45s ease'
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HighlightCard({ eyebrow, title, value, subtitle, tone = 'gold' }) {
  const toneMap = {
    gold: {
      bg: 'linear-gradient(135deg, rgba(212,175,55,0.16), rgba(255,255,255,0.03))',
      border: '1px solid rgba(212,175,55,0.22)'
    },
    green: {
      bg: 'linear-gradient(135deg, rgba(40,167,69,0.16), rgba(255,255,255,0.03))',
      border: '1px solid rgba(40,167,69,0.22)'
    },
    blue: {
      bg: 'linear-gradient(135deg, rgba(59,130,246,0.16), rgba(255,255,255,0.03))',
      border: '1px solid rgba(59,130,246,0.22)'
    }
  };

  const style = toneMap[tone] || toneMap.gold;

  return (
    <section className="card reveal-on-scroll" style={{ background: style.bg, border: style.border }}>
      <div className="small" style={{ color: '#d4af37', marginBottom: 8 }}>{eyebrow}</div>
      <h3 style={{ marginBottom: 8 }}>{title}</h3>
      <div style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: 8 }}>{value}</div>
      <p className="small" style={{ lineHeight: 1.7 }}>{subtitle}</p>
    </section>
  );
}

export default function AdminDashboardPage() {
  const [users, setUsers] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
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

        setUsers(normalizeList(usersRes.data));
        setWorkers(normalizeList(workersRes.data));
        setProducts(normalizeList(productsRes.data));
        setOrders(normalizeList(ordersRes.data));
        setPayments(normalizeList(paymentsRes.data));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const metrics = useMemo(() => {
    const nowDate = new Date();

    const paidOrders = orders.filter((o) => {
      const status = String(o.status || '').toUpperCase();
      return status === 'PAGADO' || status === 'ENTREGADO';
    });

    const monthlyPaidOrders = paidOrders.filter((o) => sameMonth(o.createdAt, nowDate));

    const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
    const monthlyRevenue = monthlyPaidOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);

    const totalUnitsSold = paidOrders.reduce((sum, o) => {
      const details = Array.isArray(o.details) ? o.details : [];
      return sum + details.reduce((acc, d) => acc + Number(d.quantity || 0), 0);
    }, 0);

    const monthlyUnitsSold = monthlyPaidOrders.reduce((sum, o) => {
      const details = Array.isArray(o.details) ? o.details : [];
      return sum + details.reduce((acc, d) => acc + Number(d.quantity || 0), 0);
    }, 0);

    const lowStock = products.filter((p) => Number(p.stock || 0) <= Number(p.minimumStock || 0)).length;
    const activeProducts = products.filter((p) => p.active !== false).length;
    const pendingPayments = payments.filter((p) => String(p.status || '').toUpperCase() === 'PENDIENTE').length;

    const averageTicket = paidOrders.length ? totalRevenue / paidOrders.length : 0;
    const monthlyAverageTicket = monthlyPaidOrders.length ? monthlyRevenue / monthlyPaidOrders.length : 0;

    const salesBySellerMap = {};
    payments
      .filter((p) => String(p.status || '').toUpperCase() === 'APROBADO')
      .forEach((p) => {
        const seller = p.approvedBy || 'Sin asignar';
        if (!salesBySellerMap[seller]) {
          salesBySellerMap[seller] = {
            seller,
            salesCount: 0,
            total: 0
          };
        }
        salesBySellerMap[seller].salesCount += 1;
        salesBySellerMap[seller].total += Number(p.amount || 0);
      });

    const salesBySeller = Object.values(salesBySellerMap).sort((a, b) => b.total - a.total);

    const productSalesMap = {};
    paidOrders.forEach((order) => {
      const details = Array.isArray(order.details) ? order.details : [];
      details.forEach((d) => {
        const key = d.productId || d.code || d.name;
        if (!productSalesMap[key]) {
          productSalesMap[key] = {
            productId: d.productId,
            code: d.code || '',
            name: d.name || 'Producto',
            units: 0,
            total: 0
          };
        }
        productSalesMap[key].units += Number(d.quantity || 0);
        productSalesMap[key].total += Number(d.subtotal || 0);
      });
    });

    const topProducts = Object.values(productSalesMap).sort((a, b) => b.units - a.units).slice(0, 8);

    const salesBySellerChart = salesBySeller.slice(0, 6).map((row) => ({
      label: row.seller,
      total: row.total
    }));

    const topProductsChart = topProducts.slice(0, 6).map((row) => ({
      label: row.code ? `${row.code} · ${row.name}` : row.name,
      units: row.units
    }));

    const topSeller = salesBySeller[0] || null;
    const topProduct = topProducts[0] || null;

    return {
      totalRevenue,
      monthlyRevenue,
      totalUnitsSold,
      monthlyUnitsSold,
      lowStock,
      activeProducts,
      pendingPayments,
      totalOrders: orders.length,
      totalUsers: users.length,
      totalWorkers: workers.length,
      salesBySeller,
      topProducts,
      paidOrdersCount: paidOrders.length,
      monthlyPaidOrdersCount: monthlyPaidOrders.length,
      averageTicket,
      monthlyAverageTicket,
      salesBySellerChart,
      topProductsChart,
      topSeller,
      topProduct
    };
  }, [orders, payments, products, users, workers]);

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
          <h1>Dashboard de ventas</h1>
          <p className="small">Resumen general del negocio, rendimiento de vendedores y productos más vendidos.</p>
        </div>
      </section>

      <div className="grid grid-3">
        <section className="card reveal-on-scroll stat-card">
          <div className="small">Dinero total ganado</div>
          <h2>{money(metrics.totalRevenue)}</h2>
        </section>

        <section className="card reveal-on-scroll stat-card">
          <div className="small">Ventas del mes</div>
          <h2>{money(metrics.monthlyRevenue)}</h2>
        </section>

        <section className="card reveal-on-scroll stat-card">
          <div className="small">Ticket promedio</div>
          <h2>{money(metrics.averageTicket)}</h2>
        </section>

        <section className="card reveal-on-scroll stat-card">
          <div className="small">Pedidos pagados / entregados</div>
          <h2>{metrics.paidOrdersCount}</h2>
        </section>

        <section className="card reveal-on-scroll stat-card">
          <div className="small">Unidades vendidas</div>
          <h2>{metrics.totalUnitsSold}</h2>
        </section>

        <section className="card reveal-on-scroll stat-card">
          <div className="small">Pagos pendientes</div>
          <h2>{metrics.pendingPayments}</h2>
        </section>
      </div>

      <div className="grid grid-3" style={{ marginTop: 18 }}>
        <section className="card reveal-on-scroll">
          <div className="small">Ventas aprobadas del mes</div>
          <h2>{metrics.monthlyPaidOrdersCount}</h2>
        </section>

        <section className="card reveal-on-scroll">
          <div className="small">Ticket promedio del mes</div>
          <h2>{money(metrics.monthlyAverageTicket)}</h2>
        </section>

        <section className="card reveal-on-scroll">
          <div className="small">Stock bajo</div>
          <h2>{metrics.lowStock}</h2>
        </section>
      </div>

      <div className="grid grid-2" style={{ marginTop: 18 }}>
        <HighlightCard
          eyebrow="Top vendedor"
          title={metrics.topSeller ? metrics.topSeller.seller : 'Aún sin datos'}
          value={metrics.topSeller ? money(metrics.topSeller.total) : '$0'}
          subtitle={metrics.topSeller ? `${metrics.topSeller.salesCount} ventas aprobadas registradas.` : 'Todavía no hay pagos aprobados asignados.'}
          tone="gold"
        />

        <HighlightCard
          eyebrow="Producto estrella"
          title={metrics.topProduct ? (metrics.topProduct.code ? `${metrics.topProduct.code} · ${metrics.topProduct.name}` : metrics.topProduct.name) : 'Aún sin datos'}
          value={metrics.topProduct ? `${metrics.topProduct.units} und` : '0 und'}
          subtitle={metrics.topProduct ? `Ha generado ${money(metrics.topProduct.total)} en ventas.` : 'Todavía no hay productos vendidos.'}
          tone="green"
        />
      </div>

      <div className="grid grid-2" style={{ marginTop: 18 }}>
        <section className="card reveal-on-scroll">
          <div className="table-header">
            <div>
              <h3>Gráfico de ventas por vendedor</h3>
              <p className="small">Basado en pagos aprobados.</p>
            </div>
          </div>

          <SimpleBarChart
            rows={metrics.salesBySellerChart}
            valueKey="total"
            labelKey="label"
            formatValue={(v) => money(v)}
          />
        </section>

        <section className="card reveal-on-scroll">
          <div className="table-header">
            <div>
              <h3>Gráfico de productos más vendidos</h3>
              <p className="small">Basado en unidades vendidas.</p>
            </div>
          </div>

          <SimpleBarChart
            rows={metrics.topProductsChart}
            valueKey="units"
            labelKey="label"
            color="linear-gradient(90deg, rgba(255,255,255,0.92), rgba(212,175,55,0.42))"
            formatValue={(v) => `${v} und`}
          />
        </section>
      </div>

      <div className="grid grid-2" style={{ marginTop: 18 }}>
        <section className="card reveal-on-scroll">
          <div className="table-header">
            <div>
              <h3>Ventas por vendedor</h3>
              <p className="small">Calculado con pagos aprobados por cada vendedor.</p>
            </div>
          </div>

          {metrics.salesBySeller.length === 0 ? (
            <div className="notice">Aún no hay ventas aprobadas registradas.</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Vendedor</th>
                    <th>Ventas aprobadas</th>
                    <th>Total vendido</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.salesBySeller.map((row) => (
                    <tr key={row.seller}>
                      <td>{row.seller}</td>
                      <td>{row.salesCount}</td>
                      <td><strong>{money(row.total)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card reveal-on-scroll">
          <div className="table-header">
            <div>
              <h3>Productos más vendidos</h3>
              <p className="small">Calculado con pedidos pagados y entregados.</p>
            </div>
          </div>

          {metrics.topProducts.length === 0 ? (
            <div className="notice">Aún no hay productos vendidos.</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Unidades</th>
                    <th>Total vendido</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.topProducts.map((row) => (
                    <tr key={`${row.productId}-${row.code}-${row.name}`}>
                      <td>{row.code ? `${row.code} · ${row.name}` : row.name}</td>
                      <td>{row.units}</td>
                      <td><strong>{money(row.total)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <div className="grid grid-3" style={{ marginTop: 18 }}>
        <section className="card reveal-on-scroll">
          <div className="small">Usuarios registrados</div>
          <h2>{metrics.totalUsers}</h2>
        </section>

        <section className="card reveal-on-scroll">
          <div className="small">Trabajadores</div>
          <h2>{metrics.totalWorkers}</h2>
        </section>

        <section className="card reveal-on-scroll">
          <div className="small">Productos activos</div>
          <h2>{metrics.activeProducts}</h2>
        </section>
      </div>
    </div>
  );
}
