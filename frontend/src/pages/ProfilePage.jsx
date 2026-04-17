import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { getAuth, setAuth } from '../auth';

const initialProfile = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: ''
};

const initialPassword = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
};

export default function ProfilePage() {
  const authData = getAuth();
  const [profile, setProfile] = useState(initialProfile);
  const [passwordForm, setPasswordForm] = useState(initialPassword);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [msg, setMsg] = useState(null);

  async function loadProfile() {
    try {
      setLoading(true);
      setMsg(null);

      const { data } = await api.get('/auth/me');
      const user = data?.data || data;

      setProfile({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || ''
      });
    } catch (err) {
      setMsg({
        type: 'error',
        text: err.response?.data?.message || 'No se pudo cargar el perfil.'
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  function handleProfileChange(e) {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  }

  function handlePasswordChange(e) {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  }

  async function saveProfile(e) {
    e.preventDefault();

    try {
      setSavingProfile(true);
      setMsg(null);

      const { data } = await api.put('/users/profile', profile);
      const updatedUser = data?.data || data;

      setAuth(authData.token, updatedUser);

      setMsg({
        type: 'success',
        text: 'Perfil actualizado correctamente.'
      });
    } catch (err) {
      setMsg({
        type: 'error',
        text: err.response?.data?.message || 'No se pudo actualizar el perfil.'
      });
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword(e) {
    e.preventDefault();

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setMsg({ type: 'error', text: 'Debes completar todos los campos de contraseña.' });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMsg({ type: 'error', text: 'La confirmación de la nueva contraseña no coincide.' });
      return;
    }

    try {
      setSavingPassword(true);
      setMsg(null);

      const { data } = await api.put('/users/profile/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      setPasswordForm(initialPassword);

      setMsg({
        type: 'success',
        text: data?.message || 'Contraseña actualizada correctamente.'
      });
    } catch (err) {
      setMsg({
        type: 'error',
        text: err.response?.data?.message || 'No se pudo cambiar la contraseña.'
      });
    } finally {
      setSavingPassword(false);
    }
  }

  if (loading) {
    return <div className="notice">Cargando perfil...</div>;
  }

  return (
    <div className="page">
      <div className="stack" style={{ justifyContent: 'space-between', alignItems: 'end', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1>Mi perfil</h1>
          <p className="small">Actualiza tus datos personales y tu contraseña.</p>
        </div>
      </div>

      {msg && <div className={`notice ${msg.type}`}>{msg.text}</div>}

      <div className="grid grid-2" style={{ marginTop: 16 }}>
        <section className="card">
          <h3>Datos personales</h3>

          <form onSubmit={saveProfile}>
            <div className="form-group">
              <label>Nombre</label>
              <input name="firstName" value={profile.firstName} onChange={handleProfileChange} />
            </div>

            <div className="form-group">
              <label>Apellido</label>
              <input name="lastName" value={profile.lastName} onChange={handleProfileChange} />
            </div>

            <div className="form-group">
              <label>Correo</label>
              <input name="email" value={profile.email} onChange={handleProfileChange} />
            </div>

            <div className="form-group">
              <label>Teléfono</label>
              <input name="phone" value={profile.phone} onChange={handleProfileChange} />
            </div>

            <div className="form-group">
              <label>Dirección</label>
              <input name="address" value={profile.address} onChange={handleProfileChange} />
            </div>

            <button className="btn btn-primary" disabled={savingProfile}>
              {savingProfile ? 'Guardando...' : 'Guardar perfil'}
            </button>
          </form>
        </section>

        <section className="card">
          <h3>Cambiar contraseña</h3>

          <form onSubmit={changePassword}>
            <div className="form-group">
              <label>Contraseña actual</label>
              <input
                type="password"
                name="currentPassword"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
              />
            </div>

            <div className="form-group">
              <label>Nueva contraseña</label>
              <input
                type="password"
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
              />
            </div>

            <div className="form-group">
              <label>Confirmar nueva contraseña</label>
              <input
                type="password"
                name="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
              />
            </div>

            <button className="btn btn-primary" disabled={savingPassword}>
              {savingPassword ? 'Actualizando...' : 'Cambiar contraseña'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
