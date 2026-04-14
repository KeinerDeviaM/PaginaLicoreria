import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function MasterCrudPage({ endpoint, title, fields }) {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState(null);

  async function load() {
    const { data } = await api.get(endpoint);
    setRows(data);
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

  return (
    <div className="page">
      <h1>{title}</h1>
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
                  {fields.map(f => <th key={f.name}>{f.label}</th>)}
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    {fields.map(f => <td key={f.name}>{r[f.name]}</td>)}
                    <td><span className={`badge ${r.active ? 'success' : 'danger'}`}>{r.active ? 'Activo' : 'Inactivo'}</span></td>
                    <td className="stack">
                      <button className="btn btn-outline" onClick={() => startEdit(r)}>Editar</button>
                      <button className="btn btn-wine" onClick={() => toggle(r.id)}>{r.active ? 'Desactivar' : 'Activar'}</button>
                    </td>
                  </tr>
                ))}
                {!rows.length && <tr><td colSpan={fields.length + 3}>Sin registros</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
