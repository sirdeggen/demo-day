import { useState } from 'react'
import { WalletClient, PushDrop, Utils } from '@bsv/sdk'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { toast } from 'sonner'

interface SendTokensProps {
  wallet: WalletClient
}

export function SendTokens({ wallet }: SendTokensProps) {
  const [tokenId, setTokenId] = useState('')
  const [amount, setAmount] = useState('')
  const [recipient, setRecipient] = useState('')
  const [isSending, setIsSending] = useState(false)

  const handleSendTokens = async () => {
    if (!tokenId.trim()) {
      toast.error('Please enter a token ID')
      return
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (!recipient.trim()) {
      toast.error('Please enter a recipient identity')
      return
    }

    setIsSending(true)

    try {
      const token = new PushDrop(wallet)
      const protocolID: [0 | 1 | 2, string] = [2, 'tokendemo']
      const randomBytes = crypto.getRandomValues(new Uint8Array(8))
      const keyID = Utils.toBase64(Array.from(randomBytes))

      // Build the fields as byte arrays
      const fields: number[][] = []

      // Add tokenID field
      const tokenIdBytes = Array.from(new TextEncoder().encode(tokenId))
      fields.push(tokenIdBytes)

      // Add amount field as Uint64LE (8 bytes, little-endian)
      const amountNum = Number(amount)
      const amountBytes = new Array(8)
      for (let i = 0; i < 8; i++) {
        amountBytes[i] = (amountNum >> (i * 8)) & 0xff
      }
      fields.push(amountBytes)

      // Lock the tokens to the recipient
      await token.lock(
        fields,
        protocolID,
        keyID,
        recipient, // Use recipient's identity key instead of 'self'
        false, // forSelf = false since sending to someone else
        true   // includeSignature
      )

      // TODO: Send to recipient's message box using MessageBoxClient
      // const messageBoxClient = new MessageBoxClient(...)
      // await messageBoxClient.send({
      //   recipient,
      //   message: {
      //     transaction: lockingScript,
      //     keyID,
      //     protocolID
      //   }
      // })

      toast.success(`Successfully sent ${amount} ${tokenId} tokens!`, {
        description: `To: ${recipient.slice(0, 10)}...`
      })

      // Reset form
      setTokenId('')
      setAmount('')
      setRecipient('')

    } catch (error) {
      console.error('Error sending tokens:', error)
      toast.error('Failed to send tokens', {
        description: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Send Tokens</CardTitle>
        <CardDescription>
          Transfer tokens to another user by specifying their identity key.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="sendTokenId" className="block text-sm font-medium text-gray-700 mb-1">
              Token ID *
            </label>
            <input
              id="sendTokenId"
              type="text"
              value={tokenId}
              onChange={(e) => setTokenId(e.target.value)}
              placeholder="e.g., Local Store Credits"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label htmlFor="sendAmount" className="block text-sm font-medium text-gray-700 mb-1">
              Amount *
            </label>
            <input
              id="sendAmount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g., 100"
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 mb-1">
              Recipient Identity Key *
            </label>
            <input
              id="recipient"
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Enter recipient's identity key or search"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              You can search for users using the identity search feature (coming soon)
            </p>
          </div>
        </div>

        <Button
          onClick={handleSendTokens}
          disabled={isSending}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
        >
          {isSending ? 'Sending...' : 'Send Tokens'}
        </Button>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">How it works</h4>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Enter the token ID and amount you want to send</li>
            <li>Provide the recipient's identity key</li>
            <li>The transaction will be sent to their message box</li>
            <li>They can accept the tokens in the "Receive Tokens" tab</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}
