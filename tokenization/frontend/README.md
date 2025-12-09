# BSV Token Demo - Frontend

A React + TypeScript frontend for creating, transferring, and managing tokens on the BSV blockchain using the PushDrop protocol.

## Features

- **Create Tokens**: Mint new fungible tokens with custom fields
- **Token Wallet**: View your token balances and holdings
- **Send Tokens**: Transfer tokens to other users
- **Receive Tokens**: Accept incoming token transfers

## Tech Stack

- **Vite** - Fast build tool and dev server
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **@bsv/sdk** - BSV blockchain SDK with PushDrop support
- **Radix UI** - Accessible component primitives
- **Sonner** - Toast notifications

## Getting Started

### Prerequisites

- Node.js 18+
- A BSV wallet browser extension (e.g., [Panda Wallet](https://github.com/Panda-Wallet/panda-wallet))

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## How It Works

### Token Creation

1. Navigate to the "Create Tokens" tab
2. Enter a Token ID (e.g., "Local Store Credits")
3. Specify the amount to mint
4. Optionally add custom fields (key-value pairs)
5. Click "Create Tokens"

The app uses the `PushDrop` class from `@bsv/sdk`:

```typescript
const token = new PushDrop(wallet)
const protocolID = [2, 'tokendemo']
const keyID = Utils.toBase64(Random(8))
const lockingScript = await token.lock(fields, protocolID, keyID, 'self', true, true)
```

### Token Transfers

1. Go to "Send Tokens" tab
2. Select the token ID and amount
3. Enter recipient's identity key
4. The transaction is sent to their message box
5. Recipient can accept in the "Receive Tokens" tab

### Wallet Integration

The app automatically connects to your BSV wallet via the `WalletClient` from `@bsv/sdk`. Make sure you have a compatible wallet installed.

## Architecture

```
src/
├── components/
│   ├── TokenDemo.tsx        # Main app with tabs
│   ├── CreateTokens.tsx     # Token minting form
│   ├── TokenWallet.tsx      # Balance display
│   ├── SendTokens.tsx       # Transfer interface
│   ├── ReceiveTokens.tsx    # Accept incoming tokens
│   └── ui/                  # Reusable UI components
├── context/
│   └── WalletContext.tsx    # Wallet state management
└── App.tsx                  # App entry point
```

## TODO

- [ ] Integrate with overlay service for token validation
- [ ] Implement identity search functionality
- [ ] Add message box integration for token transfers
- [ ] Add NFT support with unique token properties
- [ ] Implement token history and transaction details
- [ ] Add QR code scanning for recipient addresses

## Related

- [SPEC.md](../SPEC.md) - Full specification
- [Overlay Service](../overlay/) - Backend token validation

## License

MIT
