import React from 'react';
import { useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';

// Icons
import { Menu, Search, Bell, Upload } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { openModal } from '../../store/slices/uiSlice';

const Header = ({ onToggleSidebar }) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const { notifications } = useSelector(state => state.ui);
  
  // Get current page title based on route
  const getPageTitle = () => {
    const path = location.pathname;
    
    if (path === '/dashboard') {
      return 'Dashboard';
    } else if (path.startsWith('/boards/')) {
      return 'Board View';
    } else if (path.startsWith('/folders/')) {
      return 'Folder View';
    } else if (path === '/profile') {
      return 'Profile';
    } else if (path === '/settings') {
      return 'Settings';
    }
    
    return 'Spatial Image Board';
  };
  
  const handleUploadClick = () => {
    dispatch(openModal({ modal: 'uploadImage' }));
  };
  
  return (
    <header className="bg-white border-b border-gray-300 p-3 flex items-center">
      <button 
        onClick={onToggleSidebar}
        className="p-1 rounded hover:bg-gray-200 mr-3"
      >
        <Menu size={20} />
      </button>
      
      <h1 className="text-lg font-semibold">{getPageTitle()}</h1>
      
      <div className="ml-auto flex items-center space-x-3">
        {/* Search */}
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search..." 
            className="pl-9 pr-4 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
        
        {/* Upload button */}
        <button 
          onClick={handleUploadClick}
          className="flex items-center bg-blue-500 hover:bg-blue-600 text-white rounded-md px-3 py-1 text-sm"
        >
          <Upload size={16} className="mr-1" />
          Upload
        </button>
        
        {/* Notifications */}
        <div className="relative">
          <button className="p-1 rounded hover:bg-gray-200 relative">
            <Bell size={20} />
            {notifications.unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {notifications.unreadCount > 9 ? '9+' : notifications.unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

Header.propTypes = {
  onToggleSidebar: PropTypes.func.isRequired
};

export default Header; 