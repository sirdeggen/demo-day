import React, { createContext, useContext, useState, useEffect } from 'react';
import { WalletClient } from '@bsv/sdk';
import { MessageBoxClient } from '@bsv/message-box-client';

interface WalletContextType {
  wallet: WalletClient | null;
  isInitialized: boolean;
  error: string | null;
  messageBoxClient: MessageBoxClient | null;
  messageBoxUrl: string;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wallet, setWallet] = useState<WalletClient | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messageBoxClient, setMessageBoxClient] = useState<MessageBoxClient | null>(null);
  const messageBoxUrl = 'https://messagebox.babbage.systems'; // Default message box URL

  useEffect(() => {
    const initWallet = async () => {
      try {
        const walletClient = new WalletClient();
        setWallet(walletClient);

        // Initialize MessageBoxClient
        const mbClient = new MessageBoxClient({
          host: messageBoxUrl,
          walletClient: walletClient,
          enableLogging: false,
          networkPreset: 'mainnet'
        });
        setMessageBoxClient(mbClient);

        setIsInitialized(true);
      } catch (err) {
        console.error('Failed to initialize wallet:', err);
        setError('Failed to initialize wallet. Please ensure Panda Wallet or a compatible wallet is installed.');
        setIsInitialized(false);
      }
    };

    initWallet();
  }, []);

  return (
    <WalletContext.Provider value={{ wallet, isInitialized, error, messageBoxClient, messageBoxUrl }}>
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
