import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { getAuth, setAuth } from '../auth';

const initialProfile = { firstName: '', lastName: '', email: '', phone: '', address: '' };
const initialPassword = { currentPassword: '', newPassword: '', confirmPassword: '' };

export default function ProfilePage() {
  const authData = getAuth();
  const [profile, setProfile] = useState(initialProfile);
  const [passwordForm, setPasswordForm] = useState(initialPassword);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    api.get('/auth/me').then(({ data }) => {
      const user = data.data;
      setProfile({ firstName: user.firstName || '', lastName: user.lastName || '', email: user.email || '', phone: user.phone || '', address: user.address || '' });
      setLoading(false);
    }).catch((err) => {
      setMsg({ type: 'error', text: err.response?.data?.message || 'No se pudo cargar el perfil.' });
      setLoading(false);
    });
  }, []);

  async function saveProfile(e) {
    e.preventDefault();
    try {
      const { data } = await api.put('/users/profile', profile);
      setAuth(authData.token, data.data);
      setMsg({ type: 'success', text: 'Perfil actualizado correctamente.' });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'No se pudo actualizar el perfil.' });
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) return setMsg({ type: 'error', text: 'Debes completar todos los campos.' });
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return setMsg({ type: 'error', text: 'La confirmación no coincide.' });
    try {
      const { data } = await api.put('/users/profile/password', { currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      setPasswordForm(initialPassword);
      setMsg({ type: 'success', text: data.message || 'Contraseña actualizada correctamente.' });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'No se pudo cambiar la contraseña.' });
    }
  }

  if (loading) return <div className="notice">Cargando perfil...</div>;

  return (
    <div className="page">
      <div className="stack" style={{ justifyContent: 'space-between', alignItems: 'end', gap: 16, flexWrap: 'wrap' }}>
        <div><h1>Mi perfil</h1><p className="small">Actualiza tus datos personales y contraseña.</p></div>
      </div>
      {msg && <div className={`notice ${msg.type}`}>{msg.text}</div>}
      <div className="grid grid-2" style={{ marginTop: 16 }}>
        <section className="card">
          <h3>Datos personales</h3>
          <form onSubmit={saveProfile}>
            <div className="form-group"><label>Nombre</label><input value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} /></div>
            <div className="form-group"><label>Apellido</label><input value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} /></div>
            <div className="form-group"><label>Correo</label><input value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} /></div>
            <div className="form-group"><label>Teléfono</label><input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></div>
            <div className="form-group"><label>Dirección</label><input value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} /></div>
            <button className="btn btn-primary">Guardar perfil</button>
          </form>
        </section>
        <section className="card">
          <h3>Cambiar contraseña</h3>
          <form onSubmit={changePassword}>
            <div className="form-group"><label>Contraseña actual</label><input type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} /></div>
            <div className="form-group"><label>Nueva contraseña</label><input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} /></div>
            <div className="form-group"><label>Confirmar nueva contraseña</label><input type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} /></div>
            <button className="btn btn-primary">Actualizar contraseña</button>
          </form>
        </section>
      </div>
    </div>
  );
}
