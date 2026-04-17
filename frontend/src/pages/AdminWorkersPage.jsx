import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api';

const emptyForm = {
  id: null,
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  phone: '',
  address: '',
  active: true
};

const normalize = (value) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export default function AdminWorkersPage() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState(emptyForm);

  async function loadWorkers() {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get('/users/workers');
      setWorkers(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudieron cargar los trabajadores');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWorkers();
  }, []);

  const filteredWorkers = useMemo(() => {
    const term = normalize(search).trim();
    if (!term) return workers;

    return workers.filter((worker) => {
      const searchable = [
        worker.firstName,
        worker.lastName,
        worker.email,
        worker.phone,
        worker.address,
        worker.role,
        worker.active ? 'activo' : 'inactivo'
      ]
        .map(normalize)
        .join(' ');

      return searchable.includes(term);
    });
  }, [workers, search]);

  function onChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  }

  function startEdit(worker) {
    setEditing(true);
    setError('');
    setSuccess('');
    setForm({
      id: worker.id,
      firstName: worker.firstName || '',
      lastName: worker.lastName || '',
      email: worker.email || '',
      password: '',
      phone: worker.phone || '',
      address: worker.address || '',
      active: typeof worker.active === 'boolean' ? worker.active : true
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() {
    setEditing(false);
    setForm(emptyForm);
    setError('');
    setSuccess('');
  }

  async function onSubmit(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      if (editing && form.id) {
        const { data } = await api.put(`/users/workers/${form.id}`, {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          password: form.password,
          phone: form.phone,
          address: form.address,
          active: form.active
        });

        setSuccess(data.message || 'Trabajador actualizado correctamente');
      } else {
        const { data } = await api.post('/users/workers', {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          password: form.password,
          phone: form.phone,
          address: form.address
        });

        setSuccess(data.message || 'Trabajador creado correctamente');
      }

      setForm(emptyForm);
      setEditing(false);
      await loadWorkers();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo guardar el trabajador');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container page">
      <div className="stack" style={{ justifyContent: 'space-between', alignItems: 'end', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1>Trabajadores</h1>
          <p className="small">Crea, consulta y edita trabajadores del sistema.</p>
        </div>

        <div style={{ position: 'relative' }}>
          <span
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#9ca3af',
              pointerEvents: 'none'
            }}
          >
            ðŸ”
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar trabajador..."
            style={{ minWidth: 280, paddingLeft: 36 }}
          />
        </div>
      </div>

      {error && <div className="notice error">{error}</div>}
      {success && <div className="notice success">{success}</div>}

      <div className="grid-2" style={{ marginTop: 16 }}>
        <div className="card">
          <h2>{editing ? 'Editar trabajador' : 'Crear trabajador'}</h2>

          <form onSubmit={onSubmit}>
            <div className="form-group">
              <label>Nombre</label>
              <input name="firstName" value={form.firstName} onChange={onChange} required />
            </div>

            <div className="form-group">
              <label>Apellido</label>
              <input name="lastName" value={form.lastName} onChange={onChange} required />
            </div>

            <div className="form-group">
              <label>Correo</label>
              <input name="email" value={form.email} onChange={onChange} required />
            </div>

            <div className="form-group">
              <label>{editing ? 'Nueva contraseña (opcional)' : 'Contraseña'}</label>
              <input type="password" name="password" value={form.password} onChange={onChange} required={!editing} />
            </div>

            <div className="form-group">
              <label>Teléfono</label>
              <input name="phone" value={form.phone} onChange={onChange} />
            </div>

            <div className="form-group">
              <label>Dirección</label>
              <input name="address" value={form.address} onChange={onChange} />
            </div>

            {editing && (
              <div className="form-group">
                <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    name="active"
                    checked={form.active}
                    onChange={onChange}
                  />
                  Trabajador activo
                </label>
              </div>
            )}

            <div className="stack" style={{ gap: 10 }}>
              <button className="btn btn-primary" disabled={saving}>
                {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear trabajador'}
              </button>

              {editing && (
                <button type="button" className="btn btn-outline" onClick={cancelEdit}>
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="card">
          <h2>Lista de trabajadores</h2>

          {loading ? (
            <div className="notice">Cargando trabajadores...</div>
          ) : filteredWorkers.length === 0 ? (
            <div className="notice">No hay trabajadores registrados.</div>
          ) : (
            <div className="stack-col">
              {filteredWorkers.map((worker) => (
                <div
                  key={worker.id}
                  style={{
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 14,
                    padding: 14,
                    marginBottom: 12,
                    background: worker.active ? 'transparent' : 'rgba(255,255,255,0.03)'
                  }}
                >
                  <div className="stack" style={{ justifyContent: 'space-between', alignItems: 'start', gap: 12 }}>
                    <div>
                      <strong>{worker.firstName} {worker.lastName}</strong>
                      <p className="small" style={{ marginTop: 6 }}>{worker.email}</p>
                      <p className="small">{worker.phone || 'Sin teléfono'}</p>
                      <p className="small">{worker.address || 'Sin dirección'}</p>
                      <p className="small">Estado: {worker.active ? 'Activo' : 'Inactivo'}</p>
                      <span className="badge">{worker.role}</span>
                    </div>

                    <button className="btn btn-outline" onClick={() => startEdit(worker)}>
                      Editar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
