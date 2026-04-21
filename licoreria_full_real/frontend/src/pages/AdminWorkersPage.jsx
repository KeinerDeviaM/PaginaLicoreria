import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api';

const emptyForm = { id: null, firstName: '', lastName: '', email: '', password: '', phone: '', address: '', active: true };

export default function AdminWorkersPage() {
  const [workers, setWorkers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('TRABAJADORES');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState(emptyForm);

  async function loadData() {
    try {
      setLoading(true);
      setError('');
      const [workersRes, usersRes] = await Promise.all([api.get('/users/workers'), api.get('/users')]);
      setWorkers(Array.isArray(workersRes.data?.data) ? workersRes.data.data : workersRes.data || []);
      setUsers(Array.isArray(usersRes.data?.data) ? usersRes.data.data : usersRes.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudieron cargar los usuarios');
    } finally { setLoading(false); }
  }

  useEffect(() => { loadData(); }, []);
  const filteredWorkers = useMemo(() => workers.filter((worker) => JSON.stringify(worker).toLowerCase().includes(search.toLowerCase())), [workers, search]);
  const filteredUsers = useMemo(() => users.filter((u) => JSON.stringify(u).toLowerCase().includes(search.toLowerCase())), [users, search]);

  function onChange(e) { const { name, value, type, checked } = e.target; setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value })); }
  function startEdit(worker) { setEditing(true); setForm({ id: worker.id, firstName: worker.firstName || '', lastName: worker.lastName || '', email: worker.email || '', password: '', phone: worker.phone || '', address: worker.address || '', active: typeof worker.active === 'boolean' ? worker.active : true }); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function cancelEdit() { setEditing(false); setForm(emptyForm); }

  async function onSubmit(e) {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      if (editing && form.id) {
        const { data } = await api.put(`/users/workers/${form.id}`, form);
        setSuccess(data.message || 'Trabajador actualizado correctamente');
      } else {
        const { data } = await api.post('/users/workers', form);
        setSuccess(data.message || 'Trabajador creado correctamente');
      }
      setForm(emptyForm);
      setEditing(false);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo guardar el trabajador');
    } finally { setSaving(false); }
  }

  return (
    <div className="page">
      <div className="stack" style={{ justifyContent: 'space-between', alignItems: 'end', gap: 16, flexWrap: 'wrap' }}><div><h1>Trabajadores y usuarios</h1><p className="small">Crea trabajadores y consulta las cuentas registradas.</p></div><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar trabajador o usuario..." style={{ maxWidth: 320 }} /></div>
      {error && <div className="notice error">{error}</div>}{success && <div className="notice success">{success}</div>}
      <div className="stack" style={{ marginTop: 12 }}><button className={`btn ${tab === 'TRABAJADORES' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('TRABAJADORES')}>Trabajadores</button><button className={`btn ${tab === 'USUARIOS' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab('USUARIOS')}>Cuentas de usuarios</button></div>
      <div className="grid-2" style={{ marginTop: 16 }}>
        <div className="card">
          <h2>{editing ? 'Editar trabajador' : 'Crear trabajador'}</h2>
          <form onSubmit={onSubmit}>
            <div className="form-group"><label>Nombre</label><input name="firstName" value={form.firstName} onChange={onChange} /></div>
            <div className="form-group"><label>Apellido</label><input name="lastName" value={form.lastName} onChange={onChange} /></div>
            <div className="form-group"><label>Correo</label><input name="email" value={form.email} onChange={onChange} /></div>
            <div className="form-group"><label>{editing ? 'Nueva contraseña (opcional)' : 'Contraseña'}</label><input type="password" name="password" value={form.password} onChange={onChange} /></div>
            <div className="form-group"><label>Teléfono</label><input name="phone" value={form.phone} onChange={onChange} /></div>
            <div className="form-group"><label>Dirección</label><input name="address" value={form.address} onChange={onChange} /></div>
            {editing && <div className="form-group"><label style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" name="active" checked={form.active} onChange={onChange} /> Trabajador activo</label></div>}
            <div className="stack" style={{ gap: 10 }}><button className="btn btn-primary" disabled={saving}>{saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear trabajador'}</button>{editing && <button type="button" className="btn btn-outline" onClick={cancelEdit}>Cancelar</button>}</div>
          </form>
        </div>
        <div className="card">
          {loading ? <div className="notice">Cargando...</div> : tab === 'TRABAJADORES' ? (
            <>
              <h2>Lista de trabajadores</h2>
              {filteredWorkers.map((worker) => <div key={worker.id} style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 14, marginBottom: 12 }}><div className="stack" style={{ justifyContent: 'space-between', alignItems: 'start', gap: 12 }}><div><strong>{worker.firstName} {worker.lastName}</strong><p className="small" style={{ marginTop: 6 }}>{worker.email}</p><p className="small">{worker.phone || 'Sin teléfono'}</p><p className="small">{worker.address || 'Sin dirección'}</p><p className="small">Estado: {worker.active ? 'Activo' : 'Inactivo'}</p><span className="badge">{worker.role}</span></div><button className="btn btn-outline" onClick={() => startEdit(worker)}>Editar</button></div></div>)}
            </>
          ) : (
            <>
              <h2>Cuentas registradas</h2>
              <div className="table-wrap"><table><thead><tr><th>ID</th><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th></tr></thead><tbody>{filteredUsers.map((u) => <tr key={u.id}><td>{u.id}</td><td>{u.firstName} {u.lastName}</td><td>{u.email}</td><td>{u.role}</td><td><span className={`badge ${u.active ? 'success' : 'danger'}`}>{u.active ? 'Activo' : 'Inactivo'}</span></td></tr>)}</tbody></table></div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
