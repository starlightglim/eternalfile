import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getCurrentUser, setMockAuth } from './store/slices/authSlice';
import socketService from './services/socketService';

// Layout components
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import BoardView from './pages/BoardView';
import FolderView from './pages/FolderView';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

// Components
import ProtectedRoute from './components/auth/ProtectedRoute';
import Toast from './components/ui/Toast';

// Development mode flag
const DEV_MODE = process.env.NODE_ENV === 'development';

// Mock data for development
const MOCK_USER = {
  id: 'mock-user-id',
  username: '@demouser',
  email: 'demo@example.com',
  profileGif: '/default-profile.gif',
  role: 'user'
};

const App = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, token, user } = useSelector(state => state.auth);
  const { open: toastOpen, message, type, duration } = useSelector(state => state.ui.toast);
  
  // DEVELOPMENT MODE: Set mock user in Redux store
  useEffect(() => {
    if (DEV_MODE && !isAuthenticated) {
      console.log('Development mode: Setting mock authentication');
      dispatch(setMockAuth({
        user: MOCK_USER,
        token: 'mock-token'
      }));
    } else if (token && !isAuthenticated) {
      // For production: check if user is authenticated on app load
      dispatch(getCurrentUser());
    }
  }, [dispatch, isAuthenticated, token]);
  
  // Initialize socket connection when authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      socketService.initSocket(token);
      
      return () => {
        socketService.disconnectSocket();
      };
    }
  }, [isAuthenticated, token]);
  
  return (
    <Router>
      <Routes>
        {/* Auth routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
          <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" />} />
        </Route>
        
        {/* Protected routes */}
        <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/boards/:boardId" element={<BoardView />} />
            <Route path="/folders/:folderId" element={<FolderView />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>
        
        {/* 404 route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      
      {/* Global toast notification */}
      <Toast 
        open={toastOpen}
        message={message}
        type={type}
        duration={duration}
      />
    </Router>
  );
};

export default App; 