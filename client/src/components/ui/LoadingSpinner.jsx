import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="relative">
        {/* Vintage Mac-style spinner */}
        <div className="w-12 h-12 border-4 border-gray-300 rounded-full"></div>
        <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-blue-500 rounded-full animate-spin"></div>
        <div className="absolute top-0 left-0 w-12 h-12 flex items-center justify-center">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
        </div>
      </div>
      <div className="ml-4 text-gray-600 font-medium">Loading...</div>
    </div>
  );
};

export default LoadingSpinner; 