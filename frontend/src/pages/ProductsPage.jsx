import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { getAuth } from '../auth';

const initialForm = { categoryId:'', brandId:'', supplierId:'', code:'', name:'', description:'', imageUrl:'', volumeMl:750, alcohol:40, purchasePrice:0, salePrice:0, stock:0, minimumStock:0 };

export default function ProductsPage() {
  const { user } = getAuth();
  const canEdit = user?.role === 'ADMIN';
  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [msg, setMsg] = useState(null);
  const [search, setSearch] = useState('');

  async function load() {
    const [p, c, b, s] = await Promise.all([
      api.get('/products'),
      api.get('/categories'),
      api.get('/brands'),
      api.get('/suppliers')
    ]);
    setRows(p.data);
    setCategories(c.data.filter(x=>x.active));
    setBrands(b.data.filter(x=>x.active));
    setSuppliers(s.data.filter(x=>x.active));
  }

  useEffect(() => { load(); }, []);

  async function submit(e) {
    e.preventDefault();
    try {
      if (editingId) await api.put(`/products/${editingId}`, form);
      else await api.post('/products', form);
      setMsg({ type: 'success', text: 'Producto guardado correctamente' });
      setEditingId(null);
      setForm(initialForm);
      load();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'No se pudo guardar' });
    }
  }

  function edit(row) {
    setEditingId(row.id);
    setForm({ ...row });
  }

  async function toggle(id) {
    if (!confirm('¿Cambiar estado del producto?')) return;
    await api.patch(`/products/${id}/toggle`);
    load();
  }

  const filtered = rows.filter(r => r.name.toLowerCase().includes(search.toLowerCase()) || r.code.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="page">
      <h1>Productos</h1>
      {msg && <div className={`notice ${msg.type}`}>{msg.text}</div>}
      <div className={canEdit ? 'split' : ''}>
        {canEdit && (
          <section className="card">
            <h3>{editingId ? 'Editar producto' : 'Nuevo producto'}</h3>
            <form onSubmit={submit}>
              <div className="form-group"><label>Categoría</label><select value={form.categoryId} onChange={e=>setForm({...form, categoryId:e.target.value})}>{<option value="">Selecciona</option>}{categories.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></div>
              <div className="form-group"><label>Marca</label><select value={form.brandId} onChange={e=>setForm({...form, brandId:e.target.value})}>{<option value="">Selecciona</option>}{brands.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></div>
              <div className="form-group"><label>Proveedor</label><select value={form.supplierId} onChange={e=>setForm({...form, supplierId:e.target.value})}>{<option value="">Selecciona</option>}{suppliers.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></div>
              <div className="form-group"><label>Código</label><input value={form.code} onChange={e=>setForm({...form, code:e.target.value})} /></div>
              <div className="form-group"><label>Nombre</label><input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} /></div>
              <div className="form-group"><label>Descripción</label><textarea value={form.description} onChange={e=>setForm({...form, description:e.target.value})} /></div>
              <div className="grid grid-2">
                <div className="form-group"><label>Volumen ml</label><input type="number" value={form.volumeMl} onChange={e=>setForm({...form, volumeMl:e.target.value})} /></div>
                <div className="form-group"><label>Alcohol</label><input type="number" value={form.alcohol} onChange={e=>setForm({...form, alcohol:e.target.value})} /></div>
                <div className="form-group"><label>Precio compra</label><input type="number" value={form.purchasePrice} onChange={e=>setForm({...form, purchasePrice:e.target.value})} /></div>
                <div className="form-group"><label>Precio venta</label><input type="number" value={form.salePrice} onChange={e=>setForm({...form, salePrice:e.target.value})} /></div>
                <div className="form-group"><label>Stock</label><input type="number" value={form.stock} onChange={e=>setForm({...form, stock:e.target.value})} /></div>
                <div className="form-group"><label>Stock mínimo</label><input type="number" value={form.minimumStock} onChange={e=>setForm({...form, minimumStock:e.target.value})} /></div>
              </div>
              <div className="stack">
                <button className="btn btn-primary">{editingId ? 'Actualizar' : 'Crear'}</button>
                {editingId && <button type="button" className="btn btn-outline" onClick={()=>{setEditingId(null); setForm(initialForm);}}>Cancelar</button>}
              </div>
            </form>
          </section>
        )}
        <section className="card">
          <div className="stack" style={{justifyContent:'space-between', alignItems:'center'}}>
            <h3>Listado</h3>
            <input placeholder="Buscar..." value={search} onChange={e=>setSearch(e.target.value)} style={{maxWidth:280}} />
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Código</th><th>Nombre</th><th>Categoría</th><th>Marca</th><th>Precio</th><th>Stock</th><th>Estado</th>{canEdit && <th></th>}</tr></thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id}>
                    <td>{r.code}</td>
                    <td>{r.name}</td>
                    <td>{r.categoryName}</td>
                    <td>{r.brandName}</td>
                    <td>${r.salePrice.toLocaleString('es-CO')}</td>
                    <td>{r.stock}</td>
                    <td><span className={`badge ${r.active ? 'success' : 'danger'}`}>{r.active ? 'Activo' : 'Inactivo'}</span></td>
                    {canEdit && <td className="stack"><button className="btn btn-outline" onClick={()=>edit(r)}>Editar</button><button className="btn btn-wine" onClick={()=>toggle(r.id)}>{r.active ? 'Desactivar' : 'Activar'}</button></td>}
                  </tr>
                ))}
                {!filtered.length && <tr><td colSpan="8">Sin productos</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
