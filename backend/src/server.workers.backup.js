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
app.use(express.json());

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
  const user = db.users.find(u => u.id === payload.id && u.active);
  if (!user) return res.status(401).json({ message: 'Usuario invÃƒÂ¡lido' });
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

function enrichProduct(db, p) {
  const category = db.categories.find(c => c.id === p.categoryId);
  const brand = db.brands.find(b => b.id === p.brandId);
  const supplier = db.suppliers.find(s => s.id === p.supplierId);
  return {
    ...p,
    categoryName: category?.name || '',
    brandName: brand?.name || '',
    supplierName: supplier?.name || ''
  };
}

function buildCartResponse(db, userId) {
  const cart = db.carts.find(c => c.userId === userId) || { userId, items: [] };
  const items = cart.items.map(item => {
    const product = db.products.find(p => p.id === item.productId);
    return {
      itemId: item.id,
      productId: product.id,
      code: product.code,
      name: product.name,
      imageUrl: product.imageUrl,
      priceUnit: product.salePrice,
      quantity: item.quantity,
      subtotal: product.salePrice * item.quantity,
      stockAvailable: product.stock
    };
  });
  const total = items.reduce((sum, i) => sum + i.subtotal, 0);
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  return {
    cartId: userId,
    userId,
    items,
    total,
    totalItems
  };
}

function orderResponse(db, order) {
  const user = db.users.find(u => u.id === order.userId);
  return {
    orderId: order.id,
    orderNumber: order.number,
    userId: order.userId,
    customerName: `${user.firstName} ${user.lastName}`,
    customerEmail: user.email,
    status: order.status,
    deliveryType: order.deliveryType,
    deliveryAddress: order.deliveryAddress || '',
    subtotal: order.subtotal,
    total: order.total,
    notes: order.notes || '',
    createdAt: order.createdAt,
    details: order.details.map(d => {
      const product = db.products.find(p => p.id === d.productId);
      return {
        detailId: d.id,
        productId: d.productId,
        code: product?.code || '',
        name: product?.name || '',
        imageUrl: product?.imageUrl || '',
        quantity: d.quantity,
        unitPrice: d.unitPrice,
        subtotal: d.subtotal
      };
    })
  };
}

function paymentResponse(db, payment) {
  const order = db.orders.find(o => o.id === payment.orderId);
  return {
    paymentId: payment.id,
    orderId: payment.orderId,
    orderNumber: order?.number || '',
    method: payment.method,
    status: payment.status,
    reference: payment.reference,
    amount: payment.amount,
    paidAt: payment.paidAt || null
  };
}

function invoiceResponse(db, invoice) {
  const order = db.orders.find(o => o.id === invoice.orderId);
  const user = db.users.find(u => u.id === order.userId);
  return {
    invoiceId: invoice.id,
    invoiceNumber: invoice.number,
    issuedAt: invoice.issuedAt,
    status: invoice.status,
    orderId: order.id,
    orderNumber: order.number,
    customerId: user.id,
    customerName: `${user.firstName} ${user.lastName}`,
    customerEmail: user.email,
    subtotal: invoice.subtotal,
    total: invoice.total,
    notes: invoice.notes || ''
  };
}

// Public
app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.post('/api/auth/register', (req, res) => {
  const db = loadDb();
  const { firstName, lastName, email, password, phone = '', address = '' } = req.body;
  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ message: 'Campos obligatorios incompletos' });
  }
  if (db.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ message: 'El correo ya existe' });
  }
  const user = {
    id: nextId(db, 'users'),
    firstName,
    lastName,
    email: email.toLowerCase(),
    phone,
    address,
    passwordHash: hashPassword(password),
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
  const { email, password } = req.body;
  const user = db.users.find(u => u.email === String(email || '').toLowerCase());
  if (!user || !verifyPassword(password || '', user.passwordHash)) {
    return res.status(401).json({ message: 'Credenciales invÃƒÂ¡lidas' });
  }
  const token = signToken({ id: user.id, role: user.role, email: user.email });
  res.json({
    success: true,
    message: 'Login exitoso',
    data: {
      token,
      type: 'Bearer',
      user: sanitizeUser(user)
    }
  });
});

