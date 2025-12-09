import { useState, useEffect } from 'react'
import { WalletClient, PushDrop } from '@bsv/sdk'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { toast } from 'sonner'

interface ReceiveTokensProps {
  wallet: WalletClient
}

interface PendingToken {
  id: string
  tokenId: string
  amount: number
  sender: string
  timestamp: number
  keyID: string
  protocolID: [0 | 1 | 2, string]
}

export function ReceiveTokens({ wallet }: ReceiveTokensProps) {
  const [pendingTokens, setPendingTokens] = useState<PendingToken[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [acceptingTokenId, setAcceptingTokenId] = useState<string | null>(null)

  useEffect(() => {
    loadPendingTokens()
  }, [wallet])

  const loadPendingTokens = async () => {
    setIsLoading(true)
    try {
      // TODO: Implement actual message box fetching
      // const messageBoxClient = new MessageBoxClient(...)
      // const messages = await messageBoxClient.getMessages()

      // For now, load from localStorage as a temporary solution
      const storedPending = localStorage.getItem('pendingTokens')
      if (storedPending) {
        setPendingTokens(JSON.parse(storedPending))
      } else {
        setPendingTokens([])
      }
    } catch (error) {
      console.error('Error loading pending tokens:', error)
      setPendingTokens([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleAcceptToken = async (pendingToken: PendingToken) => {
    setAcceptingTokenId(pendingToken.id)

    try {
      const token = new PushDrop(wallet)

      // Unlock the token using the key derivation material
      await token.unlock(
        pendingToken.protocolID,
        pendingToken.keyID,
        pendingToken.sender
      )

      // Update local balances
      const storedBalances = localStorage.getItem('tokenBalances')
      const balances = storedBalances ? JSON.parse(storedBalances) : []

      const existingBalance = balances.find((b: any) => b.tokenId === pendingToken.tokenId)
      if (existingBalance) {
        existingBalance.amount += pendingToken.amount
      } else {
        balances.push({
          tokenId: pendingToken.tokenId,
          amount: pendingToken.amount
        })
      }

      localStorage.setItem('tokenBalances', JSON.stringify(balances))

      // Remove from pending
      const updatedPending = pendingTokens.filter(t => t.id !== pendingToken.id)
      setPendingTokens(updatedPending)
      localStorage.setItem('pendingTokens', JSON.stringify(updatedPending))

      toast.success(`Accepted ${pendingToken.amount} ${pendingToken.tokenId} tokens!`)

    } catch (error) {
      console.error('Error accepting tokens:', error)
      toast.error('Failed to accept tokens', {
        description: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setAcceptingTokenId(null)
    }
  }

  const handleRejectToken = (pendingToken: PendingToken) => {
    const updatedPending = pendingTokens.filter(t => t.id !== pendingToken.id)
    setPendingTokens(updatedPending)
    localStorage.setItem('pendingTokens', JSON.stringify(updatedPending))
    toast.info('Token transfer rejected')
  }

  const refreshPending = () => {
    loadPendingTokens()
  }

  if (isLoading) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Receive Tokens</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            Loading pending tokens...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Receive Tokens</CardTitle>
            <CardDescription>
              Accept or reject tokens sent to you by others
            </CardDescription>
          </div>
          <Button onClick={refreshPending} variant="outline">
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {pendingTokens.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-2">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No pending tokens</h3>
            <p className="text-gray-600">
              When someone sends you tokens, they will appear here for you to accept.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingTokens.map((pending) => (
              <div
                key={pending.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Incoming
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(pending.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {pending.tokenId}
                    </h3>
                    <p className="text-xl font-bold text-purple-600 mt-1">
                      +{pending.amount.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      From: <span className="font-mono">{pending.sender.slice(0, 20)}...</span>
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      onClick={() => handleAcceptToken(pending)}
                      disabled={acceptingTokenId === pending.id}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {acceptingTokenId === pending.id ? 'Accepting...' : 'Accept'}
                    </Button>
                    <Button
                      onClick={() => handleRejectToken(pending)}
                      disabled={acceptingTokenId === pending.id}
                      variant="outline"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
