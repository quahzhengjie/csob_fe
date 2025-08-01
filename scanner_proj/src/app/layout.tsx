// =================================================================================
// FILE: src/app/layout.tsx
// =================================================================================
import React from 'react';
// CORRECTED: Import the new, integrated getEnums function
import { getEnums } from '@/lib/apiClient';
import { Header } from '@/components/layout/Header';
import { ThemeProvider } from '@/hooks/useTheme';
import { EnumStoreProvider } from '@/features/enums/useEnumStore';
import './globals.css';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // CORRECTED: Call the new getEnums function
  const { enums, roles } = await getEnums();

  return (
    <html lang="en" className="">
      <body className="min-h-screen bg-gray-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300">
        <EnumStoreProvider initialState={{ enums, roles }}>
          <ThemeProvider>
          
     
            <Header />
            <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
              {children}
            </main>
          </ThemeProvider>
        </EnumStoreProvider>
      </body>
    </html>
  );
}