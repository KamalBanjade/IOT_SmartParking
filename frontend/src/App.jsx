import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ParkingProvider } from './context/ParkingContext';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from 'react-hot-toast';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import MonitorPage from './pages/MonitorPage';
import AdminPage from './pages/AdminPage';
import DisplayPage from './pages/DisplayPage';
import MemberPage from './pages/MemberPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentFailurePage from './pages/PaymentFailurePage';
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
      <ThemeProvider>
        <ParkingProvider>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<OperatorForgotPasswordPage />} />
            <Route path="/reset-password" element={<OperatorResetPasswordPage />} />
            <Route path="/login/customer" element={<PortalLoginPage />} />
            <Route path="/portal/setup" element={<PortalSetupPage />} />
            <Route path="/portal/forgot-password" element={<PortalForgotPasswordPage />} />
            <Route path="/portal/reset-password" element={<PortalResetPasswordPage />} />
            <Route path="/payment/success" element={<PaymentSuccessPage />} />
            <Route path="/payment/failure" element={<PaymentFailurePage />} />
            <Route path="/display" element={<DisplayPage />} />

            {/* Operator Protected */}
            <Route path="/" element={<OperatorRoute><DashboardPage /></OperatorRoute>} />
            <Route path="/monitor" element={<OperatorRoute><MonitorPage /></OperatorRoute>} />
            <Route path="/members" element={<OperatorRoute><MembersListPage /></OperatorRoute>} />
            <Route path="/member/:id" element={<OperatorRoute><MemberPage /></OperatorRoute>} />

            {/* Admin Protected */}
            <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />

            {/* Customer Portal */}
            <Route path="/portal/dashboard" element={<CustomerRoute><PortalDashboardPage /></CustomerRoute>} />
            <Route path="/portal/sessions" element={<CustomerRoute><PortalSessionsPage /></CustomerRoute>} />
          </Routes>

          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: 'var(--bg-elevated)',
                color: 'var(--text-primary)',
                border: '1px solid var(--bg-border)',
                fontSize: '13px',
                borderRadius: '12px',
              }
            }}
          />
        </ParkingProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
