const express = require('express');
const cors = require('cors');
const { initDb, loadDb, saveDb, nextId, now } = require('./db');
const { hashPassword, verifyPassword, signToken, verifyToken } = require('./auth');

initDb();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://127.0.0.1:5174'],
  credentials: true
}));
app.use(express.json({ limit: '3mb' }));

function sanitizeUser(user) {
  const { passwordHash, ...rest } = user;
  return rest;
}

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ message: 'No autenticado' });
  const db = loadDb();
  const user = db.users.find((u) => u.id === payload.id && u.active);
  if (!user) return res.status(401).json({ message: 'Usuario inválido' });
  req.user = user;
  req.db = db;
  next();
}

function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'No autenticado' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'No autorizado' });
    next();
  };
}

function adminNotify(db, type, title, message, actor, referenceType, referenceId) {
  db.notifications.unshift({
    id: nextId(db, 'notifications'),
    type,
    title,
    message,
    actorName: actor ? `${actor.firstName} ${actor.lastName}` : '',
    actorEmail: actor?.email || '',
    actorRole: actor?.role || '',
    referenceType,
    referenceId,
    read: false,
    createdAt: now()
  });
}

function enrichProduct(db, product) {
  const category = db.categories.find((c) => c.id === product.categoryId);
  const brand = db.brands.find((b) => b.id === product.brandId);
  const supplier = db.suppliers.find((s) => s.id === product.supplierId);
  return {
    ...product,
    categoryName: category?.name || '',
    brandName: brand?.name || '',
    supplierName: supplier?.name || ''
  };
}

function validateProductPayload(db, body, currentProductId = null) {
  const categoryId = Number(body.categoryId);
  const brandId = Number(body.brandId);
  const supplierId = Number(body.supplierId || 1);
  const code = String(body.code || '').trim();
  const name = String(body.name || '').trim();
  const description = String(body.description || '').trim();
  const imageUrl = String(body.imageUrl || '').trim();
  const volumeMl = Number(body.volumeMl || 0);
  const alcohol = Number(body.alcohol || 0);
  const purchasePrice = Number(body.purchasePrice || 0);
  const salePrice = Number(body.salePrice || 0);
  const stock = Number(body.stock || 0);
  const minimumStock = Number(body.minimumStock || 0);

  if (!categoryId || !db.categories.some((c) => c.id === categoryId)) {
    return { ok: false, message: 'La categoría es obligatoria y debe existir' };
  }
  if (!brandId || !db.brands.some((b) => b.id === brandId)) {
    return { ok: false, message: 'La marca es obligatoria y debe existir' };
  }
  if (!supplierId || !db.suppliers.some((s) => s.id === supplierId)) {
    return { ok: false, message: 'El proveedor es obligatorio y debe existir' };
  }
  if (!code) return { ok: false, message: 'El código es obligatorio' };
  if (!name) return { ok: false, message: 'El nombre es obligatorio' };
  if (purchasePrice < 0 || salePrice < 0) {
    return { ok: false, message: 'Los precios no pueden ser negativos' };
  }
  if (stock < 0 || minimumStock < 0) {
    return { ok: false, message: 'El stock no puede ser negativo' };
  }
  if (volumeMl <= 0) {
    return { ok: false, message: 'El volumen debe ser mayor a 0' };
  }
  if (alcohol < 0 || alcohol > 100) {
    return { ok: false, message: 'El porcentaje de alcohol debe estar entre 0 y 100' };
  }

  const duplicateCode = db.products.some(
    (p) => p.id !== currentProductId && String(p.code).toLowerCase() === code.toLowerCase()
  );
  if (duplicateCode) {
    return { ok: false, message: 'Ya existe un producto con ese código' };
  }

  return {
    ok: true,
    data: {
      categoryId,
      brandId,
      supplierId,
      code,
      name,
      description,
      imageUrl,
      volumeMl,
      alcohol,
      purchasePrice,
      salePrice,
      stock,
      minimumStock
    }
  };
}

function getPromotionBreakdown(db, items) {
  const cartItems = items.map((item) => {
    const product = db.products.find((p) => p.id === item.productId);
    const brand = product ? db.brands.find((b) => b.id === product.brandId) : null;
    return { item, product, brand };
  }).filter((x) => x.product);

  const subtotal = cartItems.reduce((sum, { item, product }) => sum + product.salePrice * item.quantity, 0);
  const totalUnits = cartItems.reduce((sum, { item }) => sum + item.quantity, 0);
  const wineUnits = cartItems
    .filter(({ product }) => product.categoryId === 4)
    .reduce((sum, { item }) => sum + item.quantity, 0);

  const vodkaLine = cartItems.find(({ product }) => product.categoryId === 3);

  const macallanQty = cartItems
    .filter(({ brand }) => brand?.name === 'Macallan')
    .reduce((sum, { item }) => sum + item.quantity, 0);

  const promotions = [];
  let discountTotal = 0;

  if (totalUnits >= 12) {
    const value = Math.round(subtotal * 0.10);
    discountTotal += value;
    promotions.push({ code: 'BULK10', description: '10% por comprar 12 o más unidades', value });
  } else if (totalUnits >= 6) {
    const value = Math.round(subtotal * 0.05);
    discountTotal += value;
    promotions.push({ code: 'BULK5', description: '5% por comprar 6 o más unidades', value });
  }

  if (wineUnits >= 2 && vodkaLine) {
    const value = 10500;
    discountTotal += value;
    promotions.push({ code: 'WINE2VODKA', description: 'Comprando 2 vinos obtienes $10.500 de descuento en un vodka', value });
  }

  if (macallanQty >= 2) {
    const related = cartItems.filter(({ brand }) => brand?.name === 'Macallan');
    const relatedSubtotal = related.reduce((sum, { item, product }) => sum + item.quantity * product.salePrice, 0);
    const value = Math.round(relatedSubtotal * 0.07);
    discountTotal += value;
    promotions.push({ code: 'MACALLAN7', description: '7% de descuento especial en Macallan por 2 o más unidades', value });
  }

  const total = Math.max(subtotal - discountTotal, 0);
  return { subtotal, discountTotal, total, promotions, totalUnits };
}