app.get('/api/auth/me', auth, (req, res) => {
  res.json({ success: true, data: sanitizeUser(req.user) });
});

app.get('/api/shop/home', (_req, res) => {
  const db = loadDb();
  const featured = db.products.filter(p => p.active && p.stock > 0).slice(0, 4).map(p => enrichProduct(db, p));
  res.json({ featuredProducts: featured });
});

app.get('/api/shop/catalog', (_req, res) => {
  const db = loadDb();
  const q = String(_req.query.q || '').toLowerCase().trim();
  let products = db.products.filter(p => p.active && p.stock > 0).map(p => enrichProduct(db, p));
  if (q) {
    products = products.filter(p => p.name.toLowerCase().includes(q) || p.brandName.toLowerCase().includes(q) || p.categoryName.toLowerCase().includes(q));
  }
  res.json(products);
});

app.get('/api/shop/products/:id', (req, res) => {
  const db = loadDb();
  const product = db.products.find(p => p.id === Number(req.params.id) && p.active);
  if (!product) return res.status(404).json({ message: 'Producto no encontrado' });
  const enriched = enrichProduct(db, product);
  const related = db.products
    .filter(p => p.active && p.id !== product.id && (p.categoryId === product.categoryId || p.brandId === product.brandId))
    .slice(0, 4)
    .map(p => enrichProduct(db, p));
  res.json({ ...enriched, related });
});

// Internal masters
function simpleCollectionRoutes(path, key, label) {
  app.get(`/api/${path}`, auth, requireRoles('ADMIN', 'TRABAJADOR'), (req, res) => {
    res.json(req.db[key]);
  });
  app.post(`/api/${path}`, auth, requireRoles('ADMIN'), (req, res) => {
    const db = req.db;
    const item = { id: nextId(db, key), active: true, ...req.body };
    db[key].push(item);
    saveDb(db);
    res.status(201).json({ success: true, message: `${label} creado correctamente`, data: item });
  });
  app.put(`/api/${path}/:id`, auth, requireRoles('ADMIN'), (req, res) => {
    const db = req.db;
    const item = db[key].find(x => x.id === Number(req.params.id));
    if (!item) return res.status(404).json({ message: `${label} no encontrado` });
    Object.assign(item, req.body);
    saveDb(db);
    res.json({ success: true, message: `${label} actualizado correctamente`, data: item });
  });
  app.patch(`/api/${path}/:id/toggle`, auth, requireRoles('ADMIN'), (req, res) => {
    const db = req.db;
    const item = db[key].find(x => x.id === Number(req.params.id));
    if (!item) return res.status(404).json({ message: `${label} no encontrado` });
    item.active = !item.active;
    saveDb(db);
    res.json({ success: true, message: `${label} actualizado`, data: item });
  });
}
simpleCollectionRoutes('categories', 'categories', 'CategorÃƒÂ­a');
simpleCollectionRoutes('brands', 'brands', 'Marca');
simpleCollectionRoutes('suppliers', 'suppliers', 'Proveedor');

