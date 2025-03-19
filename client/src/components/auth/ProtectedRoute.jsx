import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import PropTypes from 'prop-types';

const ProtectedRoute = ({ isAuthenticated }) => {
  // DEVELOPMENT MODE: Always allow access by returning true
  // In a production environment, you would use the commented code below
  
  // if (!isAuthenticated) {
  //   // Redirect to login if not authenticated
  //   return <Navigate to="/login" replace />;
  // }
  
  // Always render the child routes (bypass authentication)
  return <Outlet />;
};

ProtectedRoute.propTypes = {
  isAuthenticated: PropTypes.bool.isRequired
};

export default ProtectedRoute; 