function buildCartResponse(db, userId) {
  const cart = db.carts.find((c) => c.userId === userId) || { userId, items: [] };
  const items = cart.items.map((item) => {
    const product = db.products.find((p) => p.id === item.productId);
    return {
      itemId: item.id,
      productId: product?.id,
      code: product?.code || '',
      name: product?.name || '',
      imageUrl: product?.imageUrl || '',
      brandName: db.brands.find((b) => b.id === product?.brandId)?.name || '',
      categoryName: db.categories.find((c) => c.id === product?.categoryId)?.name || '',
      priceUnit: product?.salePrice || 0,
      quantity: item.quantity,
      subtotal: (product?.salePrice || 0) * item.quantity,
      stockAvailable: product?.stock || 0
    };
  }).filter((x) => x.productId);

  const calc = getPromotionBreakdown(db, cart.items);
  return {
    cartId: userId,
    userId,
    items,
    subtotal: calc.subtotal,
    discountTotal: calc.discountTotal,
    total: calc.total,
    promotions: calc.promotions,
    totalItems: calc.totalUnits
  };
}

function orderResponse(db, order) {
  const user = db.users.find((u) => u.id === order.userId);
  return {
    orderId: order.id,
    orderNumber: order.number,
    userId: order.userId,
    customerName: user ? `${user.firstName} ${user.lastName}` : '',
    customerEmail: user?.email || '',
    status: order.status,
    deliveryType: order.deliveryType,
    deliveryAddress: order.deliveryAddress || '',
    subtotal: order.subtotal,
    discountTotal: order.discountTotal || 0,
    total: order.total,
    notes: order.notes || '',
    promotions: order.promotions || [],
    createdAt: order.createdAt,
    details: order.details.map((d) => {
      const product = db.products.find((p) => p.id === d.productId);
      return {
        detailId: d.id,
        productId: d.productId,
        code: product?.code || '',
        name: product?.name || '',
        imageUrl: product?.imageUrl || '',
        quantity: d.quantity,
        price: d.unitPrice,
        unitPrice: d.unitPrice,
        subtotal: d.subtotal
      };
    })
  };
}

function paymentResponse(db, payment) {
  const order = db.orders.find((o) => o.id === payment.orderId);
  const approver = payment.approvedBy ? db.users.find((u) => u.id === payment.approvedBy) : null;
  return {
    paymentId: payment.id,
    orderId: payment.orderId,
    orderNumber: order?.number || '',
    method: payment.method,
    status: payment.status,
    reference: payment.reference,
    amount: payment.amount,
    createdAt: payment.createdAt,
    approvedAt: payment.approvedAt || null,
    approvedBy: approver ? `${approver.firstName} ${approver.lastName}` : ''
  };
}

function invoiceResponse(db, invoice) {
  const order = db.orders.find((o) => o.id === invoice.orderId);
  const user = db.users.find((u) => u.id === order?.userId);
  const payment = db.payments.find((p) => p.orderId === invoice.orderId);
  const approver = payment?.approvedBy ? db.users.find((u) => u.id === payment.approvedBy) : null;
  return {
    invoiceId: invoice.id,
    invoiceNumber: invoice.number,
    issuedAt: invoice.issuedAt,
    status: invoice.status,
    orderId: order?.id,
    orderNumber: order?.number || '',
    customerId: user?.id,
    customerName: user ? `${user.firstName} ${user.lastName}` : '',
    customerEmail: user?.email || '',
    deliveryType: order?.deliveryType || '',
    deliveryAddress: order?.deliveryAddress || '',
    paymentMethod: payment?.method || '',
    approvedBy: approver ? `${approver.firstName} ${approver.lastName}` : '',
    subtotal: invoice.subtotal,
    discountTotal: invoice.discountTotal || 0,
    total: invoice.total,
    notes: invoice.notes || '',
    items: (order?.details || []).map((d) => {
      const product = db.products.find((p) => p.id === d.productId);
      return {
        productId: d.productId,
        code: product?.code || '',
        name: product?.name || '',
        quantity: d.quantity,
        unitPrice: d.unitPrice,
        subtotal: d.subtotal
      };
    })
  };
}