// Products
app.get('/api/products', auth, requireRoles('ADMIN', 'TRABAJADOR'), (req, res) => {
  res.json(req.db.products.map(p => enrichProduct(req.db, p)));
});
app.get('/api/products/:id', auth, requireRoles('ADMIN', 'TRABAJADOR'), (req, res) => {
  const product = req.db.products.find(p => p.id === Number(req.params.id));
  if (!product) return res.status(404).json({ message: 'Producto no encontrado' });
  res.json(enrichProduct(req.db, product));
});
app.post('/api/products', auth, requireRoles('ADMIN'), (req, res) => {
  const db = req.db;
  const payload = req.body;
  const product = {
    id: nextId(db, 'products'),
    categoryId: Number(payload.categoryId),
    brandId: Number(payload.brandId),
    supplierId: Number(payload.supplierId),
    code: payload.code,
    name: payload.name,
    description: payload.description || '',
    imageUrl: payload.imageUrl || '',
    volumeMl: Number(payload.volumeMl || 750),
    alcohol: Number(payload.alcohol || 40),
    purchasePrice: Number(payload.purchasePrice || 0),
    salePrice: Number(payload.salePrice || 0),
    stock: Number(payload.stock || 0),
    minimumStock: Number(payload.minimumStock || 0),
    active: true
  };
  db.products.push(product);
  saveDb(db);
  res.status(201).json({ success: true, message: 'Producto creado correctamente', data: enrichProduct(db, product) });
});
app.put('/api/products/:id', auth, requireRoles('ADMIN'), (req, res) => {
  const db = req.db;
  const product = db.products.find(p => p.id === Number(req.params.id));
  if (!product) return res.status(404).json({ message: 'Producto no encontrado' });
  Object.assign(product, {
    ...req.body,
    categoryId: Number(req.body.categoryId),
    brandId: Number(req.body.brandId),
    supplierId: Number(req.body.supplierId),
    volumeMl: Number(req.body.volumeMl),
    alcohol: Number(req.body.alcohol),
    purchasePrice: Number(req.body.purchasePrice),
    salePrice: Number(req.body.salePrice),
    stock: Number(req.body.stock),
    minimumStock: Number(req.body.minimumStock)
  });
  saveDb(db);
  res.json({ success: true, message: 'Producto actualizado correctamente', data: enrichProduct(db, product) });
});
app.patch('/api/products/:id/toggle', auth, requireRoles('ADMIN'), (req, res) => {
  const db = req.db;
  const product = db.products.find(p => p.id === Number(req.params.id));
  if (!product) return res.status(404).json({ message: 'Producto no encontrado' });
  product.active = !product.active;
  saveDb(db);
  res.json({ success: true, message: 'Producto actualizado', data: enrichProduct(db, product) });
});

// Dashboard & alerts
app.get('/api/dashboard/summary', auth, requireRoles('ADMIN', 'TRABAJADOR'), (req, res) => {
  const db = req.db;
  const totalInventoryValue = db.products.reduce((sum, p) => sum + p.salePrice * p.stock, 0);
  res.json({
    totalProducts: db.products.length,
    totalCategories: db.categories.length,
    totalBrands: db.brands.length,
    totalSuppliers: db.suppliers.length,
    lowStock: db.products.filter(p => p.stock <= p.minimumStock).length,
    inventoryValue: totalInventoryValue,
    recentMovements: db.movements.slice(-5).reverse().map(m => {
      const product = db.products.find(p => p.id === m.productId);
      const user = db.users.find(u => u.id === m.userId);
      return {
        id: m.id,
        productName: product?.name || '',
        type: m.type,
        quantity: m.quantity,
        userName: user ? `${user.firstName} ${user.lastName}` : '',
        createdAt: m.createdAt
      };
    })
  });
});

app.get('/api/alerts/low-stock', auth, requireRoles('ADMIN', 'TRABAJADOR'), (req, res) => {
  const db = req.db;
  const alerts = db.products.filter(p => p.stock <= p.minimumStock).map(p => ({
    productId: p.id,
    code: p.code,
    name: p.name,
    categoryName: db.categories.find(c => c.id === p.categoryId)?.name || '',
    brandName: db.brands.find(b => b.id === p.brandId)?.name || '',
    stock: p.stock,
    minimumStock: p.minimumStock,
    missing: Math.max(0, p.minimumStock - p.stock)
  }));
  res.json(alerts);
});

// Movements
app.get('/api/movements', auth, requireRoles('ADMIN', 'TRABAJADOR'), (req, res) => {
  const db = req.db;
  const rows = db.movements.slice().reverse().map(m => {
    const product = db.products.find(p => p.id === m.productId);
    const user = db.users.find(u => u.id === m.userId);
    return {
      id: m.id,
      productId: m.productId,
      productCode: product?.code || '',
      productName: product?.name || '',
      userId: m.userId,
      userName: user ? `${user.firstName} ${user.lastName}` : '',
      userEmail: user?.email || '',
      type: m.type,
      quantity: m.quantity,
      reason: m.reason,
      notes: m.notes,
      createdAt: m.createdAt
    };
  });
  res.json(rows);
});

