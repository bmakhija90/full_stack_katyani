import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/common/AdminRoute';
import Header from './components/common/Header';
import Footer from './components/common/Footer';

// Public Pages
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ProductList from './components/products/ProductList';
import ProductDetail from './components/products/ProductDetail';

// Protected Pages
import Profile from './components/user/Profile';
import Cart from './components/cart/Cart';
import Checkout from './components/orders/Checkout';

// Admin Pages
import Dashboard from './components/admin/Dashboard';
import AdminProducts from './components/admin/AdminProducts';
import AdminOrders from './components/admin/AdminOrders';
import OrderSuccess from './components/orders/OrderSuccess';
import OrderDetailsPage from './components/orders/OrderDetailsPage';
import OrderDetailsModal from './components/orders/OrderDetailsModal';

import './styles/App.css';

function HomePage() {
  return (
    <div className="text-center py-5">
      <h1 className="display-4 mb-4">Welcome to E-Commerce Store</h1>
      <p className="lead mb-4">
        Discover amazing products at great prices. Shop with confidence!
      </p>
      <a href="/products" className="btn btn-primary btn-lg">
        Start Shopping
      </a>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <div className="d-flex flex-column min-vh-100">
          <Header />
          <main className="flex-grow-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<ProductList />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/products" element={<ProductList />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/categories" element={<ProductList />} />
              <Route path="/order-success/:orderId" element={<OrderSuccess />} />
              <Route path="/order/:orderId" element={<OrderDetailsPage />} />
               <Route path="/my-orders/:orderId" element={<OrderDetailsPage />} />
              {/* Protected Routes */}
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/cart" element={
                <ProtectedRoute>
                  <Cart />
                </ProtectedRoute>
              } />
              <Route path="/checkout" element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              } />
              <Route path="/orders" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />

              {/* Admin Routes */}
              <Route path="/admin" element={
                <AdminRoute>
                  <Dashboard />
                </AdminRoute>
              } />
              <Route path="/admin/products" element={
                <AdminRoute>
                  <AdminProducts />
                </AdminRoute>
              } />
              <Route path="/admin/dashboard" element={
                <AdminRoute>
                  <Dashboard />
                </AdminRoute>
              } />
              <Route path="/admin/orders" element={
                <AdminRoute>
                    <AdminOrders />
                </AdminRoute>
                } />

              {/* Catch all - redirect to home */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;