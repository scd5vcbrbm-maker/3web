# 3Web Platform - Complete Setup Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 6.0+
- Redis 7.0+
- Docker & Docker Compose (optional)

### Installation

```bash
# Clone repository
git clone https://github.com/scd5vcbrbm-maker/3web.git
cd 3web

# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Edit .env with your configuration
nano .env

# Start development server
npm run dev
```

### Docker Setup

```bash
# Build and run with Docker Compose
docker-compose up -d

# Check logs
docker-compose logs -f api-gateway
```

## 🔐 Security Features

### Encryption
- **AES-256-GCM**: Military-grade encryption for private keys
- **ECDSA (SECP256K1)**: Digital signatures for transactions
- **PBKDF2**: Key derivation with 100,000 iterations
- **SHA-256**: Data hashing

### Authentication
- Master Key System
- JWT Tokens
- Multi-Factor Authentication (MFA)
- IP Whitelisting

## 📚 API Endpoints

### Authentication
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/validate
```

### Private Keys Management
```
POST   /api/private-keys           - Add new private key
GET    /api/private-keys           - Get all keys
GET    /api/private-keys/:keyId    - Get key info
PUT    /api/private-keys/:keyId/permissions
POST   /api/private-keys/:keyId/deactivate
GET    /api/private-keys/:keyId/audit-log
DELETE /api/private-keys/:keyId    - Delete key
```

### Contract Linking
```
POST   /api/contract-links/initiate
POST   /api/contract-links/:linkId/verify-ownership
POST   /api/contract-links/:linkId/complete
GET    /api/contract-links
GET    /api/contract-links/:linkId
PUT    /api/contract-links/:linkId/permissions
POST   /api/contract-links/:linkId/backup
```

### Assets Management
```
GET    /api/assets
GET    /api/assets/:assetId
POST   /api/assets
PUT    /api/assets/:assetId
DELETE /api/assets/:assetId
GET    /api/assets/:contractAddress/balance/:ownerAddress
GET    /api/assets/:assetId/transactions
POST   /api/assets/:contractAddress/mint
POST   /api/assets/:contractAddress/burn
POST   /api/assets/:contractAddress/freeze
```

### TRON Integration
```
GET    /api/tron/balance/:address
GET    /api/tron/token-balance/:address/:tokenAddress
POST   /api/tron/send-trx
POST   /api/tron/send-token
GET    /api/tron/transaction/:txHash
GET    /api/tron/network-info
```

### Web3 (Multi-Chain)
```
GET    /api/web3/balance/:network/:address
GET    /api/web3/gas-price/:network
GET    /api/web3/transaction/:network/:txHash
GET    /api/web3/networks
```

### Settings
```
GET    /api/settings
POST   /api/settings/generate-master-key
POST   /api/settings/generate-ecdsa-keys
PUT    /api/settings/update-security
```

## 🔑 Master Key Setup

### Step 1: Generate Master Key
```bash
curl -X POST http://localhost:3000/api/settings/generate-master-key \
  -H "X-Master-Key: your-master-key"
```

### Step 2: Generate ECDSA Keys
```bash
curl -X POST http://localhost:3000/api/settings/generate-ecdsa-keys \
  -H "X-Master-Key: your-master-key"
```

### Step 3: Add Private Key
```bash
curl -X POST http://localhost:3000/api/private-keys \
  -H "X-Master-Key: your-master-key" \
  -H "Content-Type: application/json" \
  -d '{
    "label": "My TRON Wallet",
    "privateKey": "your-private-key",
    "network": "tron",
    "keyType": "ETHEREUM",
    "permissions": {
      "canSign": true,
      "canTransfer": true,
      "canDeploy": false
    }
  }'
```

## 🔗 Contract Linking Flow

### Step 1: Initiate Link
```bash
curl -X POST http://localhost:3000/api/contract-links/initiate \
  -H "X-Master-Key: your-master-key" \
  -H "Content-Type: application/json" \
  -d '{
    "contractAddress": "TDLny8udzvBLDF5Ma743zxw22drta8WD9r",
    "contractName": "My Token",
    "contractType": "TRC20",
    "linkedWallet": "TDLny8udzvBLDF5Ma743zxw22drta8WD9r",
    "keyStrength": 256
  }'
```

### Step 2: Verify Ownership
```bash
curl -X POST http://localhost:3000/api/contract-links/:linkId/verify-ownership \
  -H "X-Master-Key: your-master-key" \
  -H "Content-Type: application/json" \
  -d '{
    "signature": "your-signature",
    "message": "verify-ownership-message",
    "keyId": "key_xxx"
  }'
```

### Step 3: Complete Link
```bash
curl -X POST http://localhost:3000/api/contract-links/:linkId/complete \
  -H "X-Master-Key: your-master-key"
```

## 📊 Monitoring

### Check Health
```bash
curl http://localhost:3000/health
```

### View Logs
```bash
# Docker
docker-compose logs -f api-gateway

# File
tail -f logs/combined.log
```

## 🛠️ Development

### Run Tests
```bash
npm run test
```

### Lint Code
```bash
npm run lint
```

### Format Code
```bash
npm run format
```

## 📖 Documentation

- [Security Documentation](docs/SECURITY.md)
- [API Documentation](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [TRON Integration](docs/TRON_GUIDE.md)
- [Web3 Integration](docs/WEB3_GUIDE.md)

## ⚠️ Security Warnings

1. **Never commit `.env` file to git**
2. **Always use HTTPS in production**
3. **Rotate keys regularly**
4. **Use strong master keys (min 32 chars)**
5. **Enable MFA for all users**
6. **Whitelist IPs when possible**
7. **Monitor audit logs regularly**
8. **Keep backups of encryption keys**

## 🤝 Support

For issues and support, please open a GitHub issue or contact the team.

## 📄 License

MIT
