import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function MyInvoicesPage() {
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      const { data } = await api.get('/invoices/my');

      const invoices = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
        ? data
        : [];

      setRows(invoices);

      if (invoices.length > 0) {
        setSelected(invoices[0]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudieron cargar tus facturas.');
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="container page">
      <div className="stack" style={{ justifyContent: 'space-between', alignItems: 'end', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1>Mis facturas</h1>
          <p className="small">Consulta las facturas asociadas a tus pedidos.</p>
        </div>
      </div>

      {error && <div className="notice error">{error}</div>}

      <div className="grid-2" style={{ marginTop: 16 }}>
        <section className="card">
          <h3>Listado de facturas</h3>

          {rows.length === 0 ? (
            <div className="notice">No tienes facturas registradas.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
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
                      <td>${Number(invoice.total || 0).toLocaleString('es-CO')}</td>
                      <td>
                        {invoice.issuedAt
                          ? new Date(invoice.issuedAt).toLocaleString('es-CO')
                          : invoice.createdAt
                          ? new Date(invoice.createdAt).toLocaleString('es-CO')
                          : 'No disponible'}
                      </td>
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

        <section className="card">
          <h3>Detalle de factura</h3>

          {!selected ? (
            <div className="notice">Selecciona una factura para ver su detalle.</div>
          ) : (
            <>
              <p><strong>Número:</strong> {selected.invoiceNumber || selected.number}</p>
              <p><strong>Pedido:</strong> {selected.orderNumber || selected.orderId}</p>
              <p>
                <strong>Fecha:</strong>{' '}
                {selected.issuedAt
                  ? new Date(selected.issuedAt).toLocaleString('es-CO')
                  : selected.createdAt
                  ? new Date(selected.createdAt).toLocaleString('es-CO')
                  : 'No disponible'}
              </p>
              <p><strong>Total:</strong> ${Number(selected.total || 0).toLocaleString('es-CO')}</p>
              <p><strong>Observación:</strong> {selected.notes || 'Sin observación'}</p>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
