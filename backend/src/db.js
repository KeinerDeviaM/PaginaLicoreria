const fs = require('fs');
const path = require('path');
const { hashPassword } = require('./auth');

const DB_PATH = path.join(__dirname, '..', 'data.json');

function now() {
  return new Date().toISOString();
}

function seed() {
  return {
    counters: {
      users: 3,
      categories: 4,
      brands: 4,
      suppliers: 3,
      products: 6,
      movements: 2,
      orders: 1,
      orderDetails: 2,
      cartItems: 1,
      payments: 0,
      invoices: 0,
      notifications: 0
    },
    users: [
      {
        id: 1,
        firstName: 'Admin',
        lastName: 'Sistema',
        email: 'admin@licoreria.com',
        phone: '3000000001',
        address: 'Oficina principal',
        passwordHash: hashPassword('12345678'),
        role: 'ADMIN',
        active: true,
        createdAt: now()
      },
      {
        id: 2,
        firstName: 'Trabajador',
        lastName: 'Licoreria',
        email: 'trabajador@licoreria.com',
        phone: '3000000002',
        address: 'Sucursal principal',
        passwordHash: hashPassword('12345678'),
        role: 'TRABAJADOR',
        active: true,
        createdAt: now()
      },
      {
        id: 3,
        firstName: 'Cliente',
        lastName: 'Demo',
        email: 'cliente@licoreria.com',
        phone: '3000000003',
        address: 'Calle 123',
        passwordHash: hashPassword('12345678'),
        role: 'CLIENTE',
        active: true,
        createdAt: now()
      }
    ],
    categories: [
      { id: 1, name: 'Whisky', description: 'Whiskys premium', active: true },
      { id: 2, name: 'Ron', description: 'Rones añejos', active: true },
      { id: 3, name: 'Vodka', description: 'Vodkas importados', active: true },
      { id: 4, name: 'Vino', description: 'Vinos y espumosos', active: true }
    ],
    brands: [
      { id: 1, name: 'Macallan', description: 'Scotch whisky', active: true },
      { id: 2, name: 'Havana Club', description: 'Ron cubano', active: true },
      { id: 3, name: 'Grey Goose', description: 'Vodka francés', active: true },
      { id: 4, name: 'Moet & Chandon', description: 'Champagne', active: true }
    ],
    suppliers: [
      { id: 1, name: 'Distribuciones Premium', contactName: 'Laura Pérez', email: 'ventas@premium.com', phone: '3101111111', address: 'Bogotá', city: 'Bogotá', active: true },
      { id: 2, name: 'Importadora Gold', contactName: 'Mario Díaz', email: 'contacto@gold.com', phone: '3102222222', address: 'Medellín', city: 'Medellín', active: true },
      { id: 3, name: 'Vinos del Mundo', contactName: 'Andrea Ruiz', email: 'info@vinosmundo.com', phone: '3103333333', address: 'Cali', city: 'Cali', active: true }
    ],
    products: [
      { id: 1, categoryId: 1, brandId: 1, supplierId: 1, code: 'WH-001', name: 'Macallan 18', description: 'Whisky escocés premium', imageUrl: '', volumeMl: 750, alcohol: 40, purchasePrice: 450000, salePrice: 650000, stock: 8, minimumStock: 3, active: true },
      { id: 2, categoryId: 2, brandId: 2, supplierId: 2, code: 'RO-001', name: 'Havana Club 7', description: 'Ron añejo 7 años', imageUrl: '', volumeMl: 750, alcohol: 40, purchasePrice: 65000, salePrice: 98000, stock: 20, minimumStock: 5, active: true },
      { id: 3, categoryId: 3, brandId: 3, supplierId: 1, code: 'VO-001', name: 'Grey Goose', description: 'Vodka francés premium', imageUrl: '', volumeMl: 750, alcohol: 40, purchasePrice: 90000, salePrice: 140000, stock: 4, minimumStock: 5, active: true },
      { id: 4, categoryId: 4, brandId: 4, supplierId: 3, code: 'VI-001', name: 'Moet Imperial', description: 'Champagne brut imperial', imageUrl: '', volumeMl: 750, alcohol: 12, purchasePrice: 180000, salePrice: 260000, stock: 6, minimumStock: 2, active: true },
      { id: 5, categoryId: 1, brandId: 1, supplierId: 1, code: 'WH-002', name: 'Macallan 12', description: 'Whisky single malt', imageUrl: '', volumeMl: 750, alcohol: 40, purchasePrice: 220000, salePrice: 320000, stock: 15, minimumStock: 4, active: true },
      { id: 6, categoryId: 2, brandId: 2, supplierId: 2, code: 'RO-002', name: 'Havana Club 3', description: 'Ron blanco premium', imageUrl: '', volumeMl: 750, alcohol: 40, purchasePrice: 35000, salePrice: 55000, stock: 30, minimumStock: 8, active: true }
    ],
    movements: [
      { id: 1, productId: 1, userId: 1, type: 'ENTRADA', quantity: 8, reason: 'Inventario inicial', notes: '', createdAt: now() },
      { id: 2, productId: 3, userId: 1, type: 'ENTRADA', quantity: 4, reason: 'Inventario inicial', notes: '', createdAt: now() }
    ],
    carts: [],
    orders: [],
    payments: [],
    invoices: [],
    notifications: []
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

module.exports = { DB_PATH, initDb, loadDb, saveDb, nextId, now };
