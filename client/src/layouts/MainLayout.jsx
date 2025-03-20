import React from 'react';
import { Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toggleSidebar } from '../store/slices/uiSlice';
import { logout } from '../store/slices/authSlice';

// Components
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';

// Icons
import { User, Settings, LogOut } from 'lucide-react';

const MainLayout = () => {
  const dispatch = useDispatch();
  const { sidebarOpen } = useSelector(state => state.ui);
  const { user } = useSelector(state => state.auth);
  
  const handleToggleSidebar = () => {
    dispatch(toggleSidebar());
  };
  
  const handleLogout = () => {
    dispatch(logout());
  };
  
  return (
    <div className="flex flex-col h-screen bg-gray-100 overflow-hidden">
      {/* Vintage macOS Menu Bar */}
      <div className="flex items-center bg-gray-200 border-b border-gray-300 p-1 text-sm">
        <div className="flex space-x-2 ml-2">
          <div className="h-3 w-3 rounded-full bg-red-500 cursor-pointer hover:bg-red-600"></div>
          <div className="h-3 w-3 rounded-full bg-yellow-500 cursor-pointer hover:bg-yellow-600"></div>
          <div className="h-3 w-3 rounded-full bg-green-500 cursor-pointer hover:bg-green-600"></div>
        </div>
        <div className="flex mx-4 space-x-4">
          <div className="flex items-center font-bold">Eternalfile</div>
          <div className="flex items-center cursor-pointer hover:bg-gray-300 px-2 py-0.5 rounded">File</div>
          <div className="flex items-center cursor-pointer hover:bg-gray-300 px-2 py-0.5 rounded">Edit</div>
          <div className="flex items-center cursor-pointer hover:bg-gray-300 px-2 py-0.5 rounded">View</div>
          <div className="flex items-center cursor-pointer hover:bg-gray-300 px-2 py-0.5 rounded">Help</div>
        </div>
        <div className="ml-auto flex items-center space-x-2 mr-2">
          <div className="relative group">
            <div className="flex items-center cursor-pointer hover:bg-gray-300 px-2 py-0.5 rounded">
              <User size={16} className="mr-1" />
              <span>{user?.username || '@user'}</span>
            </div>
            
            {/* Dropdown menu */}
            <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 hidden group-hover:block z-10">
              <div className="py-1">
                <a href="/profile" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <User size={16} className="mr-2" />
                  Profile
                </a>
                <a href="/settings" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <Settings size={16} className="mr-2" />
                  Settings
                </a>
                <button 
                  onClick={handleLogout}
                  className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  <LogOut size={16} className="mr-2" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div 
          className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-gray-200 border-r border-gray-300 transition-all duration-300 overflow-hidden`}
        >
          <Sidebar />
        </div>
        
        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <Header onToggleSidebar={handleToggleSidebar} />
          
          {/* Main Content */}
          <div className="flex-1 overflow-auto p-4">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainLayout; 