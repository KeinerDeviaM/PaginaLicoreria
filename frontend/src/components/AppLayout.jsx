import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { clearAuth, getAuth } from '../auth';

function Brand({ title, subtitle, badge }) {
  return (
    <div className="brand">
      <span className="brand-badge">{badge}</span>
      <div>
        <div>{title}</div>
        <div className="small">{subtitle}</div>
      </div>
    </div>
  );
}

export function TopNav() {
  const { user } = getAuth();
  const navigate = useNavigate();

  return (
    <header className="nav">
      <div className="nav-inner">
        <NavLink to="/" className="brand">
          <span className="brand-badge">L</span>
          <div>
            <div>Licorería Pro</div>
            <div className="small">Experiencia premium</div>
          </div>
        </NavLink>

        <nav className="nav-links">
          <NavLink to="/" className="nav-link">
            Inicio
          </NavLink>
          <NavLink to="/shop/products" className="nav-link">
            Catálogo
          </NavLink>
          {user?.role === 'CLIENTE' && (
            <>
              <NavLink to="/cart" className="nav-link">
                Carrito
              </NavLink>
              <NavLink to="/orders" className="nav-link">
                Mis pedidos
              </NavLink>
              <NavLink to="/invoices" className="nav-link">
                Mis facturas
              </NavLink>
              <NavLink to="/profile" className="nav-link">
                Perfil
              </NavLink>
            </>
          )}
          {user?.role === 'ADMIN' && (
            <NavLink to="/admin/dashboard" className="nav-link">
              Panel admin
            </NavLink>
          )}
          {user?.role === 'TRABAJADOR' && (
            <NavLink to="/worker/dashboard" className="nav-link">
              Panel trabajador
            </NavLink>
          )}
        </nav>

        <div className="stack nav-actions">
          {!user ? (
            <>
              <NavLink to="/login" className="btn btn-outline">
                Ingresar
              </NavLink>
              <NavLink to="/register" className="btn btn-primary">
                Crear cuenta
              </NavLink>
            </>
          ) : (
            <>
              <div className="nav-user">
                <span className="nav-user-name">
                  {user.firstName} {user.lastName}
                </span>
                <span className="nav-user-role">{user.role}</span>
              </div>
              <button
                className="btn btn-outline"
                onClick={() => {
                  clearAuth();
                  navigate('/login');
                }}
              >
                Salir
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function InternalLayout({ role }) {
  const { user } = getAuth();
  const navigate = useNavigate();
  const base = role === 'ADMIN' ? '/admin' : '/worker';
  const isAdmin = role === 'ADMIN';
  const menu = isAdmin
    ? [
        ['Dashboard', `${base}/dashboard`],
        ['Notificaciones', `${base}/notifications`],
        ['Productos', `${base}/products`],
        ['Trabajadores', `${base}/workers`],
        ['Categorías', `${base}/categories`],
        ['Marcas', `${base}/brands`],
        ['Proveedores', `${base}/suppliers`],
        ['Movimientos', `${base}/movements`],
        ['Alertas', `${base}/alerts`],
        ['Pedidos', `${base}/orders`],
        ['Pagos', `${base}/payments`],
        ['Facturas', `${base}/invoices`]
      ]
    : [
        ['Dashboard', `${base}/dashboard`],
        ['Productos', `${base}/products`],
        ['Movimientos', `${base}/movements`],
        ['Alertas', `${base}/alerts`],
        ['Pedidos', `${base}/orders`],
        ['Pagos', `${base}/payments`],
        ['Facturas', `${base}/invoices`]
      ];

  return (
    <>
      <header className="nav nav-admin">
        <div className="nav-inner">
          <Brand
            badge={isAdmin ? 'A' : 'T'}
            title={isAdmin ? 'Panel administrativo' : 'Panel operativo'}
            subtitle={`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Sesión activa'}
          />

          <div className="stack nav-actions">
            <button className="btn btn-outline" onClick={() => navigate('/')}>
              Ver tienda
            </button>
            <button
              className="btn btn-danger"
              onClick={() => {
                clearAuth();
                navigate('/login');
              }}
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <div className="sidebar-panel">
            <div className="sidebar-heading">
              <strong>{isAdmin ? 'Control total' : 'Operación diaria'}</strong>
              <span className="small">
                {isAdmin ? 'Gestiona inventario, usuarios y ventas.' : 'Supervisa pedidos, pagos e inventario.'}
              </span>
            </div>

            <div className="menu">
              {menu.map(([label, href]) => (
                <NavLink key={href} to={href}>
                  {label}
                </NavLink>
              ))}
            </div>
          </div>
        </aside>

        <main className="main">
          <Outlet />
        </main>
      </div>
    </>
  );
}

export function PublicLayout() {
  return (
    <div className="public-shell">
      <TopNav />
      <main className="public-main">
        <Outlet />
      </main>
      <footer className="public-footer">
        <div className="container public-footer-inner">
          <span>Licorería Pro</span>
          <span>Catálogo, pedidos y gestión en un solo flujo.</span>
        </div>
      </footer>
    </div>
  );
}

export default PublicLayout;
