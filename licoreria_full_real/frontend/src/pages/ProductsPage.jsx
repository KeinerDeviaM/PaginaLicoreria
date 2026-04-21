import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { getAuth } from '../auth';
import ConfirmModal from '../ConfirmModal';
import { useToast } from '../toast';

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
  const { showToast } = useToast();

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

  const [brandSearch, setBrandSearch] = useState('');
  const [showBrandResults, setShowBrandResults] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [showCategoryResults, setShowCategoryResults] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [showSupplierResults, setShowSupplierResults] = useState(false);

  const [confirmState, setConfirmState] = useState({
    open: false,
    productId: null,
    nextLabel: ''
  });

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
      const text = err.response?.data?.message || 'No se pudo cargar la información de productos.';
      setMsg({ type: 'error', text });
      showToast({ type: 'error', title: 'Error', text });
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

  const filteredBrands = useMemo(() => {
    const term = brandSearch.trim().toLowerCase();
    return brands.filter((b) => b.active !== false).filter((b) => !term || String(b.name || '').toLowerCase().includes(term)).slice(0, 8);
  }, [brands, brandSearch]);

  const filteredCategories = useMemo(() => {
    const term = categorySearch.trim().toLowerCase();
    return categories.filter((c) => c.active !== false).filter((c) => !term || String(c.name || '').toLowerCase().includes(term)).slice(0, 8);
  }, [categories, categorySearch]);

  const filteredSuppliers = useMemo(() => {
    const term = supplierSearch.trim().toLowerCase();
    return suppliers.filter((s) => s.active !== false).filter((s) => !term || String(s.name || '').toLowerCase().includes(term)).slice(0, 8);
  }, [suppliers, supplierSearch]);

  const selectedBrand = useMemo(() => brands.find((b) => String(b.id) === String(form.brandId)), [brands, form.brandId]);
  const selectedCategory = useMemo(() => categories.find((c) => String(c.id) === String(form.categoryId)), [categories, form.categoryId]);
  const selectedSupplier = useMemo(() => suppliers.find((s) => String(s.id) === String(form.supplierId)), [suppliers, form.supplierId]);

  function resetForm() {
    setEditingId(null);
    setForm(initialForm);
    setBrandSearch('');
    setCategorySearch('');
    setSupplierSearch('');
    setShowBrandResults(false);
    setShowCategoryResults(false);
    setShowSupplierResults(false);
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

  function selectBrand(brand) {
    setForm((prev) => ({ ...prev, brandId: brand.id }));
    setBrandSearch(brand.name);
    setShowBrandResults(false);
  }

  function selectCategory(category) {
    setForm((prev) => ({ ...prev, categoryId: category.id }));
    setCategorySearch(category.name);
    setShowCategoryResults(false);
  }

  function selectSupplier(supplier) {
    setForm((prev) => ({ ...prev, supplierId: supplier.id }));
    setSupplierSearch(supplier.name);
    setShowSupplierResults(false);
  }

  function clearBrand() {
    setForm((prev) => ({ ...prev, brandId: '' }));
    setBrandSearch('');
    setShowBrandResults(false);
  }

  function clearCategory() {
    setForm((prev) => ({ ...prev, categoryId: '' }));
    setCategorySearch('');
    setShowCategoryResults(false);
  }

  function clearSupplier() {
    setForm((prev) => ({ ...prev, supplierId: '' }));
    setSupplierSearch('');
    setShowSupplierResults(false);
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
    setCategorySearch(row.categoryName || '');
    setBrandSearch(row.brandName || '');
    setSupplierSearch(row.supplierName || '');
    setShowBrandResults(false);
    setShowCategoryResults(false);
    setShowSupplierResults(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function submit(e) {
    e.preventDefault();
    setMsg(null);

    if (!form.categoryId || !form.brandId || !form.supplierId) {
      const text = 'Categoría, marca y proveedor son obligatorios.';
      setMsg({ type: 'error', text });
      showToast({ type: 'warning', title: 'Formulario incompleto', text });
      return;
    }

    if (!String(form.code).trim() || !String(form.name).trim()) {
      const text = 'Código y nombre son obligatorios.';
      setMsg({ type: 'error', text });
      showToast({ type: 'warning', title: 'Datos obligatorios', text });
      return;
    }

    if (Number(form.purchasePrice) < 0 || Number(form.salePrice) < 0) {
      const text = 'Los precios no pueden ser negativos.';
      setMsg({ type: 'error', text });
      showToast({ type: 'warning', title: 'Precio inválido', text });
      return;
    }

    if (Number(form.stock) < 0 || Number(form.minimumStock) < 0) {
      const text = 'El stock no puede ser negativo.';
      setMsg({ type: 'error', text });
      showToast({ type: 'warning', title: 'Stock inválido', text });
      return;
    }

    if (Number(form.volumeMl) <= 0) {
      const text = 'El volumen debe ser mayor a 0.';
      setMsg({ type: 'error', text });
      showToast({ type: 'warning', title: 'Volumen inválido', text });
      return;
    }

    if (Number(form.alcohol) < 0 || Number(form.alcohol) > 100) {
      const text = 'El porcentaje de alcohol debe estar entre 0 y 100.';
      setMsg({ type: 'error', text });
      showToast({ type: 'warning', title: 'Dato inválido', text });
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

      const text = editingId ? 'Producto actualizado correctamente.' : 'Producto creado correctamente.';
      setMsg({ type: 'success', text });
      showToast({ type: 'success', title: 'Operación exitosa', text });
      resetForm();
      load();
    } catch (err) {
      const text = err.response?.data?.message || 'No se pudo guardar el producto.';
      setMsg({ type: 'error', text });
      showToast({ type: 'error', title: 'No se pudo guardar', text });
    }
  }

  function requestToggle(row) {
    setConfirmState({
      open: true,
      productId: row.id,
      nextLabel: row.active ? 'desactivar' : 'activar'
    });
  }

  async function confirmToggle() {
    const id = confirmState.productId;
    const label = confirmState.nextLabel;
    setConfirmState({ open: false, productId: null, nextLabel: '' });

    try {
      await api.patch(`/products/${id}/toggle`);
      showToast({
        type: 'success',
        title: 'Estado actualizado',
        text: `El producto fue ${label === 'desactivar' ? 'desactivado' : 'activado'} correctamente.`
      });
      load();
    } catch (err) {
      showToast({
        type: 'error',
        title: 'No se pudo actualizar',
        text: err.response?.data?.message || 'No se pudo actualizar el estado.'
      });
    }
  }

  return (
    <div className="page">
      <ConfirmModal
        open={confirmState.open}
        title="Cambiar estado del producto"
        message={`¿Deseas ${confirmState.nextLabel} este producto?`}
        confirmText={confirmState.nextLabel === 'desactivar' ? 'Desactivar' : 'Activar'}
        cancelText="Cancelar"
        danger={confirmState.nextLabel === 'desactivar'}
        onConfirm={confirmToggle}
        onCancel={() => setConfirmState({ open: false, productId: null, nextLabel: '' })}
      />

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
              <div className="form-group" style={{ position: 'relative' }}>
                <label>Categoría</label>
                <div style={{ position: 'relative' }}>
                  <input value={categorySearch} onChange={(e) => { setCategorySearch(e.target.value); setShowCategoryResults(true); if (!e.target.value.trim()) setForm((prev) => ({ ...prev, categoryId: '' })); }} onFocus={() => setShowCategoryResults(true)} placeholder="Buscar categoría..." style={{ paddingLeft: 40, paddingRight: 90 }} />
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.7, pointerEvents: 'none' }}>🔎</span>
                  {selectedCategory && <button type="button" className="btn btn-outline" onClick={clearCategory} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', padding: '6px 10px' }}>Limpiar</button>}
                </div>
                {showCategoryResults && (
                  <div style={{ position: 'absolute', left: 0, right: 0, top: '100%', zIndex: 30, marginTop: 6, background: '#161616', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 12px 30px rgba(0,0,0,0.35)' }}>
                    {filteredCategories.length ? filteredCategories.map((category) => (
                      <button key={category.id} type="button" onClick={() => selectCategory(category)} style={{ width: '100%', textAlign: 'left', padding: '12px 14px', background: String(form.categoryId) === String(category.id) ? 'rgba(212,175,55,0.14)' : 'transparent', color: '#fff', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' }}>{category.name}</button>
                    )) : <div style={{ padding: '12px 14px', color: 'rgba(255,255,255,0.7)' }}>No se encontraron categorías.</div>}
                  </div>
                )}
                {selectedCategory && <div className="small" style={{ marginTop: 8 }}>Categoría seleccionada: <strong>{selectedCategory.name}</strong></div>}
              </div>

              <div className="form-group" style={{ position: 'relative' }}>
                <label>Marca</label>
                <div style={{ position: 'relative' }}>
                  <input value={brandSearch} onChange={(e) => { setBrandSearch(e.target.value); setShowBrandResults(true); if (!e.target.value.trim()) setForm((prev) => ({ ...prev, brandId: '' })); }} onFocus={() => setShowBrandResults(true)} placeholder="Buscar marca..." style={{ paddingLeft: 40, paddingRight: 90 }} />
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.7, pointerEvents: 'none' }}>🔎</span>
                  {selectedBrand && <button type="button" className="btn btn-outline" onClick={clearBrand} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', padding: '6px 10px' }}>Limpiar</button>}
                </div>
                {showBrandResults && (
                  <div style={{ position: 'absolute', left: 0, right: 0, top: '100%', zIndex: 30, marginTop: 6, background: '#161616', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 12px 30px rgba(0,0,0,0.35)' }}>
                    {filteredBrands.length ? filteredBrands.map((brand) => (
                      <button key={brand.id} type="button" onClick={() => selectBrand(brand)} style={{ width: '100%', textAlign: 'left', padding: '12px 14px', background: String(form.brandId) === String(brand.id) ? 'rgba(212,175,55,0.14)' : 'transparent', color: '#fff', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' }}>{brand.name}</button>
                    )) : <div style={{ padding: '12px 14px', color: 'rgba(255,255,255,0.7)' }}>No se encontraron marcas.</div>}
                  </div>
                )}
                {selectedBrand && <div className="small" style={{ marginTop: 8 }}>Marca seleccionada: <strong>{selectedBrand.name}</strong></div>}
              </div>

              <div className="form-group" style={{ position: 'relative' }}>
                <label>Proveedor</label>
                <div style={{ position: 'relative' }}>
                  <input value={supplierSearch} onChange={(e) => { setSupplierSearch(e.target.value); setShowSupplierResults(true); if (!e.target.value.trim()) setForm((prev) => ({ ...prev, supplierId: '' })); }} onFocus={() => setShowSupplierResults(true)} placeholder="Buscar proveedor..." style={{ paddingLeft: 40, paddingRight: 90 }} />
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.7, pointerEvents: 'none' }}>🔎</span>
                  {selectedSupplier && <button type="button" className="btn btn-outline" onClick={clearSupplier} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', padding: '6px 10px' }}>Limpiar</button>}
                </div>
                {showSupplierResults && (
                  <div style={{ position: 'absolute', left: 0, right: 0, top: '100%', zIndex: 30, marginTop: 6, background: '#161616', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 12px 30px rgba(0,0,0,0.35)' }}>
                    {filteredSuppliers.length ? filteredSuppliers.map((supplier) => (
                      <button key={supplier.id} type="button" onClick={() => selectSupplier(supplier)} style={{ width: '100%', textAlign: 'left', padding: '12px 14px', background: String(form.supplierId) === String(supplier.id) ? 'rgba(212,175,55,0.14)' : 'transparent', color: '#fff', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' }}>{supplier.name}</button>
                    )) : <div style={{ padding: '12px 14px', color: 'rgba(255,255,255,0.7)' }}>No se encontraron proveedores.</div>}
                  </div>
                )}
                {selectedSupplier && <div className="small" style={{ marginTop: 8 }}>Proveedor seleccionado: <strong>{selectedSupplier.name}</strong></div>}
              </div>

              <div className="form-group"><label>Código</label><input name="code" value={form.code} onChange={handleChange} /></div>
              <div className="form-group"><label>Nombre</label><input name="name" value={form.name} onChange={handleChange} /></div>
              <div className="form-group"><label>Descripción</label><textarea name="description" value={form.description} onChange={handleChange} /></div>
              <div className="form-group"><label>URL de imagen</label><input name="imageUrl" value={form.imageUrl} onChange={handleChange} /></div>

              {form.imageUrl && (
                <div className="card" style={{ marginBottom: 14 }}>
                  <div className="small" style={{ marginBottom: 8 }}>Vista previa</div>
                  <img src={form.imageUrl} alt="Vista previa" style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 12 }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
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
                            <button className="btn btn-wine" onClick={() => requestToggle(r)}>{r.active ? 'Desactivar' : 'Activar'}</button>
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
