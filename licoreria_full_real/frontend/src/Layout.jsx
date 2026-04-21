import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { getAuth, clearAuth } from './auth';

export default function Layout() {
  const { user } = getAuth();

  function logout() {
    clearAuth();
    window.location.href = '/login';
  }

  return (
    <div>
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        background: '#121212',
        borderBottom: '1px solid rgba(255,255,255,0.08)'
      }}>
        <div className="container" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          padding: '14px 0',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <Link to="/shop/products" className="btn btn-outline">Catálogo</Link>
            {user?.role === 'CLIENTE' && (
              <>
                <Link to="/cart" className="btn btn-outline">Carrito</Link>
                <Link to="/orders" className="btn btn-outline">Mis pedidos</Link>
              </>
            )}
            {(user?.role === 'ADMIN' || user?.role === 'TRABAJADOR') && (
              <Link to="/internal/dashboard" className="btn btn-outline">Panel interno</Link>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {user ? (
              <>
                <span className="small">
                  {user.firstName} {user.lastName} · {user.role}
                </span>
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

      <main>
        <Outlet />
      </main>
    </div>
  );
}
