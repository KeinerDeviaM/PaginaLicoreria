import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { getAuth } from '../auth';

const initialForm = {
  categoryId: '',
  brandId: '',
  supplierId: '',
  code: '',
  name: '',
  description: '',
  imageUrl: '',
  volumeMl: 750,
  alcohol: 40,
  purchasePrice: 0,
  salePrice: 0,
  stock: 0,
  minimumStock: 0
};

const money = (value) => `$${Number(value || 0).toLocaleString('es-CO')}`;

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
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');

  async function load() {
    try {
      setLoading(true);
      const [p, c, b, s] = await Promise.all([
        api.get('/products'),
        api.get('/categories'),
        api.get('/brands'),
        api.get('/suppliers')
      ]);

      setRows(Array.isArray(p.data) ? p.data : p.data?.data || []);
      setCategories(Array.isArray(c.data) ? c.data : c.data?.data || []);
      setBrands(Array.isArray(b.data) ? b.data : b.data?.data || []);
      setSuppliers(Array.isArray(s.data) ? s.data : s.data?.data || []);
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'No se pudo cargar la información de productos.' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => rows.filter((r) => {
    const term = search.trim().toLowerCase();
    const searchOk = !term || String(r.name || '').toLowerCase().includes(term) || String(r.code || '').toLowerCase().includes(term);
    const categoryOk = !categoryFilter || String(r.categoryId) === String(categoryFilter);
    const brandOk = !brandFilter || String(r.brandId) === String(brandFilter);
    const statusOk = statusFilter === 'TODOS' || (statusFilter === 'ACTIVOS' && r.active) || (statusFilter === 'INACTIVOS' && !r.active);
    return searchOk && categoryOk && brandOk && statusOk;
  }), [rows, search, categoryFilter, brandFilter, statusFilter]);

  function resetForm() {
    setEditingId(null);
    setForm(initialForm);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: ['volumeMl', 'alcohol', 'purchasePrice', 'salePrice', 'stock', 'minimumStock'].includes(name)
        ? (value === '' ? '' : Number(value))
        : value
    }));
  }

  function edit(row) {
    setEditingId(row.id);
    setForm({
      categoryId: row.categoryId || '',
      brandId: row.brandId || '',
      supplierId: row.supplierId || '',
      code: row.code || '',
      name: row.name || '',
      description: row.description || '',
      imageUrl: row.imageUrl || '',
      volumeMl: Number(row.volumeMl || 0),
      alcohol: Number(row.alcohol || 0),
      purchasePrice: Number(row.purchasePrice || 0),
      salePrice: Number(row.salePrice || 0),
      stock: Number(row.stock || 0),
      minimumStock: Number(row.minimumStock || 0)
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function submit(e) {
    e.preventDefault();
    setMsg(null);

    if (!form.categoryId || !form.brandId || !form.supplierId) {
      setMsg({ type: 'error', text: 'Categoría, marca y proveedor son obligatorios.' });
      return;
    }

    if (!String(form.code).trim() || !String(form.name).trim()) {
      setMsg({ type: 'error', text: 'Código y nombre son obligatorios.' });
      return;
    }

    if (Number(form.purchasePrice) < 0 || Number(form.salePrice) < 0) {
      setMsg({ type: 'error', text: 'Los precios no pueden ser negativos.' });
      return;
    }

    if (Number(form.stock) < 0 || Number(form.minimumStock) < 0) {
      setMsg({ type: 'error', text: 'El stock no puede ser negativo.' });
      return;
    }

    if (Number(form.volumeMl) <= 0) {
      setMsg({ type: 'error', text: 'El volumen debe ser mayor a 0.' });
      return;
    }

    if (Number(form.alcohol) < 0 || Number(form.alcohol) > 100) {
      setMsg({ type: 'error', text: 'El porcentaje de alcohol debe estar entre 0 y 100.' });
      return;
    }

    const payload = {
      ...form,
      code: String(form.code).trim(),
      name: String(form.name).trim(),
      description: String(form.description).trim(),
      imageUrl: String(form.imageUrl).trim()
    };

    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
      } else {
        await api.post('/products', payload);
      }

      setMsg({ type: 'success', text: editingId ? 'Producto actualizado correctamente.' : 'Producto creado correctamente.' });
      resetForm();
      load();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'No se pudo guardar el producto.' });
    }
  }

  async function toggle(id) {
    if (-not [System.Windows.MessageBox]::Show) { }
    if (-not (confirm('¿Cambiar estado del producto?'))) return;
    try {
      await api.patch(`/products/${id}/toggle`);
      setMsg({ type: 'success', text: 'Estado del producto actualizado.' });
      load();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'No se pudo actualizar el estado.' });
    }
  }

  return (
    <div className="page">
      <div className="stack" style={{ justifyContent: 'space-between', alignItems: 'end', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1>Productos</h1>
          <p className="small">Gestiona el catálogo, precios, stock e información visual de cada producto.</p>
        </div>
      </div>

      {msg && <div className={`notice ${msg.type}`}>{msg.text}</div>}

      <div className={canEdit ? 'split' : ''}>
        {canEdit && (
          <section className="card">
            <h3>{editingId ? 'Editar producto' : 'Nuevo producto'}</h3>

            <form onSubmit={submit}>
              <div className="form-group">
                <label>Categoría</label>
                <select name="categoryId" value={form.categoryId} onChange={handleChange}>
                  <option value="">Selecciona</option>
                  {categories.filter((x) => x.active !== false).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Marca</label>
                <select name="brandId" value={form.brandId} onChange={handleChange}>
                  <option value="">Selecciona</option>
                  {brands.filter((x) => x.active !== false).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Proveedor</label>
                <select name="supplierId" value={form.supplierId} onChange={handleChange}>
                  <option value="">Selecciona</option>
                  {suppliers.filter((x) => x.active !== false).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                </select>
              </div>

              <div className="form-group"><label>Código</label><input name="code" value={form.code} onChange={handleChange} /></div>
              <div className="form-group"><label>Nombre</label><input name="name" value={form.name} onChange={handleChange} /></div>
              <div className="form-group"><label>Descripción</label><textarea name="description" value={form.description} onChange={handleChange} /></div>
              <div className="form-group"><label>URL de imagen</label><input name="imageUrl" value={form.imageUrl} onChange={handleChange} /></div>

              {form.imageUrl && (
                <div className="card" style={{ marginBottom: 14 }}>
                  <div className="small" style={{ marginBottom: 8 }}>Vista previa</div>
                  <img
                    src={form.imageUrl}
                    alt="Vista previa"
                    style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 12 }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>
              )}

              <div className="grid grid-2">
                <div className="form-group"><label>Volumen ml</label><input type="number" name="volumeMl" value={form.volumeMl} onChange={handleChange} /></div>
                <div className="form-group"><label>Alcohol</label><input type="number" name="alcohol" value={form.alcohol} onChange={handleChange} /></div>
                <div className="form-group"><label>Precio compra</label><input type="number" name="purchasePrice" value={form.purchasePrice} onChange={handleChange} /></div>
                <div className="form-group"><label>Precio venta</label><input type="number" name="salePrice" value={form.salePrice} onChange={handleChange} /></div>
                <div className="form-group"><label>Stock</label><input type="number" name="stock" value={form.stock} onChange={handleChange} /></div>
                <div className="form-group"><label>Stock mínimo</label><input type="number" name="minimumStock" value={form.minimumStock} onChange={handleChange} /></div>
              </div>

              <div className="stack">
                <button className="btn btn-primary">{editingId ? 'Actualizar producto' : 'Crear producto'}</button>
                {editingId && <button type="button" className="btn btn-outline" onClick={resetForm}>Cancelar edición</button>}
              </div>
            </form>
          </section>
        )}

        <section className="card">
          <div className="stack" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <h3>Listado de productos</h3>

            <div className="stack" style={{ gap: 8, flexWrap: 'wrap' }}>
              <input placeholder="Buscar por nombre o código" value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 260 }} />
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <option value="">Todas las categorías</option>
                {categories.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
              </select>
              <select value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)}>
                <option value="">Todas las marcas</option>
                {brands.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
              </select>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="TODOS">Todos</option>
                <option value="ACTIVOS">Activos</option>
                <option value="INACTIVOS">Inactivos</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="notice">Cargando productos...</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Nombre</th>
                    <th>Categoría</th>
                    <th>Marca</th>
                    <th>Compra</th>
                    <th>Venta</th>
                    <th>Stock</th>
                    <th>Estado</th>
                    {canEdit && <th></th>}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id}>
                      <td>{r.code}</td>
                      <td>{r.name}</td>
                      <td>{r.categoryName}</td>
                      <td>{r.brandName}</td>
                      <td>{money(r.purchasePrice)}</td>
                      <td>{money(r.salePrice)}</td>
                      <td>
                        {r.stock}
                        {Number(r.stock || 0) <= Number(r.minimumStock || 0) && <span className="badge warning" style={{ marginLeft: 8 }}>Bajo</span>}
                      </td>
                      <td><span className={`badge ${r.active ? 'success' : 'danger'}`}>{r.active ? 'Activo' : 'Inactivo'}</span></td>
                      {canEdit && (
                        <td>
                          <div className="stack" style={{ gap: 8 }}>
                            <button className="btn btn-outline" onClick={() => edit(r)}>Editar</button>
                            <button className="btn btn-wine" onClick={() => toggle(r.id)}>{r.active ? 'Desactivar' : 'Activar'}</button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                  {!filtered.length && <tr><td colSpan={canEdit ? 9 : 8}>No se encontraron productos.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
