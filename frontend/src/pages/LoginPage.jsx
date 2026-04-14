import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import { setAuth } from '../auth';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@licoreria.com');
  const [password, setPassword] = useState('12345678');
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
      if (from) return navigate(from, { replace: true });
      if (role === 'ADMIN') navigate('/admin/dashboard');
      else if (role === 'TRABAJADOR') navigate('/worker/dashboard');
      else navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo iniciar sesión');
    }
  }

  return (
    <div className="container page" style={{maxWidth: 520}}>
      <div className="card">
        <h1>Iniciar sesión</h1>
        <p className="small">Usa admin@licoreria.com o trabajador@licoreria.com con 12345678.</p>
        {error && <div className="notice error">{error}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Correo</label>
            <input value={email} onChange={(e)=>setEmail(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Contraseña</label>
            <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
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
