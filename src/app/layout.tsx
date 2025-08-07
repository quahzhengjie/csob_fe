// =================================================================================
// UPDATE src/app/layout.tsx - Correct Provider Placement
// =================================================================================

import React from 'react';
import { getEnums } from '@/lib/apiClient';
import { Header } from '@/components/layout/Header';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/hooks/useTheme';
import { EnumStoreProvider } from '@/features/enums/useEnumStore';
import './globals.css';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log('RootLayout - Fetching enums...');
  const enumData = await getEnums();
  console.log('RootLayout - Enum data received:', enumData);
  console.log('RootLayout - Roles:', Object.keys(enumData.roles));
  
  const { enums, roles } = enumData;

  return (
    <html lang="en" className="">
      <body className="min-h-screen bg-gray-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300">
        {/*
          The AuthProvider should wrap everything that needs auth state.
          EnumStoreProvider can come first as it provides static data.
        */}
        <EnumStoreProvider initialState={{ enums, roles }}>
          <ThemeProvider>
            <AuthProvider>
              <Header />
              <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                {children}
              </main>
            </AuthProvider>
          </ThemeProvider>
        </EnumStoreProvider>
      </body>
    </html>
  );
}