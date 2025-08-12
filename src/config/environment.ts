// =================================================================================
// FILE: src/config/environment.ts
// =================================================================================

export const config = {
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    
    // API Configuration
    api: {
      baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081/api',
      // In development, use basic auth from env vars
      // In production, this would use proper OAuth/JWT
      auth: {
        username: process.env.NEXT_PUBLIC_API_USERNAME || 'admin',
        password: process.env.NEXT_PUBLIC_API_PASSWORD || 'password123',
      }
    },
    
    // Feature flags
    features: {
      // Show role switcher dropdown in development
      showRoleSwitcher: process.env.NODE_ENV === 'development',
      // Enable mock authentication in development
      useMockAuth: process.env.NODE_ENV === 'development',
    }
  };
  
  // Helper to get auth headers based on environment
  export const getAuthHeaders = () => {
    if (config.isDevelopment) {
      // Use basic auth in development
      const credentials = Buffer.from(`${config.api.auth.username}:${config.api.auth.password}`).toString('base64');
      return {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      };
    } else {
      // In production, use token from auth context
      const token = localStorage.getItem('authToken'); // Or get from your auth provider
      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
    }
  };