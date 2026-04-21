import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function RegisterPage() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: ''
  });
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setMessage(null);

    const email = form.email.trim().toLowerCase();
    const phone = form.phone.trim();

    if (!form.firstName.trim() || !form.lastName.trim() || !email || !form.password) {
      setMessage({ type: 'error', text: 'Completa los campos obligatorios.' });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage({ type: 'error', text: 'Ingresa un correo válido.' });
      return;
    }

    if (form.password.length < 8) {
      setMessage({ type: 'error', text: 'La contraseña debe tener al menos 8 caracteres.' });
      return;
    }

    if (form.password !== form.confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas no coinciden.' });
      return;
    }

    if (phone && !/^[0-9+\-\s]{7,20}$/.test(phone)) {
      setMessage({ type: 'error', text: 'Ingresa un teléfono válido.' });
      return;
    }

    try {
      setSaving(true);
      await api.post('/auth/register', {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email,
        password: form.password,
        phone,
        address: form.address.trim()
      });

      setMessage({ type: 'success', text: 'Registro exitoso. Ahora puedes iniciar sesión.' });
      setTimeout(() => navigate('/login'), 900);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'No se pudo registrar' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container page" style={{ maxWidth: 620 }}>
      <div className="card">
        <h1>Crear cuenta</h1>
        {message && <div className={`notice ${message.type}`}>{message.text}</div>}
        <form onSubmit={submit} className="grid grid-2">
          <div className="form-group"><label>Nombre</label><input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></div>
          <div className="form-group"><label>Apellido</label><input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></div>
          <div className="form-group"><label>Correo</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div className="form-group"><label>Contraseña</label><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
          <div className="form-group"><label>Confirmar contraseña</label><input type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} /></div>
          <div className="form-group"><label>Teléfono</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>Dirección</label><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div className="stack" style={{ gridColumn: '1 / -1' }}>
            <button className="btn btn-primary" disabled={saving}>{saving ? 'Registrando...' : 'Registrarme'}</button>
            <Link className="btn btn-outline" to="/login">Ya tengo cuenta</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
