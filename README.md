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

## Subir fotos con Cloudinary

1. Crea una cuenta en Cloudinary e ingresa al panel.
2. Copia tu `Cloud name`.
3. En Cloudinary ve a `Settings` -> `Upload` -> `Upload presets`.
4. Crea un preset nuevo de tipo `Unsigned`.
5. Asigna un nombre claro, por ejemplo `productos_unsigned`.
6. Si quieres ordenar las fotos por carpeta, define una carpeta como `licoreria/productos`.
7. En este proyecto crea `frontend/.env` usando como base `frontend/.env.example`.
8. Completa las variables:

```env
VITE_CLOUDINARY_CLOUD_NAME=tu_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=productos_unsigned
VITE_CLOUDINARY_FOLDER=licoreria/productos
```

9. Reinicia el frontend con `npm run dev`.
10. En el panel de productos del admin selecciona una imagen y pulsa `Subir imagen a Cloudinary`.
11. Cuando termine la subida, la URL quedarÃ¡ automÃ¡ticamente en `URL final de imagen`.
12. Guarda el producto.

Notas:
- La app usa subida directa desde el frontend con un `unsigned upload preset`.
- Lo que se guarda en la base del proyecto es la `secure_url` devuelta por Cloudinary.
- Si mÃ¡s adelante quieres mayor seguridad, se puede migrar a subida firmada desde el backend.

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
