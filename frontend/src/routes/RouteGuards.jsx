import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import {
  clearAdminSession,
  hasAdminSession,
  hasCustomerSession,
} from '../utils/authStorage';

export const AdminOnlyRoute = () => {
  const location = useLocation();
  const adminSession = hasAdminSession();
  const customerSession = hasCustomerSession();

  if (!adminSession) {
    if (customerSession) {
      return <Navigate to="/" replace state={{ authMessage: 'Customer accounts cannot access the admin area.' }} />;
    }

    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
};

export const AdminGuestRoute = () => {
  if (hasAdminSession()) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Outlet />;
};

export const CustomerOnlyRoute = () => {
  const location = useLocation();

  if (hasAdminSession()) {
    clearAdminSession();
    return (
      <Navigate
        to="/login"
        replace
        state={{
          authMessage: 'Please log in with a customer account to continue.',
          redirectTo: location.pathname,
        }}
      />
    );
  }

  if (!hasCustomerSession()) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          authMessage: 'Please log in with a customer account to continue.',
          redirectTo: location.pathname,
        }}
      />
    );
  }

  return <Outlet />;
};

export const CustomerGuestRoute = () => {
  if (hasAdminSession()) {
    clearAdminSession();
  }

  if (hasCustomerSession()) {
    return <Navigate to="/my-orders" replace />;
  }

  return <Outlet />;
};
