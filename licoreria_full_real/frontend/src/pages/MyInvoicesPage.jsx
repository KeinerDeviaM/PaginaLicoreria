import React, { useEffect, useState } from 'react';
import { api } from '../api';

const money = (value) => `$${Number(value || 0).toLocaleString('es-CO')}`;
const dateText = (value) => value ? new Date(value).toLocaleString('es-CO') : 'No disponible';

export default function MyInvoicesPage() {
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/invoices/my').then(({ data }) => {
      setRows(data);
      if (data.length) setSelected(data[0]);
    }).catch((err) => setError(err.response?.data?.message || 'No se pudieron cargar tus facturas.'));
  }, []);

  function exportPdf() {
    window.print();
  }

  return (
    <div className="container page printable-invoice-wrapper">
      <div className="stack" style={{ justifyContent: 'space-between', alignItems: 'end', gap: 16, flexWrap: 'wrap' }}><div><h1>Mis facturas</h1><p className="small">Consulta las facturas asociadas a tus pedidos.</p></div>{selected && <button className="btn btn-primary" onClick={exportPdf}>Exportar PDF</button>}</div>
      {error && <div className="notice error">{error}</div>}
      <div className="grid-2" style={{ marginTop: 16 }}>
        <section className="card">
          <h3>Listado de facturas</h3>
          {!rows.length ? <div className="notice">No tienes facturas registradas.</div> : (
            <div className="table-wrap"><table><thead><tr><th>Número</th><th>Pedido</th><th>Total</th><th>Fecha</th><th></th></tr></thead><tbody>{rows.map((invoice) => <tr key={invoice.invoiceId}><td>{invoice.invoiceNumber}</td><td>{invoice.orderNumber}</td><td>{money(invoice.total)}</td><td>{dateText(invoice.issuedAt || invoice.createdAt)}</td><td><button className="btn btn-outline" onClick={() => setSelected(invoice)}>Ver detalle</button></td></tr>)}</tbody></table></div>
          )}
        </section>
        <section className="card printable-invoice">
          <h3>Detalle de factura</h3>
          {!selected ? <div className="notice">Selecciona una factura para ver su detalle.</div> : (
            <>
              <p><strong>Número:</strong> {selected.invoiceNumber}</p>
              <p><strong>Pedido:</strong> {selected.orderNumber}</p>
              <p><strong>Fecha:</strong> {dateText(selected.issuedAt || selected.createdAt)}</p>
              <p><strong>Total:</strong> {money(selected.total)}</p>
              <p><strong>Observación:</strong> {selected.notes || 'Sin observación'}</p>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
