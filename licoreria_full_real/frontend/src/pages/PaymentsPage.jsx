import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

const money = (value) => `$${Number(value || 0).toLocaleString('es-CO')}`;
const dateText = (value) => value ? new Date(value).toLocaleString('es-CO') : 'No disponible';

export default function PaymentsPage() {
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [msg, setMsg] = useState(null);

  async function load() {
    const { data } = await api.get('/payments');
    const payments = Array.isArray(data) ? data : data?.data || [];
    setRows(payments);
    if (!selected && payments.length > 0) setSelected(payments[0]);
  }
  useEffect(() => { load(); }, []);
  const filtered = useMemo(() => rows.filter((r) => {
    const term = search.trim().toLowerCase();
    const searchOk = !term || JSON.stringify(r).toLowerCase().includes(term);
    const statusOk = statusFilter === 'TODOS' || String(r.status || '').toUpperCase() === statusFilter;
    return searchOk && statusOk;
  }), [rows, search, statusFilter]);

  async function updateStatus(id, action) {
    try {
      const { data } = await api.patch(`/payments/${id}/${action}`);
      setSelected(data.data || data);
      setMsg({ type: 'success', text: `Pago ${action === 'approve' ? 'aprobado' : 'rechazado'} correctamente.` });
      load();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'No se pudo actualizar el pago.' });
    }
  }

  return (
    <div className="page">
      <div className="stack" style={{ justifyContent: 'space-between', alignItems: 'end', gap: 16, flexWrap: 'wrap' }}><div><h1>Pagos</h1><p className="small">Revisa pagos, valida referencias y aprueba o rechaza operaciones.</p></div><div className="stack" style={{ gap: 8, flexWrap: 'wrap' }}><input placeholder="Buscar por pedido o referencia" value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 260 }} /><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="TODOS">Todos</option><option value="PENDIENTE">Pendientes</option><option value="APROBADO">Aprobados</option><option value="RECHAZADO">Rechazados</option></select></div></div>
      {msg && <div className={`notice ${msg.type}`}>{msg.text}</div>}
      <div className="split" style={{ marginTop: 16 }}>
        <section className="card"><div className="table-wrap"><table><thead><tr><th>Pedido</th><th>Monto</th><th>Método</th><th>Estado</th><th>Fecha</th><th></th></tr></thead><tbody>{filtered.map((r) => <tr key={r.paymentId}><td>{r.orderNumber}</td><td>{money(r.amount)}</td><td>{r.method}</td><td>{r.status}</td><td>{dateText(r.createdAt)}</td><td><button className="btn btn-outline" onClick={() => setSelected(r)}>Ver detalle</button></td></tr>)}</tbody></table></div></section>
        {selected && <section className="card"><h3>Detalle del pago</h3><p><strong>Pedido:</strong> {selected.orderNumber}</p><p><strong>Monto:</strong> {money(selected.amount)}</p><p><strong>Método:</strong> {selected.method}</p><p><strong>Referencia:</strong> {selected.reference || '—'}</p><p><strong>Estado:</strong> {selected.status}</p><p><strong>Aprobado por:</strong> {selected.approvedBy || 'Pendiente'}</p>{selected.status === 'PENDIENTE' ? <div className="stack" style={{ gap: 10, marginTop: 16 }}><button className="btn btn-primary" onClick={() => updateStatus(selected.paymentId, 'approve')}>Aprobar pago</button><button className="btn btn-wine" onClick={() => updateStatus(selected.paymentId, 'reject')}>Rechazar pago</button></div> : <div className="notice info" style={{ marginTop: 16 }}>Este pago ya fue procesado.</div>}<div className="stack" style={{ gap: 10, marginTop: 16 }}><Link className="btn btn-outline" to="/admin/orders">Ir a pedidos</Link><Link className="btn btn-outline" to="/admin/invoices">Ir a facturas</Link></div></section>}
      </div>
    </div>
  );
}
