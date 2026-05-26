import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { setAuth } from '../auth';

const benefits = [
  'Acceso directo al catalogo y carrito',
  'Paneles separados para admin y trabajador',
  'Seguimiento claro de pedidos, pagos y facturas'
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  async function submit(e) {
    e.preventDefault();
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setAuth(data.data.token, data.data.user);

      const role = data.data.user.role;
      const from = location.state?.from?.pathname;

      if (from) {
        navigate(from, { replace: true });
        return;
      }

      if (role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (role === 'TRABAJADOR') {
        navigate('/worker/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo iniciar sesion');
    }
  }

  return (
    <div className="container page">
      <section className="auth-shell">
        <aside className="auth-showcase glass-card reveal-up">
          <div className="eyebrow">Acceso seguro</div>
          <h1>Entra a una experiencia mas solida y mejor organizada.</h1>
          <p className="small" style={{ maxWidth: 520 }}>
            La tienda publica y los paneles internos ahora comparten una misma direccion visual.
            Entra con tu cuenta y continua donde estabas.
          </p>

          <div className="auth-benefits">
            {benefits.map((item, index) => (
              <div key={item} className={`auth-benefit reveal-up reveal-delay-${Math.min(index + 1, 4)}`}>
                <strong>{item}</strong>
              </div>
            ))}
          </div>

          <div className="stack auth-links">
            <Link className="btn btn-primary" to="/shop/products">
              Ver catalogo
            </Link>
            <Link className="btn btn-outline" to="/register">
              Crear cuenta
            </Link>
          </div>
        </aside>

        <div className="auth-card glass-card reveal-up reveal-delay-1">
          <div className="eyebrow">Iniciar sesion</div>
          <h1>Bienvenido.</h1>
          <p className="small">Si eres cliente entras a la tienda. Si eres staff, al panel correspondiente.</p>

          {error && <div className="notice error">{error}</div>}

          <form onSubmit={submit}>
            <div className="form-group">
              <label>Correo</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
              />
            </div>

            <div className="form-group">
              <label>Contrasena</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
              />
            </div>

            <div className="stack">
              <button className="btn btn-primary">Ingresar</button>
              <Link className="btn btn-outline" to="/register">
                Crear cuenta
              </Link>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
