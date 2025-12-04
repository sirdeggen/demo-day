# BSV Access Control Demo

This demo demonstrates BSV blockchain's identity and certificate framework for age-restricted content access control.

## Overview

The application showcases:
- **Certificate Acquisition**: Users acquire short-lived (60 second) age verification certificates from a BSV certifier
- **Certificate-Based Access Control**: Backend validates certificates using `@bsv/auth-express-middleware`
- **Protected Content**: Video content that can only be accessed with a valid certificate
- **Time-Based Expiry**: Certificates expire after 60 seconds, demonstrating temporal access control

## Architecture

### Frontend (React + TypeScript + Vite)
- Certificate acquisition UI with GREEN/TEAL theme (distinct from data-integrity app)
- Two-step flow: Acquire Certificate → Access Content
- Video player for protected content
- Real-time certificate expiry countdown
- Uses `@bsv/sdk` WalletClient and AuthFetch

### Backend (Node.js + Express + TypeScript)
- BSV auth middleware for certificate validation
- Protected `/api/protected/video` endpoint
- Validates `over18` field and `timestamp` (must be within last 60 seconds)
- Serves video files from `public` directory
- Uses `@bsv/auth-express-middleware` and `@bsv/wallet-toolbox-client`

## Features

1. **Certificate Issuance**: Acquire certificates from `https://certify.bsvb.tech`
2. **Temporal Access Control**: 60-second validity period
3. **Field Validation**: Checks `over18` (boolean) and `timestamp` (unix time)
4. **Protected Video Streaming**: HTML5 video player for age-restricted content
5. **Visual Feedback**: Countdown timer, certificate status indicators

## Design Differences from Data-Integrity App

- **Color Scheme**: GREEN/TEAL/EMERALD (vs. BLUE/INDIGO/SLATE in data-integrity)
- **Layout**: Centered card-based flow (vs. full-width spreadsheet)
- **Navigation**: Step indicators instead of tabs
- **Interaction**: Two-step linear flow (vs. multi-action dashboard)
- **Background**: Light emerald/teal gradients (vs. dark slate)

## Development

### Prerequisites
- Node.js 20+
- Panda Wallet or compatible BSV wallet browser extension
- npm or yarn

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Backend runs on http://localhost:3002

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Frontend runs on http://localhost:5178 (or next available port)

### Environment Variables

**Backend** (`.env`):
```
PORT=3002
SERVER_PRIVATE_KEY=<hex-encoded-private-key>
WALLET_STORAGE_URL=https://staging-overlay.babbage.systems
BSV_NETWORK=mainnet
```

**Frontend** (`.env`):
```
VITE_API_URL=http://localhost:3002/api
```

## Docker Deployment

From the root directory:

```bash
# Build all services
docker compose build

# Start services
docker compose up -d

# Access the apps
# Data Integrity: http://localhost:8080
# Access Control: http://localhost:8081
```

## Certificate Flow

1. **Acquire Certificate**
   - User clicks "Acquire Age Verification Certificate"
   - Frontend calls `wallet.acquireCertificate()` with fields: `{over18: 'true', timestamp: <current_unix_time>}`
   - Certificate is issued by certifier at `https://certify.bsvb.tech`
   - Certificate stored in user's wallet

2. **Request Access**
   - User clicks "Request Access to Video"
   - Frontend uses `AuthFetch` to make authenticated request
   - Backend middleware requests certificate via auth protocol
   - Wallet provides certificate to backend

3. **Validation**
   - Backend validates `over18 === 'true'`
   - Backend checks `timestamp` is within last 60 seconds
   - If valid: returns video URL
   - If invalid/expired: returns 403 error

4. **Content Display**
   - Frontend receives video URL
   - HTML5 video player displays protected content
   - Timer shows remaining certificate validity

## API Endpoints

- `GET /api/health` - Health check (public)
- `GET /api/protected/video` - Protected video endpoint (requires certificate)
- `/video/:filename` - Static video files (proxied through auth middleware)

## Technical Details

### Certificate Type
- Type: `age-verification` (base64 encoded)
- Certifier: `03c644fe2fd97673a5d86555a58587e7936390be6582ece262bc387014bcff6fe4`
- Fields:
  - `over18`: String "true" or boolean true
  - `timestamp`: Unix timestamp (seconds)

### Validation Rules
- Certificate must not be older than 60 seconds
- Certificate timestamp cannot be in the future (with 10s tolerance)
- `over18` field must equal "true" or boolean true
- Certificate must be from the correct certifier

## Security Considerations

- Certificates are short-lived (60 seconds) to limit exposure window
- Timestamp validation prevents replay attacks beyond validity period
- Certificate verification happens server-side
- Video files only accessible through authenticated endpoints
- Server-side wallet uses private key for identity

## Future Improvements

- Support for multiple certificate types
- Configurable validity periods
- Certificate revocation checking
- Age bracket certificates (18+, 21+, etc.)
- Multi-factor certificate requirements
- Audit logging of access attempts