app.post('/api/movements/in', auth, requireRoles('ADMIN', 'TRABAJADOR'), (req, res) => {
  const db = req.db;
  const { productId, quantity, reason = 'Entrada', notes = '' } = req.body;
  const product = db.products.find(p => p.id === Number(productId));
  if (!product) return res.status(404).json({ message: 'Producto no encontrado' });
  product.stock += Number(quantity);
  const movement = { id: nextId(db, 'movements'), productId: product.id, userId: req.user.id, type: 'ENTRADA', quantity: Number(quantity), reason, notes, createdAt: now() };
  db.movements.push(movement);
  saveDb(db);
  res.status(201).json({ success: true, message: 'Entrada registrada correctamente', data: movement });
});

app.post('/api/movements/out', auth, requireRoles('ADMIN', 'TRABAJADOR'), (req, res) => {
  const db = req.db;
  const { productId, quantity, reason = 'Salida', notes = '' } = req.body;
  const product = db.products.find(p => p.id === Number(productId));
  if (!product) return res.status(404).json({ message: 'Producto no encontrado' });
  if (product.stock < Number(quantity)) return res.status(400).json({ message: 'Stock insuficiente' });
  product.stock -= Number(quantity);
  const movement = { id: nextId(db, 'movements'), productId: product.id, userId: req.user.id, type: 'SALIDA', quantity: Number(quantity), reason, notes, createdAt: now() };
  db.movements.push(movement);
  saveDb(db);
  res.status(201).json({ success: true, message: 'Salida registrada correctamente', data: movement });
});

// Cart
app.get('/api/cart', auth, requireRoles('CLIENTE'), (req, res) => {
  res.json(buildCartResponse(req.db, req.user.id));
});
app.post('/api/cart/items', auth, requireRoles('CLIENTE'), (req, res) => {
  const db = req.db;
  const { productId, quantity } = req.body;
  const product = db.products.find(p => p.id === Number(productId) && p.active);
  if (!product) return res.status(404).json({ message: 'Producto no encontrado' });
  if (product.stock < Number(quantity)) return res.status(400).json({ message: 'Stock insuficiente' });
  let cart = db.carts.find(c => c.userId === req.user.id);
  if (!cart) {
    cart = { userId: req.user.id, items: [] };
    db.carts.push(cart);
  }
  const existing = cart.items.find(i => i.productId === product.id);
  if (existing) {
    if (existing.quantity + Number(quantity) > product.stock) return res.status(400).json({ message: 'Stock insuficiente' });
    existing.quantity += Number(quantity);
  } else {
    cart.items.push({ id: nextId(db, 'cartItems'), productId: product.id, quantity: Number(quantity) });
  }
  saveDb(db);
  res.status(201).json({ success: true, message: 'Producto agregado al carrito', data: buildCartResponse(db, req.user.id) });
});
app.put('/api/cart/items/:itemId', auth, requireRoles('CLIENTE'), (req, res) => {
  const db = req.db;
  const { quantity } = req.body;
  const cart = db.carts.find(c => c.userId === req.user.id);
  const item = cart?.items.find(i => i.id === Number(req.params.itemId));
  if (!item) return res.status(404).json({ message: 'Item no encontrado' });
  const product = db.products.find(p => p.id === item.productId);
  if (product.stock < Number(quantity)) return res.status(400).json({ message: 'Stock insuficiente' });
  item.quantity = Number(quantity);
  saveDb(db);
  res.json({ success: true, message: 'Cantidad actualizada', data: buildCartResponse(db, req.user.id) });
});
app.delete('/api/cart/items/:itemId', auth, requireRoles('CLIENTE'), (req, res) => {
  const db = req.db;
  const cart = db.carts.find(c => c.userId === req.user.id);
  if (!cart) return res.status(404).json({ message: 'Carrito no encontrado' });
  cart.items = cart.items.filter(i => i.id !== Number(req.params.itemId));
  saveDb(db);
  res.json({ success: true, message: 'Producto eliminado', data: buildCartResponse(db, req.user.id) });
});
app.delete('/api/cart/items', auth, requireRoles('CLIENTE'), (req, res) => {
  const db = req.db;
  let cart = db.carts.find(c => c.userId === req.user.id);
  if (!cart) {
    cart = { userId: req.user.id, items: [] };
    db.carts.push(cart);
  } else {
    cart.items = [];
  }
  saveDb(db);
  res.json({ success: true, message: 'Carrito vaciado', data: buildCartResponse(db, req.user.id) });
});

