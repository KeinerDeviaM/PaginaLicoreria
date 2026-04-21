import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api';

export default function UsersPage() {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('TODOS');

  useEffect(() => { api.get('/users').then(({ data }) => setRows(data.data || data)); }, []);

  const filtered = useMemo(() => rows.filter((u) => {
    const term = search.trim().toLowerCase();
    const searchOk = !term || JSON.stringify(u).toLowerCase().includes(term);
    const roleOk = roleFilter === 'TODOS' || u.role === roleFilter;
    return searchOk && roleOk;
  }), [rows, search, roleFilter]);

  return (
    <div className="page">
      <div className="stack" style={{ justifyContent: 'space-between', alignItems: 'center' }}><div><h1>Usuarios</h1><p className="small">Consulta cuentas de clientes, trabajadores y administradores.</p></div><div className="stack"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar usuario..." style={{ maxWidth: 260 }} /><select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}><option value="TODOS">Todos</option><option value="CLIENTE">Clientes</option><option value="TRABAJADOR">Trabajadores</option><option value="ADMIN">Administradores</option></select></div></div>
      <div className="card" style={{ marginTop: 16 }}><div className="table-wrap"><table><thead><tr><th>ID</th><th>Nombre</th><th>Correo</th><th>Teléfono</th><th>Rol</th><th>Estado</th></tr></thead><tbody>{filtered.map((u) => <tr key={u.id}><td>{u.id}</td><td>{u.firstName} {u.lastName}</td><td>{u.email}</td><td>{u.phone || '—'}</td><td>{u.role}</td><td><span className={`badge ${u.active ? 'success' : 'danger'}`}>{u.active ? 'Activo' : 'Inactivo'}</span></td></tr>)}{!filtered.length && <tr><td colSpan="6">Sin resultados</td></tr>}</tbody></table></div></div>
    </div>
  );
}
