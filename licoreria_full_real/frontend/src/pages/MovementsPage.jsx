import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function MovementsPage() {
  const [rows, setRows] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ productId: '', quantity: 1, reason: '', notes: '', type: 'ENTRADA' });
  const [msg, setMsg] = useState(null);

  async function load() {
    const [movements, productRes] = await Promise.all([api.get('/movements'), api.get('/products')]);
    setRows(Array.isArray(movements.data) ? movements.data : movements.data?.data || []);
    setProducts(Array.isArray(productRes.data) ? productRes.data : productRes.data?.data || []);
  }
  useEffect(() => { load(); }, []);

  async function submit(e) {
    e.preventDefault();
    try {
      const endpoint = form.type === 'ENTRADA' ? '/movements/in' : '/movements/out';
      await api.post(endpoint, { productId: Number(form.productId), quantity: Number(form.quantity), reason: form.reason, notes: form.notes });
      setMsg({ type: 'success', text: 'Movimiento registrado correctamente.' });
      setForm({ productId: '', quantity: 1, reason: '', notes: '', type: 'ENTRADA' });
      load();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'No se pudo registrar el movimiento.' });
    }
  }

  return (
    <div className="page">
      <h1>Movimientos</h1>
      {msg && <div className={`notice ${msg.type}`}>{msg.text}</div>}
      <div className="split">
        <section className="card">
          <h3>Registrar movimiento</h3>
          <form onSubmit={submit}>
            <div className="form-group"><label>Tipo</label><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="ENTRADA">Entrada</option><option value="SALIDA">Salida</option></select></div>
            <div className="form-group"><label>Producto</label><select value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })}><option value="">Selecciona</option>{products.map((p) => <option key={p.id} value={p.id}>{p.code} · {p.name}</option>)}</select></div>
            <div className="form-group"><label>Cantidad</label><input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></div>
            <div className="form-group"><label>Motivo</label><input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
            <div className="form-group"><label>Observación</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <button className="btn btn-primary">Registrar</button>
          </form>
        </section>
        <section className="card">
          <h3>Historial</h3>
          <div className="table-wrap"><table><thead><tr><th>Producto</th><th>Tipo</th><th>Cantidad</th><th>Usuario</th><th>Fecha</th></tr></thead><tbody>{rows.map((r) => <tr key={r.id}><td>{r.productCode} · {r.productName}</td><td>{r.type}</td><td>{r.quantity}</td><td>{r.userName}</td><td>{new Date(r.createdAt).toLocaleString('es-CO')}</td></tr>)}</tbody></table></div>
        </section>
      </div>
    </div>
  );
}
