import { createContext, useContext, useState, ReactNode } from 'react';

interface HeaderContextValue {
  title?: string;
  setTitle: (title?: string) => void;
  actions?: ReactNode;
  setActions: (actions?: ReactNode) => void;
}

const HeaderContext = createContext<HeaderContextValue | undefined>(undefined);

export function HeaderProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState<string>();
  const [actions, setActions] = useState<ReactNode>();

  return (
    <HeaderContext.Provider value={{ title, setTitle, actions, setActions }}>
      {children}
    </HeaderContext.Provider>
  );
}

export function useHeader() {
  const context = useContext(HeaderContext);
  if (context === undefined) {
    throw new Error('useHeader must be used within a HeaderProvider');
  }
  return context;
}
