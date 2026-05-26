import React, { useEffect, useState } from 'react';
import { api } from '../api';

const money = (value) => `$${Number(value || 0).toLocaleString('es-CO')}`;
const dateText = (invoice) => {
  if (invoice.issuedAt) return new Date(invoice.issuedAt).toLocaleString('es-CO');
  if (invoice.createdAt) return new Date(invoice.createdAt).toLocaleString('es-CO');
  return 'No disponible';
};

export default function MyInvoicesPage() {
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      const { data } = await api.get('/invoices/my');
      const invoices = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];

      setRows(invoices);
      if (invoices.length > 0) setSelected(invoices[0]);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudieron cargar tus facturas.');
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="page">
      <section className="card reveal-on-scroll hero" style={{ marginBottom: 18 }}>
        <div>
          <div className="small" style={{ color: '#d4af37', marginBottom: 8 }}>Área del cliente</div>
          <h1>Mis facturas</h1>
          <p className="small">Consulta las facturas asociadas a tus pedidos.</p>
        </div>
      </section>

      {error && <div className="notice error">{error}</div>}

      <div className="grid-2">
        <section className="card reveal-on-scroll">
          <div className="table-header">
            <div>
              <h3>Listado de facturas</h3>
              <p className="small">{rows.length} facturas registradas.</p>
            </div>
          </div>

          {rows.length === 0 ? (
            <div className="notice">No tienes facturas registradas.</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Número</th>
                    <th>Pedido</th>
                    <th>Total</th>
                    <th>Fecha</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((invoice) => (
                    <tr key={invoice.invoiceId || invoice.id}>
                      <td>{invoice.invoiceNumber || invoice.number}</td>
                      <td>{invoice.orderNumber || invoice.orderId}</td>
                      <td>{money(invoice.total)}</td>
                      <td>{dateText(invoice)}</td>
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

        <section className="card reveal-on-scroll">
          <h3>Detalle de factura</h3>

          {!selected ? (
            <div className="notice">Selecciona una factura para ver su detalle.</div>
          ) : (
            <div className="panel-grid">
              <div className="info-tile"><div className="small">Número</div><strong>{selected.invoiceNumber || selected.number}</strong></div>
              <div className="info-tile"><div className="small">Pedido</div><strong>{selected.orderNumber || selected.orderId}</strong></div>
              <div className="info-tile"><div className="small">Fecha</div><strong>{dateText(selected)}</strong></div>
              <div className="info-tile"><div className="small">Total</div><strong>{money(selected.total)}</strong></div>
              <div className="info-tile"><div className="small">Observación</div><strong>{selected.notes || 'Sin observación'}</strong></div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
