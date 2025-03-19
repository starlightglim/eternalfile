import React from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Left side - Vintage macOS-inspired sidebar */}
      <div className="hidden md:flex md:w-1/2 bg-gray-200 flex-col">
        <div className="flex items-center bg-gray-300 border-b border-gray-400 p-2">
          <div className="flex space-x-2 ml-2">
            <div className="h-3 w-3 rounded-full bg-red-500"></div>
            <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
            <div className="h-3 w-3 rounded-full bg-green-500"></div>
          </div>
          <div className="ml-4 font-bold text-sm">Spatial Image Board</div>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Spatial Image Board</h1>
            <p className="text-gray-600 text-lg">
              A vintage macOS-inspired platform for arranging and combining images with AI
            </p>
          </div>
          
          <div className="w-full max-w-md bg-white rounded-lg shadow-lg overflow-hidden border border-gray-300">
            <div className="p-1 bg-gray-200 border-b border-gray-300 flex items-center">
              <div className="flex space-x-2 ml-2">
                <div className="h-2 w-2 rounded-full bg-red-500"></div>
                <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
              </div>
              <div className="ml-2 text-xs">Preview.app</div>
            </div>
            <div className="p-4 flex justify-center">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-blue-100 rounded-md h-24 w-24 shadow-sm transform rotate-3"></div>
                <div className="bg-green-100 rounded-md h-24 w-24 shadow-sm transform -rotate-2"></div>
                <div className="bg-yellow-100 rounded-md h-24 w-24 shadow-sm transform -rotate-3"></div>
                <div className="bg-purple-100 rounded-md h-24 w-24 shadow-sm transform rotate-2"></div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 text-sm text-gray-500">
            <p>© 2023 Spatial Image Board. All rights reserved.</p>
          </div>
        </div>
      </div>
      
      {/* Right side - Auth forms */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout; 