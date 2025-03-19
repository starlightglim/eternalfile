import React from 'react';
import { Link } from 'react-router-dom';
import { AlertOctagon, Home } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      {/* Vintage macOS-style error window */}
      <div className="bg-white rounded-md shadow-lg overflow-hidden border border-gray-300 max-w-md w-full">
        {/* Window title bar */}
        <div className="bg-gray-200 border-b border-gray-300 p-2 flex items-center">
          <div className="flex space-x-2 ml-2">
            <div className="h-3 w-3 rounded-full bg-red-500"></div>
            <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
            <div className="h-3 w-3 rounded-full bg-green-500"></div>
          </div>
          <div className="ml-4 text-sm font-medium">Error</div>
        </div>
        
        {/* Error content */}
        <div className="p-6 text-center">
          <div className="mb-4">
            <AlertOctagon size={64} className="text-red-500 mx-auto" />
          </div>
          
          <h1 className="text-2xl font-bold mb-2">404 - Page Not Found</h1>
          <p className="text-gray-600 mb-6">
            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>
          
          {/* Vintage macOS-style button */}
          <Link 
            to="/"
            className="inline-flex items-center bg-gray-200 border border-gray-400 rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            <Home size={16} className="mr-2" />
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound; 