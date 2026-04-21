import React, { useEffect, useState } from 'react';
import { api } from '../api';

const money = (value) => `$${Number(value || 0).toLocaleString('es-CO')}`;
const dateText = (value) => value ? new Date(value).toLocaleString('es-CO') : 'No disponible';

function PrintableInvoice({ invoice }) {
  if (!invoice) return null;
  return (
    <div className="invoice-sheet">
      <div className="invoice-header">
        <div>
          <h2>Licorería Pro</h2>
          <div className="small">Factura de venta profesional</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div><strong>{invoice.invoiceNumber}</strong></div>
          <div className="small">Emitida: {dateText(invoice.issuedAt)}</div>
        </div>
      </div>
      <div className="grid grid-2" style={{ marginTop: 14 }}>
        <div className="card"><div className="small">Cliente</div><strong>{invoice.customerName}</strong><div className="small">{invoice.customerEmail}</div></div>
        <div className="card"><div className="small">Venta</div><strong>{invoice.orderNumber}</strong><div className="small">Autorizó pago: {invoice.approvedBy || 'No disponible'}</div></div>
        <div className="card"><div className="small">Entrega</div><strong>{invoice.deliveryType || 'No disponible'}</strong><div className="small">{invoice.deliveryAddress || 'Compra en tienda'}</div></div>
        <div className="card"><div className="small">Método de pago</div><strong>{invoice.paymentMethod || 'No disponible'}</strong><div className="small">Estado: {invoice.status}</div></div>
      </div>
      <div className="table-wrap" style={{ marginTop: 16 }}>
        <table>
          <thead><tr><th>Código</th><th>Producto</th><th>Cantidad</th><th>Precio</th><th>Subtotal</th></tr></thead>
          <tbody>{(invoice.items || []).map((item) => <tr key={`${item.productId}-${item.code}`}><td>{item.code}</td><td>{item.name}</td><td>{item.quantity}</td><td>{money(item.unitPrice)}</td><td>{money(item.subtotal)}</td></tr>)}</tbody>
        </table>
      </div>
      <div className="invoice-totals">
        <div><strong>Subtotal:</strong> {money(invoice.subtotal)}</div>
        <div><strong>Descuento:</strong> -{money(invoice.discountTotal)}</div>
        <div><strong>Total:</strong> {money(invoice.total)}</div>
      </div>
    </div>
  );
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [notes, setNotes] = useState('');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function loadData() {
    try {
      setLoading(true);
      setError('');
      const [invoicesRes, ordersRes] = await Promise.all([api.get('/invoices'), api.get('/orders')]);
      const invoicesData = Array.isArray(invoicesRes.data) ? invoicesRes.data : invoicesRes.data?.data || [];
      const ordersData = Array.isArray(ordersRes.data) ? ordersRes.data : ordersRes.data?.data || [];
      setInvoices(invoicesData);
      setOrders(ordersData);
      if (invoicesData.length > 0) {
        const full = await api.get(`/invoices/${invoicesData[0].invoiceId || invoicesData[0].id}`);
        setSelected(full.data.data || full.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo cargar la información de facturas');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { loadData(); }, []);
  const availableOrders = orders.filter((o) => String(o.status || '').toUpperCase() === 'PAGADO' && !invoices.some((i) => Number(i.orderId) === Number(o.orderId)));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedOrderId) return setError('Debes seleccionar un pedido');
    try {
      setSaving(true);
      setError('');
      const { data } = await api.post(`/invoices/generate/${selectedOrderId}`, { notes });
      setSuccess(data.message || 'Factura generada correctamente');
      setSelectedOrderId('');
      setNotes('');
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo generar la factura');
    } finally { setSaving(false); }
  }

  async function openInvoice(invoiceId) {
    const { data } = await api.get(`/invoices/${invoiceId}`);
    setSelected(data.data || data);
  }

  function exportPdf() { window.print(); }

  return (
    <div className="container page">
      <div className="stack" style={{ justifyContent: 'space-between', alignItems: 'end', gap: 16, flexWrap: 'wrap' }}><div><h1>Facturas</h1><p className="small">Consulta facturas generadas y registra nuevas facturas.</p></div>{selected && <button className="btn btn-primary" onClick={exportPdf}>Exportar PDF</button>}</div>
      {error && <div className="notice error">{error}</div>}{success && <div className="notice success">{success}</div>}
      <div className="grid-2" style={{ marginTop: 16 }}>
        <section className="card"><h3>Generar factura</h3><form onSubmit={handleSubmit}><div className="form-group"><label>Pedido</label><select value={selectedOrderId} onChange={(e) => setSelectedOrderId(e.target.value)}><option value="">Selecciona un pedido</option>{availableOrders.map((o) => <option key={o.orderId} value={o.orderId}>{o.orderNumber} · {o.customerName}</option>)}</select></div><div className="form-group"><label>Observación</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="Observación de la factura" /></div><button className="btn btn-primary" disabled={saving}>{saving ? 'Generando...' : 'Generar factura'}</button></form></section>
        <section className="card printable-invoice-wrapper"><h3>Detalle de factura</h3>{!selected ? <div className="notice">Selecciona una factura de la lista.</div> : <PrintableInvoice invoice={selected} />}</section>
      </div>
      <section className="card" style={{ marginTop: 16 }}><h3>Listado de facturas</h3>{loading ? <div className="notice">Cargando facturas...</div> : !invoices.length ? <div className="notice">No hay facturas registradas.</div> : <div className="table-wrap"><table><thead><tr><th>Número</th><th>Pedido</th><th>Cliente</th><th>Total</th><th>Fecha</th><th>Acción</th></tr></thead><tbody>{invoices.map((invoice) => <tr key={invoice.invoiceId}><td>{invoice.invoiceNumber}</td><td>{invoice.orderNumber}</td><td>{invoice.customerName}</td><td>{money(invoice.total)}</td><td>{dateText(invoice.issuedAt)}</td><td><button className="btn btn-outline" onClick={() => openInvoice(invoice.invoiceId)}>Ver detalle</button></td></tr>)}</tbody></table></div>}</section>
    </div>
  );
}
