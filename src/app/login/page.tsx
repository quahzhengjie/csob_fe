// =================================================================================
// UPDATE src/app/login/page.tsx - Forgot Password as Coming Soon
// =================================================================================
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import { Eye, EyeOff, Lock, User, AlertCircle, Loader2, KeyRound, Info } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  // Load saved username if "remember me" was checked
  useEffect(() => {
    const savedUsername = localStorage.getItem('rememberedUsername');
    if (savedUsername) {
      setUsername(savedUsername);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Basic validation
    if (!username.trim()) {
      setError('Please enter your username');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setIsLoading(true);

    try {
      await login({ username: username.trim(), password });
      
      // Save username if remember me is checked
      if (rememberMe) {
        localStorage.setItem('rememberedUsername', username.trim());
      } else {
        localStorage.removeItem('rememberedUsername');
      }
      
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid username or password');
      // Clear password on error
      setPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Left side - Branding (unchanged) */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-600 dark:bg-blue-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-700 dark:from-blue-800 dark:to-indigo-900" />
        <div className="absolute inset-0 bg-black/10" />
        
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        
        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          <div className="mb-8">
            <div className="relative h-16 w-64 mb-8">
              <Image
                src="/images/logos/Bangkok_Bank_2023_darkmode.svg"
                alt="Bangkok Bank Logo"
                fill
                className="object-contain object-left filter brightness-0 invert"
                priority
              />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4">KYC Document Manager</h1>
          <p className="text-xl text-blue-100 mb-8">
            Streamline your Know Your Customer documentation process with our comprehensive management portal.
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold">Secure & Compliant</p>
                <p className="text-sm text-blue-100">Bank-grade security for all your documents</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold">Role-Based Access</p>
                <p className="text-sm text-blue-100">Granular permissions for your team</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            {/* Mobile Logo */}
            <div className="lg:hidden mb-8">
              <div className="relative h-12 w-48 mx-auto">
                <Image
                  src="/images/logos/Bangkok_Bank_2023_lightmode.png"
                  alt="Bangkok Bank Logo"
                  fill
                  className="object-contain dark:hidden"
                  priority
                />
                <Image
                  src="/images/logos/Bangkok_Bank_2023_darkmode.svg"
                  alt="Bangkok Bank Logo"
                  fill
                  className="object-contain hidden dark:block"
                  priority
                />
              </div>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                Welcome Back
              </h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Sign in to access your account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white 
                             placeholder-gray-400 dark:placeholder-gray-500
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                             transition-all duration-200"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    className="block w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white 
                             placeholder-gray-400 dark:placeholder-gray-500
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                             transition-all duration-200"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    disabled={isLoading}
                  />
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                    Remember me
                  </span>
                </label>
                
                {/* Forgot Password - Coming Soon */}
                <div className="relative">
                  <button
                    type="button"
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    onClick={(e) => {
                      e.preventDefault();
                      setShowTooltip(true);
                      setTimeout(() => setShowTooltip(false), 2000);
                    }}
                    className="text-sm text-gray-400 dark:text-gray-500 font-medium cursor-not-allowed 
                             flex items-center gap-1 hover:text-gray-500 dark:hover:text-gray-400 transition-colors"
                  >
                    Forgot password?
                    <Info className="h-3 w-3" />
                  </button>
                  
                  {/* Tooltip */}
                  {showTooltip && (
                    <div className="absolute bottom-full right-0 mb-2 z-50">
                      <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <span className="inline-block w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                          Coming Soon
                        </div>
                        <div className="text-gray-300 mt-1">
                          Contact IT Support for password reset
                        </div>
                        {/* Arrow */}
                        <div className="absolute top-full right-4 -mt-1">
                          <div className="border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-800 dark:text-red-300">
                        {error}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 
                         bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
                         text-white font-medium rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                         disabled:cursor-not-allowed transition-all duration-200
                         transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Need help? Contact{' '}
                <a href="mailto:zack.quah@bangkokbank.com" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                  IT Support
                </a>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                For password resets, please contact your system administrator
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}