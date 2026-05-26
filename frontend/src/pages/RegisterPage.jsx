import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';

const notes = [
  'Registro rapido para empezar a comprar',
  'Perfil listo para pedidos y facturas',
  'Acceso inmediato al catalogo cuando termines'
];

export default function RegisterPage() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    address: ''
  });
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    try {
      await api.post('/auth/register', form);
      setMessage({ type: 'success', text: 'Registro exitoso. Ahora puedes iniciar sesion.' });
      setTimeout(() => navigate('/login'), 1000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'No se pudo registrar' });
    }
  }

  return (
    <div className="container page">
      <section className="auth-shell">
        <aside className="auth-showcase glass-card reveal-up">
          <div className="eyebrow">Crear cuenta</div>
          <h1>Abre tu acceso a la tienda en pocos pasos.</h1>
          <p className="small" style={{ maxWidth: 520 }}>
            Este flujo ya comparte la misma estetica premium del catalogo para que el ingreso del
            usuario se sienta parte del producto y no una pantalla aislada.
          </p>

          <div className="auth-benefits">
            {notes.map((item, index) => (
              <div key={item} className={`auth-benefit reveal-up reveal-delay-${Math.min(index + 1, 4)}`}>
                <strong>{item}</strong>
              </div>
            ))}
          </div>

          <div className="stack auth-links">
            <Link className="btn btn-outline" to="/login">
              Ya tengo cuenta
            </Link>
          </div>
        </aside>

        <div className="auth-card glass-card reveal-up reveal-delay-1">
          <div className="eyebrow">Nuevo cliente</div>
          <h1>Registro</h1>

          {message && <div className={`notice ${message.type}`}>{message.text}</div>}

          <form onSubmit={submit} className="grid grid-2">
            <div className="form-group">
              <label>Nombre</label>
              <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Apellido</label>
              <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Correo</label>
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Contrasena</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Telefono</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Direccion</label>
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="stack" style={{ gridColumn: '1 / -1' }}>
              <button className="btn btn-primary">Registrarme</button>
              <Link className="btn btn-outline" to="/login">
                Ya tengo cuenta
              </Link>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
