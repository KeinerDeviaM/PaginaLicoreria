import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function MovementsPage() {
  const [rows, setRows] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ type:'ENTRADA', productId:'', quantity:1, reason:'', notes:'' });
  const [msg, setMsg] = useState(null);

  async function load() {
    const [m, p] = await Promise.all([api.get('/movements'), api.get('/products')]);
    setRows(m.data);
    setProducts(p.data.filter(x => x.active));
  }

  useEffect(() => { load(); }, []);

  async function submit(e) {
    e.preventDefault();
    try {
      await api.post(form.type === 'ENTRADA' ? '/movements/in' : '/movements/out', form);
      setMsg({ type: 'success', text: 'Movimiento registrado correctamente' });
      setForm({ type:'ENTRADA', productId:'', quantity:1, reason:'', notes:'' });
      load();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'No se pudo registrar el movimiento' });
    }
  }

  return (
    <div className="page">
      <h1>Movimientos</h1>
      {msg && <div className={`notice ${msg.type}`}>{msg.text}</div>}
      <div className="split">
        <section className="card">
          <h3>Nuevo movimiento</h3>
          <form onSubmit={submit}>
            <div className="form-group"><label>Tipo</label><select value={form.type} onChange={e=>setForm({...form, type:e.target.value})}><option>ENTRADA</option><option>SALIDA</option></select></div>
            <div className="form-group"><label>Producto</label><select value={form.productId} onChange={e=>setForm({...form, productId:e.target.value})}><option value="">Selecciona</option>{products.map(p=><option key={p.id} value={p.id}>{p.code} · {p.name}</option>)}</select></div>
            <div className="form-group"><label>Cantidad</label><input type="number" value={form.quantity} onChange={e=>setForm({...form, quantity:e.target.value})} /></div>
            <div className="form-group"><label>Motivo</label><input value={form.reason} onChange={e=>setForm({...form, reason:e.target.value})} /></div>
            <div className="form-group"><label>Observación</label><textarea value={form.notes} onChange={e=>setForm({...form, notes:e.target.value})} /></div>
            <button className="btn btn-primary">Guardar movimiento</button>
          </form>
        </section>
        <section className="card">
          <h3>Historial</h3>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Producto</th><th>Tipo</th><th>Cantidad</th><th>Usuario</th><th>Fecha</th></tr></thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id}>
                    <td>{r.productCode} · {r.productName}</td>
                    <td><span className={`badge ${r.type === 'ENTRADA' ? 'success' : 'danger'}`}>{r.type}</span></td>
                    <td>{r.quantity}</td>
                    <td>{r.userName}</td>
                    <td>{new Date(r.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
