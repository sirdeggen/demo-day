import { useState, useEffect } from 'react'
import { WalletClient, PushDrop, LockingScript, Utils } from '@bsv/sdk'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'

interface TokenWalletProps {
  wallet: WalletClient
}

interface TokenBalance {
  tokenId: string
  amount: number
  customFields?: Record<string, string>
}

export function TokenWallet({ wallet }: TokenWalletProps) {
  const [balances, setBalances] = useState<TokenBalance[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const results = new Map<string, string>();

  useEffect(() => {
    loadBalances()
  }, [wallet])

  const loadBalances = async () => {
    setIsLoading(true)
    results.clear();
    try {
      const simple = await wallet.listOutputs({
        basket: 'demotokens',
        include: 'locking scripts'
      })

      simple.outputs.map(c => {
        const token = PushDrop.decode(LockingScript.fromHex(c.lockingScript as string))
        const r = new Utils.Reader(token.fields[1])
        const amount = String(r.readUInt64LEBn())
        const customFields = JSON.parse(Utils.toUTF8(token.fields[2]))
        const details = {
          tokenId: Utils.toUTF8(token.fields[0]),
          amount,
          customFields
        }
        console.log({ details })
        const current = Number(results.get(details.tokenId)) || 0
        results.set(details.tokenId, String(current + Number(details.amount)))
      })

      const storedBalances = localStorage.getItem('tokenBalances')
      if (storedBalances) {
        setBalances(JSON.parse(storedBalances))
      } else {
        setBalances([])
      }
    } catch (error) {
      console.error('Error loading balances:', error)
      setBalances([])
    } finally {
      setIsLoading(false)
    }
  }

  const refreshBalances = () => {
    loadBalances()
  }

  if (isLoading) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>My Token Wallet</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            Loading balances...
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
            <CardTitle>My Token Wallet</CardTitle>
            <CardDescription>
              View your token balances and holdings
            </CardDescription>
          </div>
          <Button onClick={refreshBalances} variant="outline">
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {balances.length === 0 ? (
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
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No tokens yet</h3>
            <p className="text-gray-600">
              Create some tokens or receive tokens from others to see them here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {
            results.entries((entry, index) => {
              return <>
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {entry[0]}
                    </h3>
                    <p className="text-2xl font-bold text-purple-600 mt-1">
                      {entry[1].amount.toLocaleString()}
                    </p>
                    {entry[1].customFields && Object.keys(entry[1].customFields).length > 0 && (
                      <div className="mt-3 space-y-1">
                        <p className="text-sm font-medium text-gray-700">Properties:</p>
                        <div className="space-y-1">
                          {Object.entries(entry[1].customFields).map(([key, value]) => (
                            <div key={key} className="text-sm text-gray-600 flex">
                              <span className="font-medium min-w-[100px]">{key}:</span>
                              <span>{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              </>
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
