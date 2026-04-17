import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import { setAuth } from '../auth';

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
      setError(err.response?.data?.message || 'No se pudo iniciar sesión');
    }
  }

  return (
    <div className="container page" style={{ maxWidth: 520 }}>
      <div className="card">
        <h1>Iniciar sesión</h1>
        <p className="small">
          Si tu cuenta es de cliente, entrarás directamente a la tienda.
        </p>

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
            <label>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
            />
          </div>

          <div className="stack">
            <button className="btn btn-primary">Ingresar</button>
            <Link className="btn btn-outline" to="/register">Crear cuenta</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
