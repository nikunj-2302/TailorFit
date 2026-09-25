import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Layout } from '../components/layout/Layout';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

// Pages
import { Login } from '../pages/Login';
import { Dashboard } from '../pages/Dashboard';
import { OrganizationsList } from '../pages/Organizations/OrganizationsList';
import { BranchesList } from '../pages/Branches/BranchesList';
import { PersonsList } from '../pages/Persons/PersonsList';
import { GarmentTypesList } from '../pages/Garments/GarmentTypesList';
import { MeasurementFieldsList } from '../pages/MeasurementFields/MeasurementFieldsList';
import { MeasurementTemplatesList } from '../pages/MeasurementTemplates/MeasurementTemplatesList';
import { MeasurementsList } from '../pages/Measurements/MeasurementsList';
import { AddMeasurementPage } from '../pages/Measurements/AddMeasurementPage';
import { OrdersList } from '../pages/Orders/OrdersList';
import { ReportsPage } from '../pages/Reports/ReportsPage';
import { UsersList } from '../pages/Settings/UsersList';
import { AuditLogsPage } from '../pages/Settings/AuditLogsPage';
import { NotFound } from '../pages/NotFound';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner text="Authenticating user..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user.role !== 'super_admin' && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <Login />}
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />

        {/* Organizations & Branches */}
        <Route path="organizations" element={<OrganizationsList />} />
        <Route path="branches" element={<BranchesList />} />

        {/* Persons */}
        <Route path="persons" element={<PersonsList />} />

        {/* Measurements Engine */}
        <Route path="measurements" element={<MeasurementsList />} />
        <Route
          path="measurements/new"
          element={
            <ProtectedRoute allowedRoles={['admin', 'measurement_user']}>
              <AddMeasurementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="measurement-templates"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <MeasurementTemplatesList />
            </ProtectedRoute>
          }
        />
        <Route
          path="measurement-fields"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <MeasurementFieldsList />
            </ProtectedRoute>
          }
        />

        {/* Garments */}
        <Route path="garments" element={<GarmentTypesList />} />

        {/* Orders & Production */}
        <Route path="orders" element={<OrdersList />} />

        {/* Intelligence Reports */}
        <Route path="reports" element={<ReportsPage />} />

        {/* Settings & Admin */}
        <Route
          path="settings/users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UsersList />
            </ProtectedRoute>
          }
        />
        <Route
          path="settings/audit-logs"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AuditLogsPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
