import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function OrdersPage() {
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState('PENDIENTE');
  const [msg, setMsg] = useState(null);

  async function load() {
    const { data } = await api.get('/orders');
    setRows(data);
  }
  useEffect(() => { load(); }, []);

  function open(order) {
    setSelected(order);
    setStatus(order.status);
  }

  async function updateStatus() {
    try {
      const { data } = await api.patch(`/orders/${selected.orderId}/status`, { status });
      setSelected(data.data);
      setMsg({ type: 'success', text: 'Estado actualizado correctamente' });
      load();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'No se pudo actualizar el estado' });
    }
  }

  return (
    <div className="page">
      <h1>Pedidos</h1>
      {msg && <div className={`notice ${msg.type}`}>{msg.text}</div>}
      <div className="split">
        <section className="card">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Número</th><th>Cliente</th><th>Estado</th><th>Total</th><th>Fecha</th><th></th></tr></thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.orderId}>
                    <td>{r.orderNumber}</td>
                    <td>{r.customerName}</td>
                    <td><span className={`badge ${r.status === 'PENDIENTE' ? 'warning' : r.status === 'PAGADO' ? 'success' : r.status === 'ENTREGADO' ? 'info' : 'danger'}`}>{r.status}</span></td>
                    <td>${r.total.toLocaleString('es-CO')}</td>
                    <td>{new Date(r.createdAt).toLocaleString()}</td>
                    <td><button className="btn btn-outline" onClick={()=>open(r)}>Ver</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        {selected && (
          <section className="card">
            <h3>Detalle del pedido</h3>
            <p><strong>Número:</strong> {selected.orderNumber}</p>
            <p><strong>Cliente:</strong> {selected.customerName}</p>
            <p><strong>Correo:</strong> {selected.customerEmail}</p>
            <p><strong>Total:</strong> ${selected.total.toLocaleString('es-CO')}</p>
            <div className="form-group">
              <label>Estado</label>
              <select value={status} onChange={(e)=>setStatus(e.target.value)}>
                <option>PENDIENTE</option>
                <option>PAGADO</option>
                <option>ENTREGADO</option>
                <option>CANCELADO</option>
              </select>
            </div>
            <button className="btn btn-primary" onClick={updateStatus}>Actualizar estado</button>
            <hr className="sep" />
            {selected.details.map(item => (
              <div key={item.detailId} className="stack" style={{justifyContent:'space-between'}}>
                <span>{item.name} x {item.quantity}</span>
                <strong>${item.subtotal.toLocaleString('es-CO')}</strong>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
