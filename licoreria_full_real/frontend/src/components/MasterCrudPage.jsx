import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api';

export default function MasterCrudPage({ endpoint, title, fields }) {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState(null);
  const [search, setSearch] = useState('');

  async function load() {
    const { data } = await api.get(endpoint, { params: search ? { q: search } : {} });
    setRows(Array.isArray(data) ? data : data?.data || []);
  }

  useEffect(() => { load(); }, [endpoint]);

  async function submit(e) {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`${endpoint}/${editingId}`, form);
        setMessage({ type: 'success', text: `${title} actualizado correctamente` });
      } else {
        await api.post(endpoint, form);
        setMessage({ type: 'success', text: `${title} creado correctamente` });
      }
      setForm({});
      setEditingId(null);
      load();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'No se pudo guardar' });
    }
  }

  async function toggle(id) {
    if (!confirm('¿Seguro que deseas cambiar el estado?')) return;
    try {
      await api.patch(`${endpoint}/${id}/toggle`);
      setMessage({ type: 'success', text: 'Estado actualizado' });
      load();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'No se pudo actualizar' });
    }
  }

  function startEdit(row) {
    setEditingId(row.id);
    setForm(row);
  }

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((r) => JSON.stringify(r).toLowerCase().includes(term));
  }, [rows, search]);

  return (
    <div className="page">
      <div className="stack" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>{title}</h1>
        <input placeholder={`Buscar ${title.toLowerCase()}`} value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 280 }} />
      </div>
      {message && <div className={`notice ${message.type}`}>{message.text}</div>}
      <div className="split">
        <section className="card">
          <h3>{editingId ? `Editar ${title}` : `Nuevo ${title}`}</h3>
          <form onSubmit={submit}>
            {fields.map((f) => (
              <div key={f.name} className="form-group">
                <label>{f.label}</label>
                {f.type === 'textarea' ? (
                  <textarea value={form[f.name] || ''} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} />
                ) : (
                  <input value={form[f.name] || ''} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} />
                )}
              </div>
            ))}
            <div className="stack">
              <button className="btn btn-primary">{editingId ? 'Actualizar' : 'Crear'}</button>
              {editingId && <button type="button" className="btn btn-outline" onClick={() => { setEditingId(null); setForm({}); }}>Cancelar</button>}
            </div>
          </form>
        </section>
        <section className="card">
          <h3>Listado</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  {fields.map((f) => <th key={f.name}>{f.label}</th>)}
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    {fields.map((f) => <td key={f.name}>{r[f.name]}</td>)}
                    <td><span className={`badge ${r.active ? 'success' : 'danger'}`}>{r.active ? 'Activo' : 'Inactivo'}</span></td>
                    <td className="stack">
                      <button className="btn btn-outline" onClick={() => startEdit(r)}>Editar</button>
                      <button className="btn btn-wine" onClick={() => toggle(r.id)}>{r.active ? 'Desactivar' : 'Activar'}</button>
                    </td>
                  </tr>
                ))}
                {!filtered.length && <tr><td colSpan={fields.length + 3}>Sin registros</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
