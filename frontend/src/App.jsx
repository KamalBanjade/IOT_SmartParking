import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ParkingProvider } from './context/ParkingContext';
import { Toaster } from 'react-hot-toast';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';
import DisplayPage from './pages/DisplayPage';
import RegisterPage from './pages/RegisterPage';
import MemberPage from './pages/MemberPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentFailurePage from './pages/PaymentFailurePage';
import AnalyticsPage from './pages/AnalyticsPage';
import OperatorForgotPasswordPage from './pages/OperatorForgotPasswordPage';
import OperatorResetPasswordPage from './pages/OperatorResetPasswordPage';
import MembersListPage from './pages/MembersListPage';

import PortalLoginPage from './pages/portal/PortalLoginPage';
import PortalSetupPage from './pages/portal/PortalSetupPage';
import PortalDashboardPage from './pages/portal/PortalDashboardPage';
import PortalSessionsPage from './pages/portal/PortalSessionsPage';
import PortalForgotPasswordPage from './pages/portal/PortalForgotPasswordPage';
import PortalResetPasswordPage from './pages/portal/PortalResetPasswordPage';

import OperatorRoute from './components/shared/OperatorRoute';
import AdminRoute from './components/shared/AdminRoute';
import CustomerRoute from './components/shared/CustomerRoute';

function App() {
  return (
    <BrowserRouter>
      <ParkingProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<OperatorForgotPasswordPage />} />
          <Route path="/reset-password" element={<OperatorResetPasswordPage />} />
          
          <Route path="/portal/login" element={<PortalLoginPage />} />
          <Route path="/portal/setup" element={<PortalSetupPage />} />
          <Route path="/portal/forgot-password" element={<PortalForgotPasswordPage />} />
          <Route path="/portal/reset-password" element={<PortalResetPasswordPage />} />
          
          <Route path="/payment/success" element={<PaymentSuccessPage />} />
          <Route path="/payment/failure" element={<PaymentFailurePage />} />
          <Route path="/display" element={<DisplayPage />} />

          {/* Operator Protected Routes */}
          <Route path="/" element={<OperatorRoute><DashboardPage /></OperatorRoute>} />
          <Route path="/register" element={<OperatorRoute><RegisterPage /></OperatorRoute>} />
          <Route path="/members" element={<OperatorRoute><MembersListPage /></OperatorRoute>} />
          <Route path="/member/:id" element={<OperatorRoute><MemberPage /></OperatorRoute>} />

          {/* Admin Protected Routes */}
          <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
          <Route path="/analytics" element={<AdminRoute><AnalyticsPage /></AdminRoute>} />

          {/* Customer Portal Protected Routes */}
          <Route path="/portal/dashboard" element={<CustomerRoute><PortalDashboardPage /></CustomerRoute>} />
          <Route path="/portal/sessions" element={<CustomerRoute><PortalSessionsPage /></CustomerRoute>} />
        </Routes>
        <Toaster 
          position="bottom-right" 
          toastOptions={{
            style: {
              background: '#1a1a1a',
              color: '#f5f5f5',
              border: '1px solid #222222',
              fontSize: '13px'
            }
          }}
        />
      </ParkingProvider>
    </BrowserRouter>
  );
}

export default App;
