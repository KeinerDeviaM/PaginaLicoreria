import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import ConfirmModal from '../ConfirmModal';
import { useToast } from '../toast';

const money = (value) => `$${Number(value || 0).toLocaleString('es-CO')}`;

export default function CartPage() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmState, setConfirmState] = useState({
    open: false,
    mode: '',
    itemId: null,
    itemName: ''
  });

  const { showToast } = useToast();

  async function load() {
    try {
      setLoading(true);
      const { data } = await api.get('/cart');
      setCart(data.data || data);
    } catch (err) {
      showToast({ type: 'error', title: 'Error', text: err.response?.data?.message || 'No se pudo cargar el carrito.' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function updateQty(itemId, quantity, stockAvailable, name) {
    const qty = Number(quantity);

    if (!Number.isFinite(qty) || qty <= 0) {
      showToast({ type: 'warning', title: 'Cantidad inválida', text: 'La cantidad debe ser mayor a 0.' });
      return;
    }

    if (qty > Number(stockAvailable || 0)) {
      showToast({
        type: 'warning',
        title: 'Stock insuficiente',
        text: `No puedes agregar más unidades de ${name} porque solo hay ${stockAvailable} disponibles.`
      });
      return;
    }

    try {
      const { data } = await api.put(`/cart/items/${itemId}`, { quantity: qty });
      setCart(data.data || data);
      showToast({ type: 'success', title: 'Carrito actualizado', text: 'La cantidad se actualizó correctamente.' });
    } catch (err) {
      showToast({ type: 'error', title: 'No se pudo actualizar', text: err.response?.data?.message || 'No se pudo actualizar la cantidad.' });
    }
  }

  function askRemove(item) {
    setConfirmState({
      open: true,
      mode: 'remove',
      itemId: item.itemId,
      itemName: item.name
    });
  }

  function askClear() {
    setConfirmState({
      open: true,
      mode: 'clear',
      itemId: null,
      itemName: ''
    });
  }

  async function confirmAction() {
    const current = confirmState;
    setConfirmState({ open: false, mode: '', itemId: null, itemName: '' });

    try {
      if (current.mode === 'remove') {
        const { data } = await api.delete(`/cart/items/${current.itemId}`);
        setCart(data.data || data);
        showToast({ type: 'success', title: 'Producto eliminado', text: `${current.itemName} fue retirado del carrito.` });
      }

      if (current.mode === 'clear') {
        const { data } = await api.delete('/cart/items');
        setCart(data.data || data);
        showToast({ type: 'success', title: 'Carrito vacío', text: 'Todos los productos fueron eliminados del carrito.' });
      }
    } catch (err) {
      showToast({ type: 'error', title: 'No se pudo completar', text: err.response?.data?.message || 'Ocurrió un error.' });
    }
  }

  if (loading) return <div className="container page"><div className="notice">Cargando carrito...</div></div>;

  if (!cart?.items?.length) {
    return (
      <div className="container page">
        <div className="card">
          <h3>Tu carrito está vacío</h3>
          <Link to="/shop/products" className="btn btn-primary">Ir al catálogo</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container page">
      <ConfirmModal
        open={confirmState.open}
        title={confirmState.mode === 'clear' ? 'Vaciar carrito' : 'Eliminar producto'}
        message={
          confirmState.mode === 'clear'
            ? '¿Deseas eliminar todos los productos del carrito?'
            : `¿Deseas quitar "${confirmState.itemName}" del carrito?`
        }
        confirmText={confirmState.mode === 'clear' ? 'Vaciar carrito' : 'Quitar producto'}
        cancelText="Cancelar"
        danger={true}
        onConfirm={confirmAction}
        onCancel={() => setConfirmState({ open: false, mode: '', itemId: null, itemName: '' })}
      />

      <div className="stack" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Carrito</h1>
        <button className="btn btn-outline" onClick={askClear}>Vaciar</button>
      </div>

      <div className="split">
        <section className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Producto</th><th>Cantidad</th><th>Precio</th><th>Subtotal</th><th></th></tr>
              </thead>
              <tbody>
                {cart.items.map((item) => (
                  <tr key={item.itemId}>
                    <td>
                      <div>{item.code} · {item.name}</div>
                      <div className="small" style={{ marginTop: 6 }}>
                        Stock disponible: {item.stockAvailable}
                      </div>
                    </td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        max={item.stockAvailable}
                        value={item.quantity}
                        onChange={(e) => updateQty(item.itemId, e.target.value, item.stockAvailable, item.name)}
                        style={{ maxWidth: 90 }}
                      />
                    </td>
                    <td>{money(item.priceUnit)}</td>
                    <td>{money(item.subtotal)}</td>
                    <td><button className="btn btn-wine" onClick={() => askRemove(item)}>Quitar</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card">
          <h3>Resumen</h3>
          <p><strong>Subtotal:</strong> {money(cart.subtotal)}</p>
          <p><strong>Descuento:</strong> -{money(cart.discountTotal)}</p>
          <p><strong>Total:</strong> {money(cart.total)}</p>

          {cart.promotions?.length > 0 && (
            <>
              <h4>Promociones aplicadas</h4>
              {cart.promotions.map((p) => <div key={p.code} className="small">• {p.description} ({money(p.value)})</div>)}
            </>
          )}

          <div className="stack" style={{ marginTop: 16 }}>
            <Link to="/checkout" className="btn btn-primary">Continuar compra</Link>
            <Link to="/shop/products" className="btn btn-outline">Seguir comprando</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
