import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
      setError('');
      const { data } = await api.post('/auth/login', { email, password });
      setAuth(data.data.token, data.data.user);
      const role = data.data.user.role;
      if (location.state?.from?.pathname) return navigate(location.state.from.pathname);
      if (role === 'ADMIN') return navigate('/admin/dashboard');
      if (role === 'TRABAJADOR') return navigate('/worker/dashboard');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo iniciar sesión');
    }
  }

  return (
    <div className="container page" style={{ maxWidth: 520 }}>
      <div className="card">
        <h1>Iniciar sesión</h1>
        <p className="small">Si tu cuenta es de cliente, entrarás directamente a la tienda.</p>
        {error && <div className="notice error">{error}</div>}
        <form onSubmit={submit}>
          <div className="form-group"><label>Correo</label><input value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="form-group"><label>Contraseña</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <div className="stack">
            <button className="btn btn-primary">Ingresar</button>
            <Link className="btn btn-outline" to="/register">Crear cuenta</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