function simpleCollectionRoutes(key, pathName, singular) {
  app.get(`/api/${pathName}`, auth, requireRoles('ADMIN', 'TRABAJADOR'), (req, res) => {
    const q = String(req.query.q || '').trim().toLowerCase();
    let rows = req.db[key] || [];
    if (q) {
      rows = rows.filter((row) => JSON.stringify(row).toLowerCase().includes(q));
    }
    res.json(rows.slice().sort((a, b) => b.id - a.id));
  });

  app.post(`/api/${pathName}`, auth, requireRoles('ADMIN'), (req, res) => {
    const db = req.db;
    const payload = { ...req.body, id: nextId(db, key), active: true };
    db[key].push(payload);
    saveDb(db);
    adminNotify(db, `${singular.toUpperCase()}_CREADO`, `${singular} creado`, `Se creó ${singular.toLowerCase()} ${payload.name || payload.id}.`, req.user, singular.toUpperCase(), payload.id);
    saveDb(db);
    res.status(201).json({ success: true, message: `${singular} creado correctamente`, data: payload });
  });

  app.put(`/api/${pathName}/:id`, auth, requireRoles('ADMIN'), (req, res) => {
    const db = req.db;
    const row = db[key].find((x) => x.id === Number(req.params.id));
    if (!row) return res.status(404).json({ message: `${singular} no encontrado` });
    Object.assign(row, req.body);
    saveDb(db);
    res.json({ success: true, message: `${singular} actualizado correctamente`, data: row });
  });

  app.patch(`/api/${pathName}/:id/toggle`, auth, requireRoles('ADMIN'), (req, res) => {
    const db = req.db;
    const row = db[key].find((x) => x.id === Number(req.params.id));
    if (!row) return res.status(404).json({ message: `${singular} no encontrado` });
    row.active = !row.active;
    saveDb(db);
    res.json({ success: true, message: 'Estado actualizado', data: row });
  });
}

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.post('/api/auth/register', (req, res) => {
  const db = loadDb();
  const { firstName, lastName, email, password, phone = '', address = '' } = req.body || {};

  const cleanFirstName = String(firstName || '').trim();
  const cleanLastName = String(lastName || '').trim();
  const cleanEmail = String(email || '').toLowerCase().trim();
  const cleanPhone = String(phone || '').trim();
  const cleanAddress = String(address || '').trim();
  const cleanPassword = String(password || '');

  if (!cleanFirstName || !cleanLastName || !cleanEmail || !cleanPassword) {
    return res.status(400).json({ message: 'Campos obligatorios incompletos' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    return res.status(400).json({ message: 'Correo electrónico inválido' });
  }

  if (cleanPassword.length < 8) {
    return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres' });
  }

  if (cleanPhone && !/^[0-9+\-\s]{7,20}$/.test(cleanPhone)) {
    return res.status(400).json({ message: 'Teléfono inválido' });
  }

  if (db.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
    return res.status(400).json({ message: 'El correo ya existe' });
  }

  const user = {
    id: nextId(db, 'users'),
    firstName: cleanFirstName,
    lastName: cleanLastName,
    email: cleanEmail,
    phone: cleanPhone,
    address: cleanAddress,
    passwordHash: hashPassword(cleanPassword),
    role: 'CLIENTE',
    active: true,
    createdAt: now()
  };

  db.users.push(user);
  saveDb(db);

  res.status(201).json({ success: true, message: 'Registro exitoso', data: sanitizeUser(user) });
});

app.post('/api/auth/login', (req, res) => {
  const db = loadDb();
  const { email, password } = req.body || {};

  const cleanEmail = String(email || '').toLowerCase().trim();
  const cleanPassword = String(password || '');

  if (!cleanEmail || !cleanPassword) {
    return res.status(400).json({ message: 'Correo y contraseña son obligatorios' });
  }

  const user = db.users.find((u) => u.email === cleanEmail);
  if (!user || !verifyPassword(cleanPassword, user.passwordHash)) {
    return res.status(401).json({ message: 'Credenciales inválidas' });
  }

  if (!user.active) {
    return res.status(403).json({ message: 'Usuario inactivo' });
  }

  const token = signToken({ id: user.id, role: user.role, email: user.email });
  res.json({ success: true, message: 'Login exitoso', data: { token, type: 'Bearer', user: sanitizeUser(user) } });
});

app.get('/api/auth/me', auth, (req, res) => {
  res.json({ success: true, data: sanitizeUser(req.user) });
});

app.put('/api/users/profile', auth, (req, res) => {
  const db = req.db;
  const user = db.users.find((u) => u.id === req.user.id);
  const { firstName = '', lastName = '', email = '', phone = '', address = '' } = req.body || {};
  if (!firstName.trim() || !lastName.trim() || !email.trim()) return res.status(400).json({ message: 'Nombre, apellido y correo son obligatorios' });
  if (db.users.some((u) => u.id !== user.id && u.email.toLowerCase() === email.toLowerCase().trim())) return res.status(400).json({ message: 'Ya existe otro usuario con ese correo' });
  Object.assign(user, { firstName: firstName.trim(), lastName: lastName.trim(), email: email.toLowerCase().trim(), phone: phone.trim(), address: address.trim() });
  saveDb(db);
  res.json({ success: true, message: 'Perfil actualizado correctamente', data: sanitizeUser(user) });
});

app.put('/api/users/profile/password', auth, (req, res) => {
  const db = req.db;
  const user = db.users.find((u) => u.id === req.user.id);
  const { currentPassword = '', newPassword = '' } = req.body || {};
  if (!currentPassword || !newPassword) return res.status(400).json({ message: 'La contraseña actual y la nueva contraseña son obligatorias' });
  if (!verifyPassword(currentPassword, user.passwordHash)) return res.status(400).json({ message: 'La contraseña actual no es correcta' });
  if (String(newPassword).trim().length < 6) return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 6 caracteres' });
  user.passwordHash = hashPassword(newPassword);
  saveDb(db);
  res.json({ success: true, message: 'Contraseña actualizada correctamente' });
});

app.get('/api/users', auth, requireRoles('ADMIN', 'TRABAJADOR'), (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  const role = String(req.query.role || '').trim().toUpperCase();
  let users = req.db.users.map(sanitizeUser);
  if (role) users = users.filter((u) => u.role === role);
  if (q) users = users.filter((u) => JSON.stringify(u).toLowerCase().includes(q));
  res.json({ success: true, data: users.sort((a, b) => b.id - a.id) });
});

app.get('/api/users/workers', auth, requireRoles('ADMIN', 'TRABAJADOR'), (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  let users = req.db.users.filter((u) => u.role === 'TRABAJADOR').map(sanitizeUser);
  if (q) users = users.filter((u) => JSON.stringify(u).toLowerCase().includes(q));
  res.json({ success: true, data: users.sort((a, b) => b.id - a.id) });
});

app.post('/api/users/workers', auth, requireRoles('ADMIN'), (req, res) => {
  const db = req.db;
  const { firstName = '', lastName = '', email = '', password = '', phone = '', address = '' } = req.body || {};
  if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) return res.status(400).json({ message: 'Nombre, apellido, correo y contraseña son obligatorios' });
  if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase().trim())) return res.status(400).json({ message: 'Ya existe un usuario con ese correo' });
  const user = { id: nextId(db, 'users'), firstName: firstName.trim(), lastName: lastName.trim(), email: email.toLowerCase().trim(), phone: phone.trim(), address: address.trim(), passwordHash: hashPassword(password), role: 'TRABAJADOR', active: true, createdAt: now() };
  db.users.push(user);
  adminNotify(db, 'TRABAJADOR_CREADO', 'Trabajador creado', `Se creó el trabajador ${user.firstName} ${user.lastName}.`, req.user, 'TRABAJADOR', user.id);
  saveDb(db);
  res.status(201).json({ success: true, message: 'Trabajador creado correctamente', data: sanitizeUser(user) });
});

