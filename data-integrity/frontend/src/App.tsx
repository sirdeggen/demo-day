import { WalletProvider } from './context/WalletContext'
import { DataIntegrityDemo } from './components/DataIntegrityDemo'
import './App.css'

function App() {
  return (
    <WalletProvider>
      <DataIntegrityDemo />
    </WalletProvider>
  )
}

export default App
