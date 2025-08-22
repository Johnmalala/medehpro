import React, { useState } from 'react';
import { Eye, EyeOff, HardHat, KeyRound } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const { success, error: authError } = await login(email, password);
    
    if (!success) {
      setError(authError?.message || 'Invalid login credentials. Please try again.');
    }
    
    setIsLoading(false);
  };
  
  const demoUsers = [
    { email: 'modest@madehhardware.com', password: '1234' },
    { email: 'grace@madehhardware.com', password: '1234' },
  ];

  const handleQuickAccess = (user: typeof demoUsers[0]) => {
    setEmail(user.email);
    setPassword(user.password);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-500 rounded-xl flex items-center justify-center mb-4">
            <HardHat className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Madeh Hardware
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Management Platform
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white pr-12"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm shadow-lg rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <KeyRound className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            <h4 className="font-semibold text-gray-800 dark:text-white">Quick Access</h4>
          </div>
          <div className="space-y-3">
            {demoUsers.map((user) => (
              <div key={user.email} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{user.email}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Password: {user.password}</p>
                </div>
                <button
                  onClick={() => handleQuickAccess(user)}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Use
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginForm;
