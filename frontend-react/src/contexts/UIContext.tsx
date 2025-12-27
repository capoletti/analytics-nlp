import { createContext, useContext, useState, ReactNode } from 'react';

interface UIContextValue {
  isHeaderVisible: boolean;
  toggleHeader: () => void;
  hideHeader: () => void;
  showHeader: () => void;
}

const UIContext = createContext<UIContextValue | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  const toggleHeader = () => setIsHeaderVisible(prev => !prev);
  const hideHeader = () => setIsHeaderVisible(false);
  const showHeader = () => setIsHeaderVisible(true);

  return (
    <UIContext.Provider value={{ isHeaderVisible, toggleHeader, hideHeader, showHeader }}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}
