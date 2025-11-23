import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// Components
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import UserManagement from './pages/UserManagement';
import UserDetail from './pages/UserDetail';
import RoleManagement from './pages/RoleManagement';
import CreateOrganizer from './pages/CreateOrganizer';
import Events from './organizer/events';
import Home from './pages/HomePage';

// Styles
import './index.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <div className="app">
            <Layout>
              <Routes>

                {/* -------------------- PUBLIC ROUTES -------------------- */}
                <Route path="/home" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* -------------------- PROTECTED ROUTES -------------------- */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />

                {/* -------------------- ADMIN ROUTES -------------------- */}
                <Route
                  path="/admin/users"
                  element={
                    <ProtectedRoute requiredRole="administrateur">
                      <UserManagement />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin/users/:id"
                  element={
                    <ProtectedRoute requiredRole="administrateur">
                      <UserDetail />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin/roles"
                  element={
                    <ProtectedRoute requiredRole="administrateur">
                      <RoleManagement />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin/organizers/create"
                  element={
                    <ProtectedRoute requiredRole="administrateur">
                      <CreateOrganizer />
                    </ProtectedRoute>
                  }
                />

                {/* -------------------- OTHER PROTECTED SERVICES -------------------- */}
                <Route
                  path="/events"
                  element={
                    <ProtectedRoute>
                      <Events />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/tickets"
                  element={
                    <ProtectedRoute>
                      <div className="placeholder-page">
                        <h1>Mes Billets</h1>
                        <p>Page en construction - Ticket Inventory Service</p>
                      </div>
                    </ProtectedRoute>
                  }
                />

                {/* -------------------- DEFAULT ROUTE → HOME -------------------- */}
                <Route path="/" element={<Navigate to="/home" replace />} />

                {/* -------------------- 404 ROUTE -------------------- */}
                <Route 
                  path="*"
                  element={
                    <div className="not-found-page">
                      <h1>404</h1>
                      <p>Page non trouvée</p>
                      <a href="/dashboard">Retour au tableau de bord</a>
                    </div>
                  }
                />
              </Routes>
            </Layout>
          </div>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
