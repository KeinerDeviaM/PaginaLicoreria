import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api';

const money = (value) => `$${Number(value || 0).toLocaleString('es-CO')}`;
const dateText = (value) => value ? new Date(value).toLocaleString('es-CO') : 'No disponible';

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

      const [invoicesRes, ordersRes] = await Promise.all([
        api.get('/invoices'),
        api.get('/orders')
      ]);

      const invoicesData = Array.isArray(invoicesRes.data?.data) ? invoicesRes.data.data : Array.isArray(invoicesRes.data) ? invoicesRes.data : [];
      const ordersData = Array.isArray(ordersRes.data?.data) ? ordersRes.data.data : Array.isArray(ordersRes.data) ? ordersRes.data : [];

      setInvoices(invoicesData);
      setOrders(ordersData);

      if (invoicesData.length > 0) setSelected(invoicesData[0]);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo cargar la información de facturas');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  const availableOrders = useMemo(() => {
    return orders.filter((o) => {
      const status = String(o.status || '').toUpperCase();
      return status !== 'FACTURADO' && status !== 'CANCELADO';
    });
  }, [orders]);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!selectedOrderId) {
      setError('Debes seleccionar un pedido');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const payload = { orderId: Number(selectedOrderId), notes };
      const { data } = await api.post('/invoices', payload);

      setSuccess(data?.message || 'Factura generada correctamente');
      setSelectedOrderId('');
      setNotes('');
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo generar la factura');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <section className="card reveal-on-scroll hero" style={{ marginBottom: 18 }}>
        <div>
          <div className="small" style={{ color: '#d4af37', marginBottom: 8 }}>Gestión documental</div>
          <h1>Facturas</h1>
          <p className="small">Consulta facturas generadas y registra nuevas facturas.</p>
        </div>
      </section>

      {error && <div className="notice error">{error}</div>}
      {success && <div className="notice success">{success}</div>}

      <div className="grid-2">
        <section className="card reveal-on-scroll">
          <h3>Generar factura</h3>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Pedido</label>
              <select value={selectedOrderId} onChange={(e) => setSelectedOrderId(e.target.value)}>
                <option value="">Selecciona un pedido</option>
                {availableOrders.map((o) => (
                  <option key={o.orderId || o.id} value={o.orderId || o.id}>
                    {(o.orderNumber || o.number || `Pedido ${o.orderId || o.id}`)} · {(o.customerName || 'Cliente')}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Observación</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Observación de la factura"
              />
            </div>

            <button className="btn btn-primary" disabled={saving}>
              {saving ? 'Generando...' : 'Generar factura'}
            </button>
          </form>
        </section>

        <section className="card reveal-on-scroll">
          <h3>Detalle de factura</h3>

          {!selected ? (
            <div className="notice">Selecciona una factura de la lista.</div>
          ) : (
            <div className="panel-grid">
              <div className="info-tile"><div className="small">Número</div><strong>{selected.invoiceNumber || selected.number}</strong></div>
              <div className="info-tile"><div className="small">Pedido</div><strong>{selected.orderNumber || selected.orderId}</strong></div>
              <div className="info-tile"><div className="small">Cliente</div><strong>{selected.customerName || 'No disponible'}</strong></div>
              <div className="info-tile"><div className="small">Fecha</div><strong>{dateText(selected.createdAt)}</strong></div>
              <div className="info-tile"><div className="small">Total</div><strong>{money(selected.total)}</strong></div>
              <div className="info-tile"><div className="small">Observación</div><strong>{selected.notes || 'Sin observación'}</strong></div>
            </div>
          )}
        </section>
      </div>

      <section className="card reveal-on-scroll" style={{ marginTop: 16 }}>
        <div className="table-header">
          <div>
            <h3>Listado de facturas</h3>
            <p className="small">{invoices.length} facturas registradas.</p>
          </div>
        </div>

        {loading ? (
          <div className="notice">Cargando facturas...</div>
        ) : invoices.length === 0 ? (
          <div className="notice">No hay facturas registradas.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Total</th>
                  <th>Fecha</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.invoiceId || invoice.id}>
                    <td>{invoice.invoiceNumber || invoice.number}</td>
                    <td>{invoice.orderNumber || invoice.orderId}</td>
                    <td>{invoice.customerName || 'No disponible'}</td>
                    <td>{money(invoice.total)}</td>
                    <td>{dateText(invoice.createdAt)}</td>
                    <td>
                      <button className="btn btn-outline" onClick={() => setSelected(invoice)}>
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
