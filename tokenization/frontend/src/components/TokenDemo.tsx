import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs'
import { CreateTokens } from './CreateTokens'
import { TokenWallet } from './TokenWallet'
import { SendTokens } from './SendTokens'
import { ReceiveTokens } from './ReceiveTokens'
import { Card } from './ui/card'
import { useWallet } from '../context/WalletContext'

export function TokenDemo() {
  const { wallet, isInitialized, error } = useWallet()
  const [activeTab, setActiveTab] = useState('create')

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6">
          <h2 className="text-xl font-semibold mb-4">Initializing Wallet...</h2>
          <p className="text-gray-600">Please wait while we connect to your BSV wallet.</p>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6">
          <h2 className="text-xl font-semibold mb-4 text-red-600">Wallet Error</h2>
          <p className="text-gray-700">{error}</p>
          <p className="text-gray-600 mt-4">
            Please install a compatible BSV wallet (e.g., Panda Wallet) and refresh the page.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Utility Token Creator
          </h1>
          <p className="text-gray-600">
            Create, transfer, and manage tokens on the BSV blockchain
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex justify-center space-x-2 mb-6 bg-white rounded-lg p-1 shadow-sm">
            <TabsTrigger
              value="create"
              className="px-6 py-2 rounded-md transition-colors data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=inactive]:text-gray-700 data-[state=inactive]:hover:bg-gray-100"
            >
              Create Tokens
            </TabsTrigger>
            <TabsTrigger
              value="wallet"
              className="px-6 py-2 rounded-md transition-colors data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=inactive]:text-gray-700 data-[state=inactive]:hover:bg-gray-100"
            >
              My Wallet
            </TabsTrigger>
            <TabsTrigger
              value="send"
              className="px-6 py-2 rounded-md transition-colors data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=inactive]:text-gray-700 data-[state=inactive]:hover:bg-gray-100"
            >
              Send Tokens
            </TabsTrigger>
            <TabsTrigger
              value="receive"
              className="px-6 py-2 rounded-md transition-colors data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=inactive]:text-gray-700 data-[state=inactive]:hover:bg-gray-100"
            >
              Receive Tokens
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create">
            <CreateTokens wallet={wallet!} />
          </TabsContent>

          <TabsContent value="wallet">
            <TokenWallet wallet={wallet!} />
          </TabsContent>

          <TabsContent value="send">
            <SendTokens wallet={wallet!} />
          </TabsContent>

          <TabsContent value="receive">
            <ReceiveTokens wallet={wallet!} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
