import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

const money = (value) => `$${Number(value || 0).toLocaleString('es-CO')}`;
const dateText = (value) => value ? new Date(value).toLocaleString('es-CO') : 'No disponible';

export default function OrdersPage() {
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState('PENDIENTE');
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);
      const { data } = await api.get('/orders');
      const orders = Array.isArray(data) ? data : data?.data || [];
      setRows(orders);
      if (!selected && orders.length > 0) { setSelected(orders[0]); setStatus(orders[0].status || 'PENDIENTE'); }
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((r) => JSON.stringify(r).toLowerCase().includes(term));
  }, [rows, search]);
  function open(order) { setSelected(order); setStatus(order.status || 'PENDIENTE'); }
  async function updateStatus() {
    try { const { data } = await api.patch(`/orders/${selected.orderId}/status`, { status }); setSelected(data.data || data); setMsg({ type: 'success', text: 'Estado del pedido actualizado correctamente.' }); load(); }
    catch (err) { setMsg({ type: 'error', text: err.response?.data?.message || 'No se pudo actualizar el estado del pedido.' }); }
  }
  return (
    <div className="page">
      <div className="stack" style={{ justifyContent: 'space-between', alignItems: 'end', gap: 16, flexWrap: 'wrap' }}><div><h1>Pedidos</h1><p className="small">Consulta pedidos, revisa detalles y actualiza su estado.</p></div><input placeholder="Buscar por número o cliente" value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 280 }} /></div>
      {msg && <div className={`notice ${msg.type}`}>{msg.text}</div>}
      <div className="split" style={{ marginTop: 16 }}>
        <section className="card">{loading ? <div className="notice">Cargando pedidos...</div> : <div className="table-wrap"><table><thead><tr><th>Número</th><th>Cliente</th><th>Estado</th><th>Total</th><th>Fecha</th><th></th></tr></thead><tbody>{filtered.map((r) => <tr key={r.orderId}><td>{r.orderNumber}</td><td>{r.customerName}</td><td>{r.status}</td><td>{money(r.total)}</td><td>{dateText(r.createdAt)}</td><td><button className="btn btn-outline" onClick={() => open(r)}>Ver detalle</button></td></tr>)}</tbody></table></div>}</section>
        {selected && <section className="card"><h3>Detalle del pedido</h3><div className="grid grid-2" style={{ marginTop: 10 }}><div className="card"><div className="small">Número</div><strong>{selected.orderNumber}</strong></div><div className="card"><div className="small">Total</div><strong>{money(selected.total)}</strong></div><div className="card"><div className="small">Cliente</div><strong>{selected.customerName || 'No disponible'}</strong></div><div className="card"><div className="small">Correo</div><strong>{selected.customerEmail || 'No disponible'}</strong></div><div className="card"><div className="small">Entrega</div><strong>{selected.deliveryType || 'No disponible'}</strong></div><div className="card"><div className="small">Dirección</div><strong>{selected.deliveryAddress || 'Sin dirección'}</strong></div></div><div className="form-group" style={{ marginTop: 16 }}><label>Cambiar estado</label><select value={status} onChange={(e) => setStatus(e.target.value)}><option value="PENDIENTE">PENDIENTE</option><option value="PAGADO">PAGADO</option><option value="ENTREGADO">ENTREGADO</option><option value="CANCELADO">CANCELADO</option></select></div><div className="stack" style={{ gap: 10, flexWrap: 'wrap' }}><button className="btn btn-primary" onClick={updateStatus}>Guardar estado</button><Link className="btn btn-outline" to="/admin/payments">Ir a pagos</Link><Link className="btn btn-outline" to="/admin/invoices">Ir a facturas</Link></div><hr className="sep" /><h4 style={{ marginBottom: 10 }}>Productos del pedido</h4><div className="table-wrap"><table><thead><tr><th>Producto</th><th>Cantidad</th><th>Precio</th><th>Subtotal</th></tr></thead><tbody>{(selected.details || []).map((item) => <tr key={item.detailId || `${item.productId}-${item.name}`}><td>{item.name}</td><td>{item.quantity}</td><td>{money(item.price || item.unitPrice)}</td><td>{money(item.subtotal)}</td></tr>)}</tbody></table></div>{selected.promotions?.length > 0 && <div className="card" style={{ marginTop: 12 }}><div className="small">Promociones aplicadas</div>{selected.promotions.map((p) => <div key={p.code} className="small">• {p.description}</div>)}</div>}</section>}
      </div>
    </div>
  );
}
