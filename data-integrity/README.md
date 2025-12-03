# BSV Data Integrity Demo

This demo application demonstrates how BSV blockchain can be used to verify data integrity and detect unauthorized changes to database records.

## Overview

The application consists of:
- **Frontend**: React + Vite + TypeScript with shadcn/ui components
- **Backend**: Node.js + Express + TypeScript API server
- **BSV Integration**: Uses @bsv/sdk WalletClient for creating and verifying integrity proofs

## Features

### Two-Tab Comparison

1. **Without BSV Blockchain Tab**
   - Shows data fetched from a compromised database
   - Records 3 and 5 have been tampered with
   - No way to detect the unauthorized changes

2. **With BSV Blockchain Tab**
   - Shows original data with integrity verification
   - Creates cryptographic proofs stored on BSV blockchain
   - Immediately detects any tampering when validating against blockchain proofs

### Data Integrity Protection

- **Record 3**: Award amount has been changed from $4.2B to $9.9B
- **Record 5**: Recipient name changed from "NATIONAL AEROSPACE SOLUTIONS, LLC" to "COMPROMISED AEROSPACE SOLUTIONS, LLC"

The BSV blockchain integration detects both modifications instantly using OP_RETURN data anchoring and transaction verification.

## Setup Instructions

### Option 1: Docker (Recommended)

The easiest way to run the demo is using Docker from the root directory:

```bash
# From the root demo-day directory
docker-compose up
```

The application will be available at:
- Frontend: http://localhost:8080
- Backend API: http://localhost:3001

To stop:
```bash
docker-compose down
```

### Option 2: Manual Setup

#### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

#### Installation

1. **Install Backend Dependencies**

```bash
cd backend
npm install
```

2. **Install Frontend Dependencies**

```bash
cd frontend
npm install
```

#### Running the Application

You'll need two terminal windows:

**Terminal 1 - Backend Server**

```bash
cd backend
npm run dev
```

The backend API will start on `http://localhost:3001`

**Terminal 2 - Frontend Application**

```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:5173` (or the next available port)

## Usage Guide

1. **Open the application** in your browser (typically `http://localhost:5173`)

2. **Without BSV Tab**:
   - View the compromised data
   - Notice records 3 and 5 are highlighted as modified
   - No verification is possible - you just have to trust the database

3. **With BSV Tab**:
   - Click "Create Integrity Proofs" to store cryptographic hashes of records 3 and 5 on the BSV blockchain
   - Click "Validate Data Integrity" to check current database records against blockchain proofs
   - See clear visual indicators showing which records have been tampered with

## Technical Implementation

### WalletClient Integration

The application uses BSV SDK's `WalletClient` for blockchain operations:

```typescript
// Initialize wallet
const walletClient = new WalletClient();

// Create integrity proof
await wallet.createAction({
  outputs: [{
    lockingScript: LockingScript.fromASM(`OP_FALSE OP_RETURN ${dataHex}`),
    satoshis: 0,
    basket: 'integrity'
  }]
});

// Validate integrity
const outputs = await wallet.listOutputs({ basket: 'integrity' });
const tx = Transaction.fromBEEF(output.beef);
await tx.verify();
```

### Data Flow

1. Original data stored in `src/data/response-original.json`
2. Altered data in `src/data/response-altered.json`
3. Backend serves both datasets via REST API
4. Frontend creates blockchain proofs of original records
5. Validation compares current data against blockchain proofs

## Project Structure

```
data-integrity/
├── backend/
│   ├── src/
│   │   └── server.ts          # Express API server
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/            # shadcn/ui components
│   │   │   └── DataIntegrityDemo.tsx  # Main demo component
│   │   ├── context/
│   │   │   └── WalletContext.tsx      # BSV wallet context
│   │   ├── types/
│   │   │   └── index.ts       # TypeScript interfaces
│   │   └── App.tsx            # Root component
│   ├── package.json
│   └── tsconfig.json
└── src/
    └── data/
        ├── response.json           # Source data
        ├── response-original.json  # Clean copy
        └── response-altered.json   # Tampered data
```

## Key Technologies

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **TypeScript** - Type safety
- **shadcn/ui** - UI component library
- **Tailwind CSS** - Styling
- **@bsv/sdk** - BSV blockchain integration
- **Express** - Backend API server

## Demo Scenarios

### Scenario 1: Undetected Tampering
- Switch to "Without BSV Blockchain" tab
- See modified records displayed as if they were legitimate
- No way to verify authenticity

### Scenario 2: Blockchain-Verified Integrity
- Switch to "With BSV Blockchain" tab
- Create integrity proofs (stores cryptographic hashes on blockchain)
- Validate data - system detects both tampered records immediately
- Visual alerts show exactly what was modified

## License

MIT
