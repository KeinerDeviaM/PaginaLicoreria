const fs = require('fs');
const path = require('path');
const { hashPassword } = require('./auth');

const DB_PATH = path.join(__dirname, '..', 'data.json');

function now() {
  return new Date().toISOString();
}

function makeSuppliers() {
  return [
    { id: 1, name: 'Distribuciones Premium', contactName: 'Laura Pérez', email: 'ventas@premium.com', phone: '3101111111', address: 'Bogotá', city: 'Bogotá', shippingCostBase: 18000, packagingCostBase: 6000, active: true },
    { id: 2, name: 'Importadora Gold', contactName: 'Mario Díaz', email: 'contacto@gold.com', phone: '3102222222', address: 'Medellín', city: 'Medellín', shippingCostBase: 22000, packagingCostBase: 7000, active: true },
    { id: 3, name: 'Vinos del Mundo', contactName: 'Andrea Ruiz', email: 'info@vinosmundo.com', phone: '3103333333', address: 'Cali', city: 'Cali', shippingCostBase: 25000, packagingCostBase: 8000, active: true },
    { id: 4, name: 'Licores Nacionales', contactName: 'Camilo Vargas', email: 'pedidos@nacionales.com', phone: '3104444444', address: 'Barranquilla', city: 'Barranquilla', shippingCostBase: 17000, packagingCostBase: 5000, active: true }
  ];
}

function makeCategories() {
  return [
    { id: 1, name: 'Whisky', description: 'Whiskys premium y blend', active: true },
    { id: 2, name: 'Ron', description: 'Rones nacionales e importados', active: true },
    { id: 3, name: 'Vodka', description: 'Vodkas clásicos y premium', active: true },
    { id: 4, name: 'Vino', description: 'Vinos tintos, blancos y rosados', active: true },
    { id: 5, name: 'Cerveza', description: 'Cervezas artesanales e importadas', active: true },
    { id: 6, name: 'Tequila', description: 'Tequilas reposados y añejos', active: true }
  ];
}

function makeBrandsAndProducts() {
  const brandCatalog = [
    ['Macallan', 1], ['Johnnie Walker', 1], ['Chivas Regal', 1], ['Jack Daniels', 1], ['Ballantines', 1],
    ['Havana Club', 2], ['Diplomático', 2], ['Santa Teresa', 2], ['Bacardí', 2], ['Zacapa', 2],
    ['Grey Goose', 3], ['Absolut', 3], ['Smirnoff', 3], ['Belvedere', 3], ['Cîroc', 3],
    ['Concha y Toro', 4], ['Santa Helena', 4], ['Trapiche', 4], ['Casillero del Diablo', 4], ['Marqués de Riscal', 4],
    ['Corona', 5], ['Heineken', 5], ['Stella Artois', 5], ['Club Colombia', 5], ['Budweiser', 5],
    ['Don Julio', 6], ['José Cuervo', 6], ['Patrón', 6], ['1800', 6], ['Herradura', 6]
  ];

  const priceByCategory = {
    1: { purchase: 145000, sale: 210000, volume: 750, alcohol: 40 },
    2: { purchase: 55000, sale: 85000, volume: 750, alcohol: 38 },
    3: { purchase: 68000, sale: 110000, volume: 750, alcohol: 40 },
    4: { purchase: 42000, sale: 76000, volume: 750, alcohol: 13 },
    5: { purchase: 6500, sale: 11000, volume: 330, alcohol: 5 },
    6: { purchase: 98000, sale: 150000, volume: 750, alcohol: 38 }
  };

  const brands = [];
  const products = [];
  brandCatalog.forEach(([name, categoryId], idx) => {
    const id = idx + 1;
    const base = priceByCategory[categoryId];
    const supplierId = (idx % 4) + 1;
    const multiplier = 1 + ((idx % 5) * 0.12);
    const purchasePrice = Math.round(base.purchase * multiplier / 1000) * 1000;
    const salePrice = Math.round(base.sale * multiplier / 1000) * 1000;
    const stock = 18 + (idx % 8) * 4;
    const minimumStock = 8 + (idx % 4) * 2;
    const codePrefix = ['WH','RO','VO','VI','CE','TE'][categoryId - 1];

    brands.push({ id, name, description: `${name} marca destacada`, active: true });
    products.push({
      id,
      categoryId,
      brandId: id,
      supplierId,
      code: `${codePrefix}-${String(id).padStart(3, '0')}`,
      name: `${name} ${categoryId === 5 ? 'Botella' : 'Reserva'}`,
      description: `${name} de categoría ${categoryId} con presentación profesional para tienda y venta directa.`,
      imageUrl: '',
      volumeMl: base.volume,
      alcohol: base.alcohol,
      purchasePrice,
      salePrice,
      stock,
      minimumStock,
      active: true,
      unitsSold: idx % 7,
      createdAt: now()
    });
  });

  return { brands, products };
}

