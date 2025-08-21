// =================================================================================
// UPDATE src/app/layout.tsx - Fix hydration mismatch
// =================================================================================
import React from 'react';
import { getEnums } from '@/lib/apiClient';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/hooks/useTheme';
import { EnumStoreProvider } from '@/features/enums/useEnumStore';
import ClientLayout from '@/components/layout/ClientLayout';
import AppWrapper from '@/components/layout/AppWrapper';
import './globals.css';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const enumData = await getEnums();
  const { enums, roles } = enumData;

  return (
    <html lang="en" suppressHydrationWarning>
      <body 
        className="min-h-screen bg-gray-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300"
        suppressHydrationWarning
      >
        <ThemeProvider>
          <EnumStoreProvider initialState={{ enums, roles }}>
            <AuthProvider>
              <ClientLayout>
                <AppWrapper>
                  {children}
                </AppWrapper>
              </ClientLayout>
            </AuthProvider>
          </EnumStoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}