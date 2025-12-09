import { WalletProvider } from './context/WalletContext'
import { TokenDemo } from './components/TokenDemo'
import { Toaster } from 'sonner'

function App() {
  return (
    <WalletProvider>
      <TokenDemo />
      <Toaster position="top-right" richColors />
    </WalletProvider>
  )
}

export default App
