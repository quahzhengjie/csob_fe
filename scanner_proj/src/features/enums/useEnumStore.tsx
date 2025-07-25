// =================================================================================
// FILE: src/features/enums/useEnumStore.tsx
// =================================================================================
'use client';

import {
  type ReactNode,
  createContext,
  useContext,
  useRef,
} from 'react';
import {
  createStore,
  type StoreApi,
  useStore,
} from 'zustand';
// CORRECTED: Import the final, correct types from our enums definition
import type { Role, EnumConfig } from '@/types/enums';

// CORRECTED: The state interface now matches the structure of EnumConfig
export interface EnumState {
  roles: Record<string, Role>;
  enums: EnumConfig['enums'];
}

export const createEnumStore = (init: EnumState) =>
  createStore<EnumState>(() => ({ ...init }));

const EnumStoreContext = createContext<StoreApi<EnumState> | null>(null);

export const EnumStoreProvider = ({
  children,
  initialState,
}: {
  children: ReactNode;
  initialState: EnumState;
}) => {
  const storeRef = useRef<StoreApi<EnumState> | null>(null);
  if (!storeRef.current) {
    storeRef.current = createEnumStore(initialState);
  }

  return (
    <EnumStoreContext.Provider value={storeRef.current}>
      {children}
    </EnumStoreContext.Provider>
  );
};

export const useEnumStore = <T,>(selector: (s: EnumState) => T): T => {
  const ctx = useContext(EnumStoreContext);
  if (!ctx) throw new Error('useEnumStore must be used within EnumStoreProvider');
  return useStore(ctx, selector);
};