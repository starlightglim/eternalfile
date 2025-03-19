import React from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle } from 'lucide-react';

const ErrorMessage = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="bg-red-100 border border-red-300 rounded-md p-6 max-w-md text-center">
        <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
        <p className="text-red-700">{message || 'An unexpected error occurred'}</p>
        
        {/* Vintage Mac-style button */}
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 bg-gray-200 border border-gray-400 rounded-md px-4 py-1 text-sm font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          Retry
        </button>
      </div>
    </div>
  );
};

ErrorMessage.propTypes = {
  message: PropTypes.string
};

export default ErrorMessage; 