app.put('/api/users/workers/:id', auth, requireRoles('ADMIN'), (req, res) => {
  const db = req.db;
  const user = db.users.find((u) => u.id === Number(req.params.id) && u.role === 'TRABAJADOR');
  if (!user) return res.status(404).json({ message: 'Trabajador no encontrado' });
  const { firstName = '', lastName = '', email = '', phone = '', address = '', active = true, password = '' } = req.body || {};
  if (!firstName.trim() || !lastName.trim() || !email.trim()) return res.status(400).json({ message: 'Nombre, apellido y correo son obligatorios' });
  if (db.users.some((u) => u.id !== user.id && u.email.toLowerCase() === email.toLowerCase().trim())) return res.status(400).json({ message: 'Ya existe otro usuario con ese correo' });
  Object.assign(user, { firstName: firstName.trim(), lastName: lastName.trim(), email: email.toLowerCase().trim(), phone: phone.trim(), address: address.trim(), active: Boolean(active) });
  if (String(password).trim()) user.passwordHash = hashPassword(password.trim());
  saveDb(db);
  res.json({ success: true, message: 'Trabajador actualizado correctamente', data: sanitizeUser(user) });
});

app.get('/api/shop/home', (_req, res) => {
  const db = loadDb();
  const featured = db.products.filter((p) => p.active && p.stock > 0).sort((a, b) => (b.unitsSold || 0) - (a.unitsSold || 0)).slice(0, 8).map((p) => enrichProduct(db, p));
  res.json({ featuredProducts: featured, promotions: ['10% por 12 unidades', '5% por 6 unidades', '2 vinos = descuento en vodka'] });
});

app.get('/api/shop/catalog', (_req, res) => {
  const db = loadDb();
  const q = String(_req.query.q || '').trim().toLowerCase();
  let products = db.products.filter((p) => p.active && p.stock > 0).map((p) => enrichProduct(db, p));
  if (q) products = products.filter((p) => JSON.stringify(p).toLowerCase().includes(q));
  res.json(products);
});

app.get('/api/shop/products/:id', (_req, res) => {
  const db = loadDb();
  const product = db.products.find((p) => p.id === Number(_req.params.id) && p.active);
  if (!product) return res.status(404).json({ message: 'Producto no encontrado' });
  res.json({ success: true, data: enrichProduct(db, product) });
});

simpleCollectionRoutes('categories', 'categories', 'Categoría');
simpleCollectionRoutes('brands', 'brands', 'Marca');
simpleCollectionRoutes('suppliers', 'suppliers', 'Proveedor');

app.get('/api/products', auth, requireRoles('ADMIN', 'TRABAJADOR'), (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  let rows = req.db.products.map((p) => enrichProduct(req.db, p));
  if (q) rows = rows.filter((row) => JSON.stringify(row).toLowerCase().includes(q));
  res.json(rows.sort((a, b) => b.id - a.id));
});

app.post('/api/products', auth, requireRoles('ADMIN'), (req, res) => {
  const db = req.db;
  const validation = validateProductPayload(db, req.body);
  if (!validation.ok) return res.status(400).json({ message: validation.message });

  const product = enrichProduct(db, {
    id: nextId(db, 'products'),
    ...validation.data,
    unitsSold: 0,
    active: true,
    createdAt: now()
  });

  db.products.push(product);

  if (product.stock > 0) {
    db.movements.push({
      id: nextId(db, 'movements'),
      productId: product.id,
      userId: req.user.id,
      type: 'ENTRADA',
      quantity: product.stock,
      reason: 'Inventario inicial del producto',
      notes: '',
      createdAt: now()
    });
  }

  adminNotify(
    db,
    'PRODUCTO_CREADO',
    'Nuevo producto agregado',
    `Se agregó el producto ${product.name} con stock inicial ${product.stock}.`,
    req.user,
    'PRODUCTO',
    product.id
  );

  saveDb(db);
  res.status(201).json({ success: true, message: 'Producto creado correctamente', data: product });
});

app.put('/api/products/:id', auth, requireRoles('ADMIN'), (req, res) => {
  const db = req.db;
  const product = db.products.find((p) => p.id === Number(req.params.id));
  if (!product) return res.status(404).json({ message: 'Producto no encontrado' });

  const validation = validateProductPayload(db, req.body, product.id);
  if (!validation.ok) return res.status(400).json({ message: validation.message });

  const prevStock = Number(product.stock || 0);

  Object.assign(product, validation.data);

  const diff = Number(product.stock || 0) - prevStock;

  if (diff > 0) {
    db.movements.push({
      id: nextId(db, 'movements'),
      productId: product.id,
      userId: req.user.id,
      type: 'ENTRADA',
      quantity: diff,
      reason: 'Recarga de stock',
      notes: 'Actualización manual de producto',
      createdAt: now()
    });
  }

  saveDb(db);
  res.json({ success: true, message: 'Producto actualizado correctamente', data: enrichProduct(db, product) });
});