function seed() {
  const categories = makeCategories();
  const suppliers = makeSuppliers();
  const { brands, products } = makeBrandsAndProducts();

  return {
    counters: {
      users: 6,
      categories: categories.length,
      brands: brands.length,
      suppliers: suppliers.length,
      products: products.length,
      movements: products.length,
      orders: 0,
      orderDetails: 0,
      cartItems: 0,
      payments: 0,
      invoices: 0,
      notifications: 0,
      procurementOrders: suppliers.length
    },
    users: [
      { id: 1, firstName: 'Admin', lastName: 'Sistema', email: 'admin@licoreria.com', phone: '3000000001', address: 'Oficina principal', passwordHash: hashPassword('12345678'), role: 'ADMIN', active: true, createdAt: now() },
      { id: 2, firstName: 'Trabajador', lastName: 'Licoreria', email: 'trabajador@licoreria.com', phone: '3000000002', address: 'Sucursal principal', passwordHash: hashPassword('12345678'), role: 'TRABAJADOR', active: true, createdAt: now() },
      { id: 3, firstName: 'Cliente', lastName: 'Demo', email: 'cliente@licoreria.com', phone: '3000000003', address: 'Calle 123', passwordHash: hashPassword('12345678'), role: 'CLIENTE', active: true, createdAt: now() },
      { id: 4, firstName: 'Keiner', lastName: 'Devia', email: 'keiner@gmail.com', phone: '3157398252', address: 'Armenia', passwordHash: hashPassword('12345678'), role: 'CLIENTE', active: true, createdAt: now() },
      { id: 5, firstName: 'Laura', lastName: 'Vendedora', email: 'laura.trabajadora@licoreria.com', phone: '3115556677', address: 'Armenia Centro', passwordHash: hashPassword('12345678'), role: 'TRABAJADOR', active: true, createdAt: now() },
      { id: 6, firstName: 'Santiago', lastName: 'Cajero', email: 'santiago.trabajador@licoreria.com', phone: '3134442299', address: 'Armenia Norte', passwordHash: hashPassword('12345678'), role: 'TRABAJADOR', active: true, createdAt: now() }
    ],
    categories,
    brands,
    suppliers,
    products,
    movements: products.map((p, i) => ({ id: i + 1, productId: p.id, userId: 1, type: 'ENTRADA', quantity: p.stock, reason: 'Inventario inicial', notes: '', createdAt: now() })),
    carts: [],
    orders: [],
    payments: [],
    invoices: [],
    notifications: [],
    procurementOrders: suppliers.map((s, i) => ({
      id: i + 1,
      supplierId: s.id,
      supplierName: s.name,
      shippingCost: s.shippingCostBase,
      packagingCost: s.packagingCostBase,
      itemsCost: 0,
      totalCost: s.shippingCostBase + s.packagingCostBase,
      notes: 'Costo base logístico del proveedor',
      createdAt: now()
    }))
  };
}

function initDb() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(seed(), null, 2), 'utf8');
  }
}

function loadDb() {
  initDb();
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function saveDb(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function nextId(db, key) {
  db.counters[key] = (db.counters[key] || 0) + 1;
  return db.counters[key];
}

module.exports = { DB_PATH, initDb, loadDb, saveDb, nextId, now, seed };
