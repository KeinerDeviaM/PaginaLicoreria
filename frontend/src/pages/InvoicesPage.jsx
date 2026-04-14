import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function InvoicesPage() {
  const [rows, setRows] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [selected, setSelected] = useState(null);
  const [msg, setMsg] = useState(null);

  async function load() {
    const [i, o] = await Promise.all([api.get('/invoices'), api.get('/orders')]);
    setRows(i.data);
    setOrders(o.data.filter(x => x.status === 'PAGADO'));
  }

  useEffect(() => { load(); }, []);

  async function generate() {
    if (!selectedOrderId) return;
    try {
      const { data } = await api.post(`/invoices/generate/${selectedOrderId}`);
      setSelected(data.data);
      setMsg({ type: 'success', text: data.message });
      load();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'No se pudo generar la factura' });
    }
  }

  return (
    <div className="page">
      <h1>Facturas</h1>
      {msg && <div className={`notice ${msg.type}`}>{msg.text}</div>}
      <div className="split">
        <section className="card">
          <div className="stack" style={{justifyContent:'space-between', alignItems:'center'}}>
            <h3>Listado de facturas</h3>
            <div className="stack">
              <select value={selectedOrderId} onChange={(e)=>setSelectedOrderId(e.target.value)}>
                <option value="">Pedido pagado...</option>
                {orders.map(o => <option key={o.orderId} value={o.orderId}>{o.orderNumber} · {o.customerName}</option>)}
              </select>
              <button className="btn btn-primary" onClick={generate}>Generar factura</button>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Factura</th><th>Pedido</th><th>Cliente</th><th>Total</th><th>Fecha</th><th></th></tr></thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.invoiceId}>
                    <td>{r.invoiceNumber}</td>
                    <td>{r.orderNumber}</td>
                    <td>{r.customerName}</td>
                    <td>${r.total.toLocaleString('es-CO')}</td>
                    <td>{new Date(r.issuedAt).toLocaleString()}</td>
                    <td><button className="btn btn-outline" onClick={()=>setSelected(r)}>Ver</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        {selected && (
          <section className="card">
            <h3>Detalle de factura</h3>
            <p><strong>Número:</strong> {selected.invoiceNumber}</p>
            <p><strong>Pedido:</strong> {selected.orderNumber}</p>
            <p><strong>Cliente:</strong> {selected.customerName}</p>
            <p><strong>Total:</strong> ${selected.total.toLocaleString('es-CO')}</p>
            <p><strong>Fecha:</strong> {new Date(selected.issuedAt).toLocaleString()}</p>
            <p><strong>Observación:</strong> {selected.notes}</p>
          </section>
        )}
      </div>
    </div>
  );
}
