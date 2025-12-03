import React, { createContext, useContext, useState, useEffect } from 'react';
import { WalletClient } from '@bsv/sdk';

interface WalletContextType {
  wallet: WalletClient | null;
  isInitialized: boolean;
  error: string | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wallet, setWallet] = useState<WalletClient | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeWallet = async () => {
      try {
        // Initialize WalletClient
        const walletClient = new WalletClient();
        setWallet(walletClient);
        setIsInitialized(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize wallet');
        console.error('Wallet initialization error:', err);
      }
    };

    initializeWallet();
  }, []);

  return (
    <WalletContext.Provider value={{ wallet, isInitialized, error }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