// Orders
app.post('/api/orders', auth, requireRoles('CLIENTE'), (req, res) => {
  const db = req.db;
  const cart = db.carts.find(c => c.userId === req.user.id);
  if (!cart || !cart.items.length) return res.status(400).json({ message: 'El carrito estÃƒÂ¡ vacÃƒÂ­o' });
  const { deliveryType, deliveryAddress = '', notes = '' } = req.body;
  if (deliveryType === 'DOMICILIO' && !deliveryAddress) {
    return res.status(400).json({ message: 'La direcciÃƒÂ³n es obligatoria para domicilio' });
  }
  const details = [];
  let subtotal = 0;
  for (const item of cart.items) {
    const product = db.products.find(p => p.id === item.productId);
    if (!product || !product.active) return res.status(400).json({ message: `Producto invÃƒÂ¡lido: ${item.productId}` });
    if (product.stock < item.quantity) return res.status(400).json({ message: `Stock insuficiente para ${product.name}` });
    const line = {
      id: nextId(db, 'orderDetails'),
      productId: product.id,
      quantity: item.quantity,
      unitPrice: product.salePrice,
      subtotal: product.salePrice * item.quantity
    };
    subtotal += line.subtotal;
    details.push(line);
  }
  const order = {
    id: nextId(db, 'orders'),
    number: `PED-${String(Date.now()).slice(-6)}`,
    userId: req.user.id,
    status: 'PENDIENTE',
    deliveryType,
    deliveryAddress,
    notes,
    subtotal,
    total: subtotal,
    details,
    createdAt: now()
  };
  db.orders.push(order);
  cart.items = [];
  adminNotify(db, 'PEDIDO_CREADO', 'Nuevo pedido creado', `El cliente ${req.user.firstName} ${req.user.lastName} creÃƒÂ³ el pedido ${order.number} por valor de ${order.total}.`, req.user, 'PEDIDO', order.id);
  saveDb(db);
  res.status(201).json({ success: true, message: 'Pedido creado correctamente', data: orderResponse(db, order) });
});

app.get('/api/orders/my', auth, requireRoles('CLIENTE'), (req, res) => {
  const orders = req.db.orders.filter(o => o.userId === req.user.id).sort((a,b)=> b.id-a.id).map(o => orderResponse(req.db, o));
  res.json(orders);
});

app.get('/api/orders', auth, requireRoles('ADMIN', 'TRABAJADOR'), (req, res) => {
  res.json(req.db.orders.slice().sort((a,b)=> b.id-a.id).map(o => orderResponse(req.db, o)));
});

app.get('/api/orders/:id', auth, (req, res) => {
  const order = req.db.orders.find(o => o.id === Number(req.params.id));
  if (!order) return res.status(404).json({ message: 'Pedido no encontrado' });
  if (req.user.role === 'CLIENTE' && order.userId !== req.user.id) return res.status(403).json({ message: 'No autorizado' });
  res.json(orderResponse(req.db, order));
});

app.patch('/api/orders/:id/status', auth, requireRoles('ADMIN', 'TRABAJADOR'), (req, res) => {
  const db = req.db;
  const order = db.orders.find(o => o.id === Number(req.params.id));
  if (!order) return res.status(404).json({ message: 'Pedido no encontrado' });
  order.status = req.body.status || order.status;
  saveDb(db);
  res.json({ success: true, message: 'Estado actualizado', data: orderResponse(db, order) });
});

// Payments
app.post('/api/payments', auth, requireRoles('CLIENTE'), (req, res) => {
  const db = req.db;
  const { orderId, method, reference = '', amount } = req.body;
  const order = db.orders.find(o => o.id === Number(orderId));
  if (!order) return res.status(404).json({ message: 'Pedido no encontrado' });
  if (order.userId !== req.user.id) return res.status(403).json({ message: 'No autorizado' });
  if (db.payments.some(p => p.orderId === order.id)) return res.status(400).json({ message: 'El pedido ya tiene un pago registrado' });
  if (Number(amount) !== Number(order.total)) return res.status(400).json({ message: 'El monto debe coincidir con el total del pedido' });
  const payment = {
    id: nextId(db, 'payments'),
    orderId: order.id,
    method,
    status: 'PENDIENTE',
    reference,
    amount: Number(amount),
    paidAt: now()
  };
  db.payments.push(payment);
  adminNotify(db, 'PAGO_REGISTRADO', 'Pago registrado por cliente', `El cliente ${req.user.firstName} ${req.user.lastName} registrÃƒÂ³ un pago para el pedido ${order.number} por valor de ${payment.amount}.`, req.user, 'PAGO', payment.id);
  saveDb(db);
  res.status(201).json({ success: true, message: 'Pago registrado correctamente', data: paymentResponse(db, payment) });
});

