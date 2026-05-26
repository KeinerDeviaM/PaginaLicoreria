import React from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { getAuth, clearAuth } from '../auth';

export function PublicLayout() {
  const { user } = getAuth();

  function logout() {
    clearAuth();
    window.location.href = '/login';
  }

  return (
    <div>
      <header>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, padding: '14px 0', flexWrap: 'wrap' }}>
          <div className="stack" style={{ gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <Link to="/" className="btn btn-outline">Inicio</Link>
            <Link to="/shop/products" className="btn btn-outline">Catálogo</Link>
            {user?.role === 'CLIENTE' && (
              <>
                <Link to="/cart" className="btn btn-outline">Carrito</Link>
                <Link to="/orders" className="btn btn-outline">Mis pedidos</Link>
              </>
            )}
          </div>

          <div className="stack" style={{ gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {user ? (
              <>
                <span className="small">{user.firstName} {user.lastName} · {user.role}</span>
                <Link to="/profile" className="btn btn-outline">Perfil</Link>
                <button className="btn btn-wine" onClick={logout}>Salir</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline">Ingresar</Link>
                <Link to="/register" className="btn btn-primary">Registrarse</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="container" style={{ paddingTop: 18 }}>
        <Outlet />
      </main>
    </div>
  );
}

export function InternalLayout({ role }) {
  const { user } = getAuth();

  function logout() {
    clearAuth();
    window.location.href = '/login';
  }

  const isAdmin = role === 'ADMIN';
  const base = isAdmin ? '/admin' : '/worker';

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '280px 1fr' }}>
      <aside style={{ padding: 18 }}>
        <div className="card" style={{ marginBottom: 14 }}>
          <h3 style={{ marginBottom: 6 }}>{isAdmin ? 'Panel Admin' : 'Panel Trabajador'}</h3>
          <div className="small">{user?.firstName} {user?.lastName}</div>
        </div>

        <nav className="card">
          <div style={{ display: 'grid', gap: 8 }}>
            <NavLink to={`${base}/dashboard`} className="btn btn-outline">Dashboard</NavLink>
            <NavLink to={`${base}/products`} className="btn btn-outline">Productos</NavLink>
            <NavLink to={`${base}/orders`} className="btn btn-outline">Pedidos</NavLink>
            <NavLink to={`${base}/payments`} className="btn btn-outline">Pagos</NavLink>
            <NavLink to={`${base}/invoices`} className="btn btn-outline">Facturas</NavLink>
            <NavLink to={`${base}/movements`} className="btn btn-outline">Movimientos</NavLink>
            <NavLink to={`${base}/alerts`} className="btn btn-outline">Alertas</NavLink>

            {isAdmin && (
              <>
                <NavLink to={`${base}/users`} className="btn btn-outline">Usuarios</NavLink>
                <NavLink to={`${base}/workers`} className="btn btn-outline">Trabajadores</NavLink>
                <NavLink to={`${base}/categories`} className="btn btn-outline">Categorías</NavLink>
                <NavLink to={`${base}/brands`} className="btn btn-outline">Marcas</NavLink>
                <NavLink to={`${base}/suppliers`} className="btn btn-outline">Proveedores</NavLink>
                <NavLink to={`${base}/notifications`} className="btn btn-outline">Notificaciones</NavLink>
              </>
            )}
          </div>

          <div style={{ marginTop: 14 }}>
            <button className="btn btn-wine" onClick={logout}>Salir</button>
          </div>
        </nav>
      </aside>

      <main style={{ padding: 18 }}>
        <Outlet />
      </main>
    </div>
  );
}