app.patch('/api/products/:id/toggle', auth, requireRoles('ADMIN'), (req, res) => {
  const db = req.db;
  const product = db.products.find((p) => p.id === Number(req.params.id));
  if (!product) return res.status(404).json({ message: 'Producto no encontrado' });
  product.active = !product.active;
  saveDb(db);
  res.json({ success: true, message: 'Producto actualizado', data: enrichProduct(db, product) });
});

app.get('/api/dashboard/summary', auth, requireRoles('ADMIN', 'TRABAJADOR'), (req, res) => {
  const db = req.db;
  const totalSales = db.payments.filter((p) => p.status === 'APROBADO').reduce((sum, p) => sum + p.amount, 0);
  const inventoryValue = db.products.reduce((sum, p) => sum + p.purchasePrice * p.stock, 0);
  const pendingPayments = db.payments.filter((p) => p.status === 'PENDIENTE').length;
  const lowStockProducts = db.products.filter((p) => p.stock <= p.minimumStock).map((p) => ({ id: p.id, code: p.code, name: p.name, stock: p.stock, minimumStock: p.minimumStock }));
  const recentMovements = db.movements.slice(-8).reverse().map((m) => {
    const product = db.products.find((p) => p.id === m.productId);
    const user = db.users.find((u) => u.id === m.userId);
    return { id: m.id, productName: product?.name || '', type: m.type, quantity: m.quantity, userName: user ? `${user.firstName} ${user.lastName}` : '', createdAt: m.createdAt };
  });
  const recentOrders = db.orders.slice(-6).reverse().map((o) => orderResponse(db, o));
  const recentPayments = db.payments.slice(-6).reverse().map((p) => paymentResponse(db, p));
  const topProducts = db.products.map((p) => ({ name: p.name, value: p.unitsSold || 0 })).sort((a, b) => b.value - a.value).slice(0, 5);
  const topWorkers = db.users.filter((u) => u.role === 'TRABAJADOR' || u.role === 'ADMIN').map((u) => {
    const sales = db.payments.filter((p) => p.approvedBy === u.id && p.status === 'APROBADO').reduce((sum, p) => sum + p.amount, 0);
    return { name: `${u.firstName} ${u.lastName}`, value: sales };
  }).sort((a, b) => b.value - a.value).slice(0, 5);

  res.json({
    success: true,
    data: {
      totalProducts: db.products.length,
      totalCategories: db.categories.length,
      totalBrands: db.brands.length,
      totalSuppliers: db.suppliers.length,
      totalWorkers: db.users.filter((u) => u.role === 'TRABAJADOR').length,
      totalCustomers: db.users.filter((u) => u.role === 'CLIENTE').length,
      totalOrders: db.orders.length,
      totalPayments: db.payments.length,
      totalInvoices: db.invoices.length,
      lowStock: lowStockProducts.length,
      pendingPayments,
      totalSales,
      inventoryValue,
      lowStockProducts,
      recentMovements,
      recentOrders,
      recentPayments,
      topProducts,
      topWorkers,
      supplierSpend: db.procurementOrders.reduce((sum, p) => sum + Number(p.totalCost || 0), 0)
    }
  });
});

app.get('/api/alerts', auth, requireRoles('ADMIN', 'TRABAJADOR'), (req, res) => {
  const alerts = req.db.products.filter((p) => p.stock <= p.minimumStock).map((p) => ({
    id: p.id,
    code: p.code,
    name: p.name,
    categoryName: req.db.categories.find((c) => c.id === p.categoryId)?.name || '',
    brandName: req.db.brands.find((b) => b.id === p.brandId)?.name || '',
    stock: p.stock,
    minimumStock: p.minimumStock,
    missing: Math.max(0, p.minimumStock - p.stock)
  }));
  res.json({ success: true, data: alerts });
});

app.get('/api/movements', auth, requireRoles('ADMIN', 'TRABAJADOR'), (req, res) => {
  const rows = req.db.movements.slice().reverse().map((m) => {
    const product = req.db.products.find((p) => p.id === m.productId);
    const user = req.db.users.find((u) => u.id === m.userId);
    return { id: m.id, productId: m.productId, productCode: product?.code || '', productName: product?.name || '', userId: m.userId, userName: user ? `${user.firstName} ${user.lastName}` : '', userEmail: user?.email || '', type: m.type, quantity: m.quantity, reason: m.reason, notes: m.notes, createdAt: m.createdAt };
  });
  res.json(rows);
});

app.post('/api/movements/in', auth, requireRoles('ADMIN', 'TRABAJADOR'), (req, res) => {
  const db = req.db;
  const { productId, quantity, reason = 'Entrada', notes = '' } = req.body || {};
  const product = db.products.find((p) => p.id === Number(productId));
  if (!product) return res.status(404).json({ message: 'Producto no encontrado' });
  product.stock += Number(quantity);
  const movement = { id: nextId(db, 'movements'), productId: product.id, userId: req.user.id, type: 'ENTRADA', quantity: Number(quantity), reason, notes, createdAt: now() };
  db.movements.push(movement);
  saveDb(db);
  res.status(201).json({ success: true, message: 'Entrada registrada correctamente', data: movement });
});

