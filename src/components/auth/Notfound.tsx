// src/pages/NotFound.tsx

import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-DARK-100">
      <h1 className="text-6xl font-bold text-DARK-800 mb-4">404</h1>
      <p className="text-xl text-DARK-600 mb-6">Oops! The page you're looking for doesn't exist.</p>
      <Link
        to="/"
        className="px-6 py-3 bg-BRAND-600 text-white rounded-lg shadow-md hover:bg-BRAND-500 transition-colors duration-300"
      >
        Go back to Home
      </Link>
    </div>
  );
};

export default NotFound;