app.get('/api/payments/order/:orderId', auth, (req, res) => {
  const order = req.db.orders.find(o => o.id === Number(req.params.orderId));
  if (!order) return res.status(404).json({ message: 'Pedido no encontrado' });
  if (req.user.role === 'CLIENTE' && order.userId !== req.user.id) return res.status(403).json({ message: 'No autorizado' });
  const payment = req.db.payments.find(p => p.orderId === order.id);
  if (!payment) return res.status(404).json({ message: 'Pago no encontrado' });
  res.json(paymentResponse(req.db, payment));
});

function approveReject(req, res, newStatus) {
  const db = req.db;
  const payment = db.payments.find(p => p.id === Number(req.params.id));
  if (!payment) return res.status(404).json({ message: 'Pago no encontrado' });
  if (payment.status !== 'PENDIENTE') return res.status(400).json({ message: 'El pago ya fue procesado' });
  const order = db.orders.find(o => o.id === payment.orderId);
  if (newStatus === 'APROBADO') {
    for (const d of order.details) {
      const product = db.products.find(p => p.id === d.productId);
      if (!product || product.stock < d.quantity) return res.status(400).json({ message: `Stock insuficiente para ${product?.name || d.productId}` });
    }
    for (const d of order.details) {
      const product = db.products.find(p => p.id === d.productId);
      product.stock -= d.quantity;
      db.movements.push({
        id: nextId(db, 'movements'),
        productId: d.productId,
        userId: req.user.id,
        type: 'SALIDA',
        quantity: d.quantity,
        reason: 'Venta',
        notes: `Descuento por aprobaciÃƒÂ³n de pago ${payment.id}`,
        createdAt: now()
      });
    }
    order.status = 'PAGADO';
    payment.paidAt = now();
  }
  payment.status = newStatus;
  const user = db.users.find(u => u.id === order.userId);
  adminNotify(
    db,
    newStatus === 'APROBADO' ? 'PAGO_APROBADO' : 'PAGO_RECHAZADO',
    newStatus === 'APROBADO' ? 'Pago aprobado' : 'Pago rechazado',
    `El ${req.user.role} ${req.user.firstName} ${req.user.lastName} ${newStatus === 'APROBADO' ? 'aprobÃƒÂ³' : 'rechazÃƒÂ³'} el pago del pedido ${order.number} del cliente ${user.firstName} ${user.lastName}.`,
    req.user,
    'PAGO',
    payment.id
  );
  saveDb(db);
  res.json({ success: true, message: `Pago ${newStatus === 'APROBADO' ? 'aprobado' : 'rechazado'} correctamente`, data: paymentResponse(db, payment) });
}
app.patch('/api/payments/:id/approve', auth, requireRoles('ADMIN', 'TRABAJADOR'), (req, res) => approveReject(req, res, 'APROBADO'));
app.patch('/api/payments/:id/reject', auth, requireRoles('ADMIN', 'TRABAJADOR'), (req, res) => approveReject(req, res, 'RECHAZADO'));

