import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function MyInvoicesPage() {
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => { api.get('/invoices/my').then(({ data }) => setRows(data)); }, []);

  return (
    <div className="container page">
      <h1>Mis facturas</h1>
      <div className="split">
        <section className="card">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Factura</th><th>Pedido</th><th>Total</th><th>Estado</th><th></th></tr></thead>
              <tbody>
                {rows.map(inv => (
                  <tr key={inv.invoiceId}>
                    <td>{inv.invoiceNumber}</td>
                    <td>{inv.orderNumber}</td>
                    <td>${inv.total.toLocaleString('es-CO')}</td>
                    <td><span className={`badge ${inv.status === 'GENERADA' ? 'success' : 'danger'}`}>{inv.status}</span></td>
                    <td><button className="btn btn-outline" onClick={()=>setSelected(inv)}>Ver</button></td>
                  </tr>
                ))}
                {!rows.length && <tr><td colSpan="5">No tienes facturas disponibles.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
        {selected && (
          <section className="card">
            <h3>Detalle de factura</h3>
            <p><strong>Número:</strong> {selected.invoiceNumber}</p>
            <p><strong>Pedido:</strong> {selected.orderNumber}</p>
            <p><strong>Fecha:</strong> {new Date(selected.issuedAt).toLocaleString()}</p>
            <p><strong>Total:</strong> ${selected.total.toLocaleString('es-CO')}</p>
            <p><strong>Observación:</strong> {selected.notes || '—'}</p>
          </section>
        )}
      </div>
    </div>
  );
}
