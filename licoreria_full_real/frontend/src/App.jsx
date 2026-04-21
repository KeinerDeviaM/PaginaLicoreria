import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { PublicLayout, InternalLayout } from './components/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import MasterCrudPage from './components/MasterCrudPage';
import { ToastProvider } from './toast';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import PaymentPage from './pages/PaymentPage';
import MyOrdersPage from './pages/MyOrdersPage';
import MyInvoicesPage from './pages/MyInvoicesPage';
import InternalDashboardPage from './pages/InternalDashboardPage';
import ProductsPage from './pages/ProductsPage';
import MovementsPage from './pages/MovementsPage';
import AlertsPage from './pages/AlertsPage';
import OrdersPage from './pages/OrdersPage';
import PaymentsPage from './pages/PaymentsPage';
import InvoicesPage from './pages/InvoicesPage';
import NotificationsPage from './pages/NotificationsPage';
import AdminWorkersPage from './pages/AdminWorkersPage';
import UsersPage from './pages/UsersPage';
import ProfilePage from './pages/ProfilePage';

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop/products" element={<CatalogPage />} />
          <Route path="/shop/products/:id" element={<ProductPage />} />
          <Route path="/cart" element={<ProtectedRoute roles={['CLIENTE']}><CartPage /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute roles={['CLIENTE']}><CheckoutPage /></ProtectedRoute>} />
          <Route path="/pay/:orderId" element={<ProtectedRoute roles={['CLIENTE']}><PaymentPage /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute roles={['CLIENTE']}><MyOrdersPage /></ProtectedRoute>} />
          <Route path="/invoices" element={<ProtectedRoute roles={['CLIENTE']}><MyInvoicesPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute roles={['CLIENTE', 'ADMIN', 'TRABAJADOR']}><ProfilePage /></ProtectedRoute>} />
        </Route>

        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route path="/admin" element={<ProtectedRoute roles={['ADMIN']}><InternalLayout role="ADMIN" /></ProtectedRoute>}>
          <Route path="dashboard" element={<InternalDashboardPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="workers" element={<AdminWorkersPage />} />
          <Route
            path="categories"
            element={
              <MasterCrudPage
                endpoint="/categories"
                title="Categorías"
                fields={[
                  { name: 'name', label: 'Nombre' },
                  { name: 'description', label: 'Descripción', type: 'textarea' }
                ]}
              />
            }
          />
          <Route
            path="brands"
            element={
              <MasterCrudPage
                endpoint="/brands"
                title="Marcas"
                fields={[
                  { name: 'name', label: 'Nombre' },
                  { name: 'description', label: 'Descripción', type: 'textarea' }
                ]}
              />
            }
          />
          <Route
            path="suppliers"
            element={
              <MasterCrudPage
                endpoint="/suppliers"
                title="Proveedores"
                fields={[
                  { name: 'name', label: 'Nombre' },
                  { name: 'contactName', label: 'Contacto' },
                  { name: 'email', label: 'Correo' },
                  { name: 'phone', label: 'Teléfono' },
                  { name: 'address', label: 'Dirección' },
                  { name: 'city', label: 'Ciudad' },
                  { name: 'shippingCostBase', label: 'Costo envío base' },
                  { name: 'packagingCostBase', label: 'Costo empaque base' }
                ]}
              />
            }
          />
          <Route path="products" element={<ProductsPage />} />
          <Route path="movements" element={<MovementsPage />} />
          <Route path="alerts" element={<AlertsPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="invoices" element={<InvoicesPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>

        <Route path="/worker" element={<ProtectedRoute roles={['TRABAJADOR']}><InternalLayout role="TRABAJADOR" /></ProtectedRoute>}>
          <Route path="dashboard" element={<InternalDashboardPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="movements" element={<MovementsPage />} />
          <Route path="alerts" element={<AlertsPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="invoices" element={<InvoicesPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ToastProvider>
  );
}
