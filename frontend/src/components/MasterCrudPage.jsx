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

  useEffect(() => {
    load();
  }, [endpoint]);

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
    if (!confirm('Seguro que deseas cambiar el estado?')) return;
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
    <div className="page page-shell">
      <section className="toolbar-card reveal-up">
        <div className="page-header">
          <div>
            <div className="eyebrow">Gestion maestra</div>
            <h1>{title}</h1>
            <p className="small">Administra registros, descripciones y estados con una vista mas clara.</p>
          </div>
        </div>
      </section>

      {message && <div className={`notice ${message.type}`}>{message.text}</div>}

      <div className="split">
        <section className="card reveal-up">
          <h3>{editingId ? `Editar ${title}` : `Nuevo ${title}`}</h3>
          <form onSubmit={submit}>
            {fields.map((field) => (
              <div key={field.name} className="form-group">
                <label>{field.label}</label>
                {field.type === 'textarea' ? (
                  <textarea
                    value={form[field.name] || ''}
                    onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                  />
                ) : (
                  <input
                    value={form[field.name] || ''}
                    onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                  />
                )}
              </div>
            ))}
            <div className="stack">
              <button className="btn btn-primary">{editingId ? 'Actualizar' : 'Crear'}</button>
              {editingId && (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setEditingId(null);
                    setForm({});
                  }}
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="table-card reveal-up reveal-delay-1">
          <div className="table-header">
            <div>
              <h3>Listado</h3>
              <p className="small">{rows.length} registros cargados.</p>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  {fields.map((field) => (
                    <th key={field.name}>{field.label}</th>
                  ))}
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.id}</td>
                    {fields.map((field) => (
                      <td key={field.name}>{row[field.name]}</td>
                    ))}
                    <td>
                      <span className={`badge ${row.active ? 'success' : 'danger'}`}>
                        {row.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div className="stack">
                        <button className="btn btn-outline" onClick={() => startEdit(row)}>
                          Editar
                        </button>
                        <button className="btn btn-wine" onClick={() => toggle(row.id)}>
                          {row.active ? 'Desactivar' : 'Activar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr>
                    <td colSpan={fields.length + 3}>Sin registros</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