app.post('/api/movements/out', auth, requireRoles('ADMIN', 'TRABAJADOR'), (req, res) => {
  const db = req.db;
  const { productId, quantity, reason = 'Salida', notes = '' } = req.body || {};
  const product = db.products.find((p) => p.id === Number(productId));
  if (!product) return res.status(404).json({ message: 'Producto no encontrado' });
  if (product.stock < Number(quantity)) return res.status(400).json({ message: 'Stock insuficiente' });
  product.stock -= Number(quantity);
  const movement = { id: nextId(db, 'movements'), productId: product.id, userId: req.user.id, type: 'SALIDA', quantity: Number(quantity), reason, notes, createdAt: now() };
  db.movements.push(movement);
  saveDb(db);
  res.status(201).json({ success: true, message: 'Salida registrada correctamente', data: movement });
});

app.get('/api/cart', auth, requireRoles('CLIENTE'), (req, res) => {
  res.json(buildCartResponse(req.db, req.user.id));
});

app.post('/api/cart/items', auth, requireRoles('CLIENTE'), (req, res) => {
  const db = req.db;
  const { productId, quantity } = req.body || {};
  const product = db.products.find((p) => p.id === Number(productId) && p.active);
  const qty = Number(quantity || 0);
  if (!product) return res.status(404).json({ message: 'Producto no encontrado' });
  if (qty <= 0) return res.status(400).json({ message: 'Cantidad inválida' });
  let cart = db.carts.find((c) => c.userId === req.user.id);
  if (!cart) { cart = { userId: req.user.id, items: [] }; db.carts.push(cart); }
  const existing = cart.items.find((i) => i.productId === product.id);
  const finalQty = (existing?.quantity || 0) + qty;
  if (finalQty > product.stock) return res.status(400).json({ message: 'Stock insuficiente' });
  if (existing) existing.quantity = finalQty; else cart.items.push({ id: nextId(db, 'cartItems'), productId: product.id, quantity: qty });
  saveDb(db);
  res.status(201).json({ success: true, message: 'Producto agregado al carrito', data: buildCartResponse(db, req.user.id) });
});

app.put('/api/cart/items/:itemId', auth, requireRoles('CLIENTE'), (req, res) => {
  const db = req.db;
  const qty = Number(req.body.quantity || 0);
  const cart = db.carts.find((c) => c.userId === req.user.id);
  const item = cart?.items.find((i) => i.id === Number(req.params.itemId));
  if (!item) return res.status(404).json({ message: 'Item no encontrado' });
  const product = db.products.find((p) => p.id === item.productId);
  if (qty <= 0) return res.status(400).json({ message: 'Cantidad inválida' });
  if (qty > product.stock) return res.status(400).json({ message: 'Stock insuficiente' });
  item.quantity = qty;
  saveDb(db);
  res.json({ success: true, message: 'Cantidad actualizada', data: buildCartResponse(db, req.user.id) });
});

app.delete('/api/cart/items/:itemId', auth, requireRoles('CLIENTE'), (req, res) => {
  const db = req.db;
  const cart = db.carts.find((c) => c.userId === req.user.id);
  if (!cart) return res.status(404).json({ message: 'Carrito no encontrado' });
  cart.items = cart.items.filter((i) => i.id !== Number(req.params.itemId));
  saveDb(db);
  res.json({ success: true, message: 'Producto eliminado', data: buildCartResponse(db, req.user.id) });
});

app.delete('/api/cart/items', auth, requireRoles('CLIENTE'), (req, res) => {
  const db = req.db;
  let cart = db.carts.find((c) => c.userId === req.user.id);
  if (!cart) { cart = { userId: req.user.id, items: [] }; db.carts.push(cart); }
  cart.items = [];
  saveDb(db);
  res.json({ success: true, message: 'Carrito vaciado', data: buildCartResponse(db, req.user.id) });
});

app.post('/api/orders', auth, requireRoles('CLIENTE'), (req, res) => {
  const db = req.db;
  const cart = db.carts.find((c) => c.userId === req.user.id);
  if (!cart || !cart.items.length) return res.status(400).json({ message: 'El carrito está vacío' });
  const { deliveryType = 'DOMICILIO', deliveryAddress = '', notes = '' } = req.body || {};
  if (deliveryType === 'DOMICILIO' && !deliveryAddress) return res.status(400).json({ message: 'La dirección es obligatoria para domicilio' });
  const details = [];
  for (const item of cart.items) {
    const product = db.products.find((p) => p.id === item.productId);
    if (!product || !product.active) return res.status(400).json({ message: `Producto inválido: ${item.productId}` });
    if (product.stock < item.quantity) return res.status(400).json({ message: `Stock insuficiente para ${product.name}` });
    details.push({ id: nextId(db, 'orderDetails'), productId: product.id, quantity: item.quantity, unitPrice: product.salePrice, subtotal: product.salePrice * item.quantity });
  }
  const calc = getPromotionBreakdown(db, cart.items);
  const order = {
    id: nextId(db, 'orders'),
    number: `PED-${String(Date.now()).slice(-6)}`,
    userId: req.user.id,
    status: 'PENDIENTE',
    deliveryType,
    deliveryAddress,
    notes,
    subtotal: calc.subtotal,
    discountTotal: calc.discountTotal,
    total: calc.total,
    promotions: calc.promotions,
    details,
    createdAt: now()
  };
  db.orders.push(order);
  cart.items = [];
  adminNotify(db, 'PEDIDO_CREADO', 'Nuevo pedido creado', `El cliente ${req.user.firstName} ${req.user.lastName} creó el pedido ${order.number} por valor de ${order.total}.`, req.user, 'PEDIDO', order.id);
  saveDb(db);
  res.status(201).json({ success: true, message: 'Pedido creado correctamente', data: orderResponse(db, order) });
});

