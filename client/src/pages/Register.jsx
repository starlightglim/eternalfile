import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { register, clearError } from '../store/slices/authSlice';

// Icons
import { User, Mail, Lock, AlertCircle } from 'lucide-react';

const Register = () => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector(state => state.auth);
  
  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [formErrors, setFormErrors] = useState({});
  
  // Clear errors when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);
  
  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear field error when user types
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };
  
  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!formData.username) {
      errors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }
    
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Remove confirmPassword before sending to API
      const { confirmPassword, ...registerData } = formData;
      dispatch(register(registerData));
    }
  };
  
  return (
    <div className="w-full max-w-md">
      {/* Vintage macOS-style window */}
      <div className="bg-white rounded-md shadow-lg overflow-hidden border border-gray-300">
        {/* Window title bar */}
        <div className="bg-gray-200 border-b border-gray-300 p-2 flex items-center">
          <div className="flex space-x-2 ml-2">
            <div className="h-3 w-3 rounded-full bg-red-500"></div>
            <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
            <div className="h-3 w-3 rounded-full bg-green-500"></div>
          </div>
          <div className="ml-4 text-sm font-medium">Register</div>
        </div>
        
        {/* Form content */}
        <div className="p-6">
          <h2 className="text-2xl font-bold text-center mb-6">Create Account</h2>
          
          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-md flex items-start">
              <AlertCircle size={18} className="text-red-500 mr-2 mt-0.5" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            {/* Username field */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="username">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={16} className="text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-3 py-2 border ${formErrors.username ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="@username"
                />
              </div>
              {formErrors.username && (
                <p className="mt-1 text-red-500 text-xs">{formErrors.username}</p>
              )}
            </div>
            
            {/* Email field */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="email">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={16} className="text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-3 py-2 border ${formErrors.email ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="you@example.com"
                />
              </div>
              {formErrors.email && (
                <p className="mt-1 text-red-500 text-xs">{formErrors.email}</p>
              )}
            </div>
            
            {/* Password field */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={16} className="text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-3 py-2 border ${formErrors.password ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="••••••••"
                />
              </div>
              {formErrors.password && (
                <p className="mt-1 text-red-500 text-xs">{formErrors.password}</p>
              )}
            </div>
            
            {/* Confirm Password field */}
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={16} className="text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-3 py-2 border ${formErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="••••••••"
                />
              </div>
              {formErrors.confirmPassword && (
                <p className="mt-1 text-red-500 text-xs">{formErrors.confirmPassword}</p>
              )}
            </div>
            
            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Register'}
            </button>
          </form>
          
          {/* Login link */}
          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">Already have an account?</span>
            <Link to="/login" className="ml-1 text-blue-600 hover:text-blue-800">
              Log In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register; 