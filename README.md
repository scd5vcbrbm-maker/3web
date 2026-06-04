# 3Web - Web3 SaaS Platform with Global API Gateway

A comprehensive Web3 SaaS platform that connects to APIs worldwide using a master key authentication system.

## Features

- 🌍 Global API Gateway with Master Key Authentication
- 🔐 Secure multi-chain Web3 integration
- 🚀 Scalable microservices architecture
- 💼 Enterprise-grade SaaS features
- 📊 Analytics and monitoring
- 🔑 Master Key management system

## Tech Stack

- **Backend:** Node.js / Python
- **Database:** MongoDB / PostgreSQL
- **Web3:** Ethers.js / Web3.js
- **API Gateway:** Express / FastAPI
- **Authentication:** JWT + Master Keys
- **Deployment:** Docker / Kubernetes

## Quick Start

```bash
# Clone repository
git clone https://github.com/scd5vcbrbm-maker/3web.git
cd 3web

# Install dependencies
npm install
# or
pip install -r requirements.txt

# Setup environment variables
cp .env.example .env

# Start development server
npm run dev
# or
python app.py
```

## Project Structure

```
3web/
├── src/
│   ├── api-gateway/          # Global API Gateway
│   ├── auth/                 # Master Key & JWT Auth
│   ├── web3/                 # Web3 Integration
│   ├── services/             # Core services
│   ├── middleware/           # Custom middleware
│   └── utils/                # Utility functions
├── config/                   # Configuration files
├── tests/                    # Test suite
├── docs/                     # API documentation
└── docker/                   # Docker configuration
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh master key
- `POST /api/auth/validate` - Validate master key

### Global API Gateway
- `POST /api/gateway/proxy` - Proxy requests to any API worldwide
- `POST /api/gateway/batch` - Batch multiple API requests
- `GET /api/gateway/health` - Check API health
- `GET /api/gateway/endpoints` - List supported endpoints

### Web3 Integration
- `GET /api/web3/balance/:address` - Get wallet balance
- `GET /api/web3/transaction/:txHash` - Get transaction details
- `POST /api/web3/send-transaction` - Send transaction
- `GET /api/web3/gas-price` - Get gas price
- `GET /api/web3/networks` - List supported networks

### Services
- `GET /api/services/status` - Service status
- `GET /api/services/analytics` - Analytics data
- `GET /api/services/usage` - API usage statistics
- `POST /api/services/webhooks/subscribe` - Subscribe to webhooks
- `POST /api/services/alerts/create` - Create alerts

## Master Key Authentication

All API requests require a Master Key header:

```bash
curl -X GET 'https://api.3web.com/api/web3/balance/0x1234...' \
  -H 'X-Master-Key: your-master-key'
```

## Supported Networks

- ✅ Ethereum Mainnet
- ✅ Polygon
- ✅ Arbitrum One
- ✅ Optimism

## Documentation

- [API Documentation](docs/API.md)
- [Master Key Setup](docs/MASTER_KEY_SETUP.md)
- [Web3 Integration Guide](docs/WEB3_GUIDE.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

## Installation & Deployment

### Docker

```bash
# Build and run with Docker Compose
docker-compose up -d
```

### Manual Setup

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env
# Edit .env with your configuration

# Start server
npm run dev
```

## Environment Variables

See `.env.example` for all available configuration options.

Key variables:
- `MASTER_KEY_SECRET` - Secret for master key signing
- `WEB3_PROVIDER_URL` - Ethereum RPC endpoint
- `POLYGON_RPC_URL` - Polygon RPC endpoint
- `DB_HOST` - MongoDB host
- `REDIS_URL` - Redis connection URL

## Contributing

Contributions are welcome! Please follow our contributing guidelines.

## License

MIT

## Support

For support and questions, please open an issue or contact the development team.