app.get('/api/orders/my', auth, requireRoles('CLIENTE'), (req, res) => {
  const orders = req.db.orders.filter((o) => o.userId === req.user.id).sort((a, b) => b.id - a.id).map((o) => orderResponse(req.db, o));
  res.json(orders);
});

app.get('/api/orders', auth, requireRoles('ADMIN', 'TRABAJADOR'), (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  let rows = req.db.orders.slice().sort((a, b) => b.id - a.id).map((o) => orderResponse(req.db, o));
  if (q) rows = rows.filter((row) => JSON.stringify(row).toLowerCase().includes(q));
  res.json(rows);
});

app.get('/api/orders/:id', auth, (req, res) => {
  const order = req.db.orders.find((o) => o.id === Number(req.params.id));
  if (!order) return res.status(404).json({ message: 'Pedido no encontrado' });
  if (req.user.role === 'CLIENTE' && order.userId !== req.user.id) return res.status(403).json({ message: 'No autorizado' });
  res.json(orderResponse(req.db, order));
});

app.patch('/api/orders/:id/status', auth, requireRoles('ADMIN', 'TRABAJADOR'), (req, res) => {
  const db = req.db;
  const order = db.orders.find((o) => o.id === Number(req.params.id));
  if (!order) return res.status(404).json({ message: 'Pedido no encontrado' });
  order.status = req.body.status || order.status;
  saveDb(db);
  res.json({ success: true, message: 'Estado actualizado', data: orderResponse(db, order) });
});

app.post('/api/payments', auth, requireRoles('CLIENTE'), (req, res) => {
  const db = req.db;
  const { orderId, method, reference = '', amount } = req.body || {};

  const allowedMethods = ['TRANSFERENCIA', 'EFECTIVO', 'TARJETA'];
  const cleanMethod = String(method || '').trim().toUpperCase();
  const cleanReference = String(reference || '').trim();
  const numericAmount = Number(amount);

  const order = db.orders.find((o) => o.id === Number(orderId));
  if (!order) return res.status(404).json({ message: 'Pedido no encontrado' });
  if (order.userId !== req.user.id) return res.status(403).json({ message: 'No autorizado' });
  if (db.payments.some((p) => p.orderId === order.id)) {
    return res.status(400).json({ message: 'El pedido ya tiene un pago registrado' });
  }

  if (!allowedMethods.includes(cleanMethod)) {
    return res.status(400).json({ message: 'Método de pago inválido' });
  }

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({ message: 'El monto debe ser mayor a 0' });
  }

  if (numericAmount !== Number(order.total)) {
    return res.status(400).json({ message: 'El monto debe coincidir con el total del pedido' });
  }

  if (cleanMethod !== 'EFECTIVO' && !cleanReference) {
    return res.status(400).json({ message: 'La referencia es obligatoria para este método de pago' });
  }

  const payment = {
    id: nextId(db, 'payments'),
    orderId: order.id,
    method: cleanMethod,
    status: 'PENDIENTE',
    reference: cleanReference,
    amount: numericAmount,
    createdAt: now(),
    approvedAt: null,
    approvedBy: null
  };

  db.payments.push(payment);

  adminNotify(
    db,
    'PAGO_REGISTRADO',
    'Pago registrado por cliente',
    `El cliente ${req.user.firstName} ${req.user.lastName} registró un pago para el pedido ${order.number} por valor de ${payment.amount}.`,
    req.user,
    'PAGO',
    payment.id
  );

  saveDb(db);
  res.status(201).json({ success: true, message: 'Pago registrado correctamente', data: paymentResponse(db, payment) });
});

app.get('/api/payments/order/:orderId', auth, (req, res) => {
  const order = req.db.orders.find((o) => o.id === Number(req.params.orderId));
  if (!order) return res.status(404).json({ message: 'Pedido no encontrado' });
  if (req.user.role === 'CLIENTE' && order.userId !== req.user.id) return res.status(403).json({ message: 'No autorizado' });
  const payment = req.db.payments.find((p) => p.orderId === order.id);
  if (!payment) return res.status(404).json({ message: 'Pago no encontrado' });
  res.json(paymentResponse(req.db, payment));
});

app.get('/api/payments', auth, requireRoles('ADMIN', 'TRABAJADOR'), (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  let rows = req.db.payments.slice().sort((a, b) => b.id - a.id).map((p) => paymentResponse(req.db, p));
  if (q) rows = rows.filter((row) => JSON.stringify(row).toLowerCase().includes(q));
  res.json(rows);
});

function approveReject(req, res, newStatus) {
  const db = req.db;
  const payment = db.payments.find((p) => p.id === Number(req.params.id));
  if (!payment) return res.status(404).json({ message: 'Pago no encontrado' });
  if (payment.status !== 'PENDIENTE') return res.status(400).json({ message: 'El pago ya fue procesado' });
  const order = db.orders.find((o) => o.id === payment.orderId);

  if (newStatus === 'APROBADO') {
    for (const d of order.details) {
      const product = db.products.find((p) => p.id === d.productId);
      if (!product || product.stock < d.quantity) return res.status(400).json({ message: `Stock insuficiente para ${product?.name || d.productId}` });
    }
    for (const d of order.details) {
      const product = db.products.find((p) => p.id === d.productId);
      product.stock -= d.quantity;
      product.unitsSold = Number(product.unitsSold || 0) + Number(d.quantity || 0);
      db.movements.push({ id: nextId(db, 'movements'), productId: d.productId, userId: req.user.id, type: 'SALIDA', quantity: d.quantity, reason: 'Venta aprobada', notes: `Pago ${payment.id} aprobado`, createdAt: now() });
    }
    order.status = 'PAGADO';
    payment.approvedAt = now();
    payment.approvedBy = req.user.id;
  }

  payment.status = newStatus;
  const user = db.users.find((u) => u.id === order.userId);
  adminNotify(db, newStatus === 'APROBADO' ? 'PAGO_APROBADO' : 'PAGO_RECHAZADO', newStatus === 'APROBADO' ? 'Pago aprobado' : 'Pago rechazado', `El ${req.user.role} ${req.user.firstName} ${req.user.lastName} ${newStatus === 'APROBADO' ? 'aprobó' : 'rechazó'} el pago del pedido ${order.number} del cliente ${user.firstName} ${user.lastName}.`, req.user, 'PAGO', payment.id);
  saveDb(db);
  res.json({ success: true, message: `Pago ${newStatus === 'APROBADO' ? 'aprobado' : 'rechazado'} correctamente`, data: paymentResponse(db, payment) });
}

