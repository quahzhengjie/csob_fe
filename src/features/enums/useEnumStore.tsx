// =================================================================================
// UPDATE src/features/enums/useEnumStore.tsx - Add debugging
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
import type { Role, EnumConfig } from '@/types/entities';

export interface EnumState {
  roles: Record<string, Role>;
  enums: EnumConfig['enums'];
}

export const createEnumStore = (init: EnumState) => {
  return createStore<EnumState>(() => ({ ...init }));
};

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
  
  const result = useStore(ctx, selector); 
  return result;
};