// Invoices
app.get('/api/invoices', auth, requireRoles('ADMIN', 'TRABAJADOR'), (req, res) => {
  res.json(req.db.invoices.slice().sort((a,b)=> b.id-a.id).map(i => invoiceResponse(req.db, i)));
});
app.get('/api/invoices/my', auth, requireRoles('CLIENTE'), (req, res) => {
  const invoices = req.db.invoices.filter(inv => {
    const order = req.db.orders.find(o => o.id === inv.orderId);
    return order && order.userId === req.user.id;
  }).map(i => invoiceResponse(req.db, i));
  res.json(invoices);
});
app.get('/api/invoices/:id', auth, (req, res) => {
  const invoice = req.db.invoices.find(i => i.id === Number(req.params.id));
  if (!invoice) return res.status(404).json({ message: 'Factura no encontrada' });
  const order = req.db.orders.find(o => o.id === invoice.orderId);
  if (req.user.role === 'CLIENTE' && order.userId !== req.user.id) return res.status(403).json({ message: 'No autorizado' });
  res.json(invoiceResponse(req.db, invoice));
});
app.get('/api/invoices/order/:orderId', auth, (req, res) => {
  const invoice = req.db.invoices.find(i => i.orderId === Number(req.params.orderId));
  if (!invoice) return res.status(404).json({ message: 'Factura no encontrada' });
  const order = req.db.orders.find(o => o.id === invoice.orderId);
  if (req.user.role === 'CLIENTE' && order.userId !== req.user.id) return res.status(403).json({ message: 'No autorizado' });
  res.json(invoiceResponse(req.db, invoice));
});
app.post('/api/invoices/generate/:orderId', auth, requireRoles('ADMIN', 'TRABAJADOR'), (req, res) => {
  const db = req.db;
  const order = db.orders.find(o => o.id === Number(req.params.orderId));
  if (!order) return res.status(404).json({ message: 'Pedido no encontrado' });
  if (order.status !== 'PAGADO') return res.status(400).json({ message: 'Solo se puede facturar un pedido pagado' });
  if (db.invoices.some(i => i.orderId === order.id)) return res.status(400).json({ message: 'La factura ya existe' });
  const invoice = {
    id: nextId(db, 'invoices'),
    number: `FAC-${String(Date.now()).slice(-6)}`,
    orderId: order.id,
    status: 'GENERADA',
    subtotal: order.subtotal,
    total: order.total,
    notes: `Factura generada para ${order.number}`,
    issuedAt: now()
  };
  db.invoices.push(invoice);
  const customer = db.users.find(u => u.id === order.userId);
  adminNotify(db, 'FACTURA_GENERADA', 'Factura generada', `El ${req.user.role} ${req.user.firstName} ${req.user.lastName} generÃƒÂ³ la factura ${invoice.number} del pedido ${order.number} del cliente ${customer.firstName} ${customer.lastName}.`, req.user, 'FACTURA', invoice.id);
  saveDb(db);
  res.status(201).json({ success: true, message: 'Factura generada correctamente', data: invoiceResponse(db, invoice) });
});

// Notifications admin
app.get('/api/notifications/admin', auth, requireRoles('ADMIN'), (req, res) => {
  res.json(req.db.notifications);
});
app.get('/api/notifications/admin/unread', auth, requireRoles('ADMIN'), (req, res) => {
  res.json(req.db.notifications.filter(n => !n.read));
});
app.get('/api/notifications/admin/count', auth, requireRoles('ADMIN'), (req, res) => {
  res.json({ total: req.db.notifications.filter(n => !n.read).length });
});
app.patch('/api/notifications/admin/:id/read', auth, requireRoles('ADMIN'), (req, res) => {
  const db = req.db;
  const notification = db.notifications.find(n => n.id === Number(req.params.id));
  if (!notification) return res.status(404).json({ message: 'NotificaciÃƒÂ³n no encontrada' });
  notification.read = true;
  saveDb(db);
  res.json(notification);
});
app.patch('/api/notifications/admin/read-all', auth, requireRoles('ADMIN'), (req, res) => {
  const db = req.db;
  db.notifications.forEach(n => { n.read = true; });
  saveDb(db);
  res.status(204).send();
});


const buildSafeUser = (user) => ({
  id: user.id,
  nombre: user.nombre,
  apellido: user.apellido,
  correo: user.correo,
  telefono: user.telefono || '',
  direccion: user.direccion || '',
  rol: user.rol
})

app.get('/api/auth/me', auth, (req, res) => {
  const user = users.find((u) => u.id === req.user.id)

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Usuario no encontrado'
    })
  }

  return res.json({
    success: true,
    data: buildSafeUser(user)
  })
})

