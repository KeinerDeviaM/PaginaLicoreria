# Licorería Full Stack

Proyecto full stack listo para correr con:

- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **Roles:** ADMIN, TRABAJADOR, CLIENTE
- **Funciones:** inventario, carrito, pedidos, pagos, facturas y notificaciones al admin

## Credenciales iniciales

- **Admin**
  - correo: `admin@licoreria.com`
  - password: `12345678`

- **Trabajador**
  - correo: `trabajador@licoreria.com`
  - password: `12345678`

- **Cliente demo**
  - correo: `cliente@licoreria.com`
  - password: `12345678`

## Cómo correr

### Backend
```bash
cd backend
npm install
npm run dev
```

Backend en: `http://localhost:8080`

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend en: `http://localhost:5173`

## Flujo principal

### Cliente
- registrarse / iniciar sesión
- ver catálogo
- ver detalle
- agregar al carrito
- checkout
- registrar pago
- ver pedidos
- ver facturas

### Trabajador
- dashboard
- productos
- movimientos
- alertas
- pedidos
- aprobar / rechazar pagos
- generar facturas

### Admin
- todo lo del trabajador
- categorías
- marcas
- proveedores
- notificaciones de compras, pagos y facturas
