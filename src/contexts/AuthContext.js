'use client';

import { createContext, useContext } from 'react';
import { useSession } from 'next-auth/react';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const { data: session, status } = useSession();

  const isAdmin = session?.user?.role === 'admin';
  const isFuncionario = session?.user?.role === 'funcionario';
  const isAuthenticated = status === 'authenticated';
  const isLoading = status === 'loading';

  return (
    <AuthContext.Provider
      value={{
        user: session?.user,
        isAdmin,
        isFuncionario,
        isAuthenticated,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