app.patch('/api/payments/:id/approve', auth, requireRoles('ADMIN', 'TRABAJADOR'), (req, res) => approveReject(req, res, 'APROBADO'));
app.patch('/api/payments/:id/reject', auth, requireRoles('ADMIN', 'TRABAJADOR'), (req, res) => approveReject(req, res, 'RECHAZADO'));

app.get('/api/invoices', auth, requireRoles('ADMIN', 'TRABAJADOR'), (req, res) => {
  res.json(req.db.invoices.slice().sort((a, b) => b.id - a.id).map((i) => invoiceResponse(req.db, i)));
});

app.get('/api/invoices/my', auth, requireRoles('CLIENTE'), (req, res) => {
  const invoices = req.db.invoices.filter((inv) => {
    const order = req.db.orders.find((o) => o.id === inv.orderId);
    return order && order.userId === req.user.id;
  }).map((i) => invoiceResponse(req.db, i));
  res.json(invoices);
});

app.get('/api/invoices/:id', auth, (req, res) => {
  const invoice = req.db.invoices.find((i) => i.id === Number(req.params.id));
  if (!invoice) return res.status(404).json({ message: 'Factura no encontrada' });
  const order = req.db.orders.find((o) => o.id === invoice.orderId);
  if (req.user.role === 'CLIENTE' && order.userId !== req.user.id) return res.status(403).json({ message: 'No autorizado' });
  res.json(invoiceResponse(req.db, invoice));
});

app.get('/api/invoices/order/:orderId', auth, (req, res) => {
  const invoice = req.db.invoices.find((i) => i.orderId === Number(req.params.orderId));
  if (!invoice) return res.status(404).json({ message: 'Factura no encontrada' });
  const order = req.db.orders.find((o) => o.id === invoice.orderId);
  if (req.user.role === 'CLIENTE' && order.userId !== req.user.id) return res.status(403).json({ message: 'No autorizado' });
  res.json(invoiceResponse(req.db, invoice));
});

app.post('/api/invoices/generate/:orderId', auth, requireRoles('ADMIN', 'TRABAJADOR'), (req, res) => {
  const db = req.db;
  const order = db.orders.find((o) => o.id === Number(req.params.orderId));
  if (!order) return res.status(404).json({ message: 'Pedido no encontrado' });
  if (order.status !== 'PAGADO') return res.status(400).json({ message: 'Solo se puede facturar un pedido pagado' });
  if (db.invoices.some((i) => i.orderId === order.id)) return res.status(400).json({ message: 'La factura ya existe' });
  const invoice = { id: nextId(db, 'invoices'), number: `FAC-${String(Date.now()).slice(-6)}`, orderId: order.id, status: 'GENERADA', subtotal: order.subtotal, discountTotal: order.discountTotal || 0, total: order.total, notes: `Factura generada para ${order.number}`, issuedAt: now() };
  db.invoices.push(invoice);
  const customer = db.users.find((u) => u.id === order.userId);
  adminNotify(db, 'FACTURA_GENERADA', 'Factura generada', `El ${req.user.role} ${req.user.firstName} ${req.user.lastName} generó la factura ${invoice.number} del pedido ${order.number} del cliente ${customer.firstName} ${customer.lastName}.`, req.user, 'FACTURA', invoice.id);
  saveDb(db);
  res.status(201).json({ success: true, message: 'Factura generada correctamente', data: invoiceResponse(db, invoice) });
});

app.get('/api/notifications/admin', auth, requireRoles('ADMIN'), (req, res) => {
  const filter = String(req.query.filter || 'TODAS').toUpperCase();
  let rows = req.db.notifications;
  if (filter === 'PAGOS') rows = rows.filter((n) => n.type.includes('PAGO'));
  else if (filter === 'VENTAS') rows = rows.filter((n) => n.type.includes('PEDIDO') || n.type.includes('FACTURA'));
  else if (filter === 'PRODUCTOS') rows = rows.filter((n) => n.type.includes('PRODUCTO'));
  res.json(rows);
});

app.get('/api/notifications/admin/unread', auth, requireRoles('ADMIN'), (req, res) => {
  res.json(req.db.notifications.filter((n) => !n.read));
});

app.get('/api/notifications/admin/count', auth, requireRoles('ADMIN'), (req, res) => {
  res.json({ total: req.db.notifications.filter((n) => !n.read).length });
});

app.patch('/api/notifications/admin/:id/read', auth, requireRoles('ADMIN'), (req, res) => {
  const db = req.db;
  const notification = db.notifications.find((n) => n.id === Number(req.params.id));
  if (!notification) return res.status(404).json({ message: 'Notificación no encontrada' });
  notification.read = true;
  saveDb(db);
  res.json(notification);
});

app.patch('/api/notifications/admin/read-all', auth, requireRoles('ADMIN'), (req, res) => {
  const db = req.db;
  db.notifications.forEach((n) => { n.read = true; });
  saveDb(db);
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});

