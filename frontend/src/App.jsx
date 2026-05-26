import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { InternalLayout, PublicLayout } from './components/AppLayout';
import MasterCrudPage from './components/MasterCrudPage';
import ProtectedRoute from './components/ProtectedRoute';
import AdminWorkersPage from './pages/AdminWorkersPage';
import AlertsPage from './pages/AlertsPage';
import CartPage from './pages/CartPage';
import CatalogPage from './pages/CatalogPage';
import CheckoutPage from './pages/CheckoutPage';
import HomePage from './pages/HomePage';
import InternalDashboardPage from './pages/InternalDashboardPage';
import InvoicesPage from './pages/InvoicesPage';
import LoginPage from './pages/LoginPage';
import MovementsPage from './pages/MovementsPage';
import MyInvoicesPage from './pages/MyInvoicesPage';
import MyOrdersPage from './pages/MyOrdersPage';
import NotificationsPage from './pages/NotificationsPage';
import OrdersPage from './pages/OrdersPage';
import PaymentPage from './pages/PaymentPage';
import PaymentsPage from './pages/PaymentsPage';
import ProductPage from './pages/ProductPage';
import ProductsPage from './pages/ProductsPage';
import ProfilePage from './pages/ProfilePage';
import RegisterPage from './pages/RegisterPage';

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/shop/products" element={<CatalogPage />} />
        <Route path="/shop/products/:id" element={<ProductPage />} />
        <Route
          path="/cart"
          element={
            <ProtectedRoute roles={['CLIENTE']}>
              <CartPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute roles={['CLIENTE']}>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pay/:orderId"
          element={
            <ProtectedRoute roles={['CLIENTE']}>
              <PaymentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute roles={['CLIENTE']}>
              <MyOrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/invoices"
          element={
            <ProtectedRoute roles={['CLIENTE']}>
              <MyInvoicesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute roles={['CLIENTE', 'ADMIN', 'TRABAJADOR']}>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route path="/perfil" element={<Navigate to="/profile" replace />} />
      </Route>

      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['ADMIN']}>
            <InternalLayout role="ADMIN" />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<InternalDashboardPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
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
                { name: 'city', label: 'Ciudad' }
              ]}
            />
          }
        />
        <Route path="workers" element={<AdminWorkersPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="movements" element={<MovementsPage />} />
        <Route path="alerts" element={<AlertsPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="invoices" element={<InvoicesPage />} />
      </Route>

      <Route
        path="/worker"
        element={
          <ProtectedRoute roles={['TRABAJADOR']}>
            <InternalLayout role="TRABAJADOR" />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<InternalDashboardPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="movements" element={<MovementsPage />} />
        <Route path="alerts" element={<AlertsPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="invoices" element={<InvoicesPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

import ChatIA from './ChatIA';

<ChatIA />
