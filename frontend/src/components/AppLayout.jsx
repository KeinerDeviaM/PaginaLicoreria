import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
}

export default function AppLayout() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const role = user?.role || '';

  const base =
    role === 'ADMIN'
      ? '/admin'
      : role === 'TRABAJADOR'
      ? '/worker'
      : '/shop';

  const adminLinks = [
    ['Dashboard', `${base}/dashboard`],
    ['Productos', `${base}/products`],
    ['Categorías', `${base}/categories`],
    ['Marcas', `${base}/brands`],
    ['Proveedores', `${base}/suppliers`],
    ['Inventario', `${base}/inventory`],
    ['Movimientos', `${base}/movements`],
    ['Alertas', `${base}/alerts`],
    ['Pedidos', `${base}/orders`],
    ['Pagos', `${base}/payments`],
    ['Facturas', `${base}/invoices`],
    ['Notificaciones', `${base}/notifications`]
  ];

  const workerLinks = [
    ['Dashboard', `${base}/dashboard`],
    ['Pedidos', `${base}/orders`],
    ['Pagos', `${base}/payments`],
    ['Facturas', `${base}/invoices`],
    ['Notificaciones', `${base}/notifications`]
  ];

  const customerLinks = [
    ['Inicio', '/'],
    ['Catálogo', '/shop/products'],
    ['Carrito', '/cart'],
    ['Mis pedidos', '/orders'],
    ['Mis facturas', '/my-invoices'],
    ['Mi perfil', '/profile']
  ];

  const links =
    role === 'ADMIN'
      ? adminLinks
      : role === 'TRABAJADOR'
      ? workerLinks
      : customerLinks;

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: '260px 1fr',
        background: '#0f0f10',
        color: '#f5f5f5'
      }}
    >
      <aside
        style={{
          borderRight: '1px solid rgba(255,255,255,0.08)',
          padding: '20px 16px',
          background: '#131316'
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            marginBottom: 22
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 800 }}>Licorería Pro</div>
          <div style={{ fontSize: 12, color: '#b8b8b8' }}>
            Panel de gestión
          </div>
        </div>

        <nav
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8
          }}
        >
          {links.map(([label, to]) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              style={({ isActive }) => ({
                textDecoration: 'none',
                color: isActive ? '#111' : '#f5f5f5',
                background: isActive ? '#d4af37' : 'transparent',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                padding: '10px 12px',
                fontWeight: 600
              })}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div
          style={{
            marginTop: 24,
            paddingTop: 16,
            borderTop: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12
          }}
        >
          <div
            className="small"
            style={{ alignSelf: 'center', color: '#cfcfcf', textAlign: 'center' }}
          >
            {user?.firstName} {user?.lastName} · {user?.role}
          </div>

          <button
            onClick={logout}
            style={{
              border: 'none',
              background: '#26262b',
              color: '#fff',
              borderRadius: 12,
              padding: '10px 12px',
              cursor: 'pointer',
              fontWeight: 700
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main style={{ padding: 24 }}>
        <Outlet />
      </main>
    </div>
  );
}
