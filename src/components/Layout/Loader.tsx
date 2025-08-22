import React from 'react';
import { HardHat } from 'lucide-react';

const Loader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
      <div className="relative flex items-center justify-center w-24 h-24">
        <div className="absolute w-full h-full border-4 border-blue-200 rounded-full"></div>
        <div className="absolute w-full h-full border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <HardHat className="w-10 h-10 text-blue-500" />
      </div>
      <p className="mt-4 text-lg font-medium text-gray-700 dark:text-gray-300">
        Loading...
      </p>
    </div>
  );
};

export default Loader;
