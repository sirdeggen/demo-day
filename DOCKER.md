# Docker Setup Guide

This document explains the Docker configuration for the demo-day project.

## Files Created

### Root Level
- `docker-compose.yml` - Production configuration
- `docker-compose.dev.yml` - Development configuration with hot reload
- `Makefile` - Convenient commands for running Docker
- `.dockerignore` - Excludes unnecessary files from Docker builds

### Backend (`data-integrity/backend/`)
- `Dockerfile` - Production image with TypeScript compilation
- `.dockerignore` - Backend-specific exclusions

### Frontend (`data-integrity/frontend/`)
- `Dockerfile` - Multi-stage build with Nginx for production
- `Dockerfile.dev` - Development image for hot reload
- `nginx.conf` - Nginx configuration for serving the SPA
- `.dockerignore` - Frontend-specific exclusions
- `.env.production` - Production environment variables
- `.env.development` - Development environment variables

## Usage

### Quick Commands (with Make)

```bash
# Start production services
make prod

# Start development services (hot reload enabled)
make dev

# Stop services
make down

# View logs
make logs

# Clean everything (containers, volumes, images)
make clean

# See all available commands
make help
```

### Docker Compose Commands

**Production**
```bash
# Build and start
docker-compose up --build

# Run in background
docker-compose up -d

# Stop
docker-compose down

# View logs
docker-compose logs -f
```

**Development**
```bash
# Build and start
docker-compose -f docker-compose.dev.yml up --build

# Run in background
docker-compose -f docker-compose.dev.yml up -d

# Stop
docker-compose -f docker-compose.dev.yml down
```

## Architecture

### Production Setup (`docker-compose.yml`)

**Backend Service**
- Built from TypeScript source
- Compiles to JavaScript
- Runs on port 3001
- Mounts data files as read-only volume

**Frontend Service**
- Multi-stage build: Node.js → Nginx
- Optimized production build
- Served via Nginx on port 80 (exposed as 8080)
- Nginx handles SPA routing

### Development Setup (`docker-compose.dev.yml`)

**Backend Service**
- Runs TypeScript directly with ts-node
- Hot reload via nodemon
- Source code mounted as volume
- Development-friendly logging

**Frontend Service**
- Runs Vite dev server
- Hot module replacement (HMR) enabled
- Source code mounted as volume
- Runs on port 5173

## Networking

Both configurations use a custom bridge network called `demo-network`:
- Services can communicate using service names
- Frontend calls backend at `http://data-integrity-backend:3001`
- External access via mapped ports

## Volumes

**Production**
- Data files mounted read-only to backend
- No source code mounting (built into image)

**Development**
- Source code directories mounted for hot reload
- `node_modules` explicitly excluded via volume mount
- Data files mounted read-only to backend

## Environment Variables

**Frontend**
- `VITE_API_URL` - Backend API endpoint
  - Development: `http://localhost:3001/api`
  - Production: `http://localhost:3001/api`

**Backend**
- `NODE_ENV` - production or development
- `PORT` - Server port (3001)

## Ports

**Production Mode**
- Frontend: http://localhost:8080
- Backend: http://localhost:3001

**Development Mode**
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## Troubleshooting

**Containers won't start**
```bash
# Check logs
make logs
# or
docker-compose logs -f

# Rebuild from scratch
make clean
make prod
```

**Port conflicts**
```bash
# Check what's using the ports
lsof -i :8080
lsof -i :3001
lsof -i :5173

# Change ports in docker-compose.yml if needed
```

**Volume permission issues**
```bash
# Ensure data files exist and are readable
ls -la data-integrity/src/data/

# Should show:
# - response-original.json
# - response-altered.json
```

**Hot reload not working in dev mode**
```bash
# Ensure you're using the dev compose file
docker-compose -f docker-compose.dev.yml up

# Check that volumes are mounted correctly
docker-compose -f docker-compose.dev.yml ps -v
```

## Production Deployment Notes

For production deployment:

1. **Environment Variables**: Update `.env.production` with production API URL
2. **SSL/TLS**: Configure Nginx with SSL certificates
3. **Reverse Proxy**: Consider using a reverse proxy (Traefik, Nginx) in front
4. **Logging**: Configure centralized logging
5. **Monitoring**: Add health checks and monitoring
6. **Security**: Review Nginx security headers in `nginx.conf`

## Multi-Demo Support

The docker-compose setup is designed to support multiple demos:

```yaml
# Future demos can be added like:
services:
  demo2-backend:
    build: ./demo2/backend
    ports:
      - "3002:3002"

  demo2-frontend:
    build: ./demo2/frontend
    ports:
      - "8081:80"
```

Each demo gets isolated services with their own ports.
