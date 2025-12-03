import { WalletProvider } from './context/WalletContext'
import { DataIntegrityDemo } from './components/DataIntegrityDemo'
import { Toaster } from 'sonner'
import './App.css'

function App() {
  return (
    <WalletProvider>
      <DataIntegrityDemo />
      <Toaster position="top-right" richColors />
    </WalletProvider>
  )
}

export default App