app.put('/api/users/profile', auth, (req, res) => {
  const user = users.find((u) => u.id === req.user.id)

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Usuario no encontrado'
    })
  }

  const {
    nombre = '',
    apellido = '',
    telefono = '',
    direccion = ''
  } = req.body || {}

  if (!nombre.trim() || !apellido.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Nombre y apellido son obligatorios'
    })
  }

  user.nombre = nombre.trim()
  user.apellido = apellido.trim()
  user.telefono = telefono.trim()
  user.direccion = direccion.trim()

  return res.json({
    success: true,
    message: 'Perfil actualizado correctamente',
    data: buildSafeUser(user)
  })
})




const presentWorker = (u) => ({
  id: u.id,
  firstName: u.firstName || '',
  lastName: u.lastName || '',
  email: u.email || '',
  phone: u.phone || '',
  address: u.address || '',
  role: u.role || 'TRABAJADOR',
  active: typeof u.active === 'boolean' ? u.active : true,
  createdAt: u.createdAt || null
});

app.get('/api/users/workers', auth, (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'No autorizado'
    });
  }

  const db = loadDb();

  const workers = db.users
    .filter((u) => u.role === 'TRABAJADOR')
    .map((u) => presentWorker(u));

  return res.json({
    success: true,
    data: workers
  });
});

app.post('/api/users/workers', auth, (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'No autorizado'
    });
  }

  const db = loadDb();

  const {
    firstName = '',
    lastName = '',
    email = '',
    password = '',
    phone = '',
    address = ''
  } = req.body || {};

  if (!String(firstName).trim() || !String(lastName).trim() || !String(email).trim() || !String(password).trim()) {
    return res.status(400).json({
      success: false,
      message: 'Nombre, apellido, correo y contraseña son obligatorios'
    });
  }

  const exists = db.users.some(
    (u) => String(u.email).toLowerCase() === String(email).trim().toLowerCase()
  );

  if (exists) {
    return res.status(400).json({
      success: false,
      message: 'Ya existe un usuario con ese correo'
    });
  }

  const nextId =
    db.users.length > 0
      ? Math.max(...db.users.map((u) => Number(u.id) || 0)) + 1
      : 1;

  const newWorker = {
    id: nextId,
    firstName: String(firstName).trim(),
    lastName: String(lastName).trim(),
    email: String(email).trim().toLowerCase(),
    password: String(password).trim(),
    phone: String(phone).trim(),
    address: String(address).trim(),
    role: 'TRABAJADOR',
    active: true,
    createdAt: new Date().toISOString()
  };

  db.users.push(newWorker);
  saveDb(db);

  return res.status(201).json({
    success: true,
    message: 'Trabajador creado correctamente',
    data: presentWorker(newWorker)
  });
});

app.put('/api/users/workers/:id', auth, (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'No autorizado'
    });
  }

  const db = loadDb();
  const id = Number(req.params.id);

  const worker = db.users.find((u) => Number(u.id) === id && u.role === 'TRABAJADOR');

  if (!worker) {
    return res.status(404).json({
      success: false,
      message: 'Trabajador no encontrado'
    });
  }

  const {
    firstName = '',
    lastName = '',
    email = '',
    password = '',
    phone = '',
    address = '',
    active = true
  } = req.body || {};

  if (!String(firstName).trim() || !String(lastName).trim() || !String(email).trim()) {
    return res.status(400).json({
      success: false,
      message: 'Nombre, apellido y correo son obligatorios'
    });
  }

  const exists = db.users.some(
    (u) =>
      Number(u.id) !== id &&
      String(u.email).toLowerCase() === String(email).trim().toLowerCase()
  );

  if (exists) {
    return res.status(400).json({
      success: false,
      message: 'Ya existe otro usuario con ese correo'
    });
  }

  worker.firstName = String(firstName).trim();
  worker.lastName = String(lastName).trim();
  worker.email = String(email).trim().toLowerCase();
  worker.phone = String(phone).trim();
  worker.address = String(address).trim();
  worker.active = Boolean(active);

  if (String(password).trim()) {
    worker.password = String(password).trim();
  }

  saveDb(db);

  return res.json({
    success: true,
    message: 'Trabajador actualizado correctamente',
    data: presentWorker(worker)
  });
});

app.listen(PORT, () => {
  console.log(`Backend licoreria corriendo en http://localhost:${PORT}`);
});









