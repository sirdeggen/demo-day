# D.C. Demo Day

A series of visual technical demos to illustrate the utility functions of BSV Blockchain technology.

## Demos

### 1. Data Integrity Demo

**Location**: [data-integrity/](./data-integrity/)

Demonstrates how BSV blockchain can verify data integrity and detect unauthorized database changes.

**Features**:
- Side-by-side comparison: "Without BSV" vs "With BSV" tabs
- Creates cryptographic integrity proofs using OP_RETURN transactions
- Validates data against blockchain proofs to detect tampering
- Shows clear visual indicators when data has been modified

**Tech Stack**: React, TypeScript, Vite, shadcn/ui, Express, @bsv/sdk

### 2. Access Control Demo

**Location**: [access-control/](./access-control/)

Demonstrates how BSV blockchain can provide secure access control for premium content using identity verification.

**Features**:
- Identity-based access control using BSV certificates
- Premium video content gating
- Secure authentication without traditional passwords

**Tech Stack**: React, TypeScript, Vite, shadcn/ui, Express, @bsv/sdk

### 3. Tokenization Demo

**Location**: [tokenization/](./tokenization/)

Demonstrates BSV tokenization capabilities using overlay services.

**Features**:
- Token creation and management
- Overlay service integration
- Distributed token ledger

**Tech Stack**: React, TypeScript, Vite, @bsv/overlay, MySQL, MongoDB

## Quick Start with Docker

### Using Make (Easiest)

If you have `make` installed:

```bash
# Production mode
make prod

# Development mode with hot reload
make dev

# Stop services
make down

# View all available commands
make help
```

### Using Docker Compose Directly

**Production Mode**

Run all demos with a single command:

```bash
docker-compose up --build
```

Then open:
- **Data Integrity Demo**: http://localhost:8080
- **Access Control Demo**: http://localhost:8081
- **Tokenization Demo**: http://localhost:8082

Backend services:
- **Data Integrity API**: http://localhost:3001
- **Access Control API**: http://localhost:3002
- **Tokenization Overlay**: http://localhost:8083

Databases:
- **MySQL**: localhost:3306 (user: appuser, password: apppass, database: appdb)
- **MongoDB**: localhost:27017 (user: root, password: example)

To stop:
```bash
docker-compose down
```

**Development Mode (with Hot Reload)**

For development with automatic code reloading:

```bash
docker-compose -f docker-compose.dev.yml up --build
```

Then open:
- **Data Integrity Demo**: http://localhost:5173
- **Backend API**: http://localhost:3001

Changes to source code will automatically reload in the containers.

## Manual Setup

**Quick Start**:
```bash
# Terminal 1 - Backend
cd data-integrity/backend
npm install
npm run dev

# Terminal 2 - Frontend
cd data-integrity/frontend
npm install
npm run dev
```

See the [full documentation](./data-integrity/README.md) for detailed setup and usage instructions.

## Requirements

**For Docker**:
- Docker
- Docker Compose

**For Manual Setup**:
- Node.js v18+
- npm or yarn