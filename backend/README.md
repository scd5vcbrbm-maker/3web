# 3Web Backend

Enterprise-grade Web3 SaaS backend with microservices architecture.

## Infrastructure

### Services
- **API Gateway**: Express.js + Kong
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Queue**: RabbitMQ 3.12
- **Storage**: MinIO (S3-compatible)
- **Monitoring**: Prometheus + Grafana
- **API Gateway**: Kong 3.3

### Architecture

```
┌─────────────────────────────────────────┐
│        Client (Frontend/Mobile)         │
└────────────────┬────────────────────────┘
                 │
        ┌────────▼─────────┐
        │   Kong Gateway   │ (Rate limiting, Auth, Routing)
        └────────┬─────────┘
                 │
        ┌────────▼─────────┐
        │  Express Server  │
        └────┬────────┬────┘
             │        │
      ┌──────▼──┐  ┌──▼──────┐
      │PostgreSQL│  │ Redis   │ (Cache & Sessions)
      └──────────┘  └─────────┘
             │
      ┌──────▼───────────┐
      │    RabbitMQ      │ (Async Jobs)
      └──────────────────┘
             │
      ┌──────▼───────────┐
      │     MinIO        │ (File Storage)
      └──────────────────┘
```

## Project Structure

```
backend/
├── src/
│   ├── index.ts                 # Main application
│   ├── middleware/
│   │   ├── auth.ts             # JWT/Master Key auth
│   │   ├── rate-limiter.ts     # Request rate limiting
│   │   ├── request-logger.ts   # Request logging
│   │   └── error-handler.ts    # Global error handling
│   ├── routes/
│   │   ├── auth.routes.ts      # Authentication endpoints
│   │   ├── keys.routes.ts      # API key management
│   │   ├── files.routes.ts     # File management
│   │   ├── web3.routes.ts      # Web3 endpoints
│   │   └── health.routes.ts    # Health checks
│   ├── services/
│   │   ├── cache.service.ts    # Redis cache operations
│   │   ├── queue.service.ts    # RabbitMQ message queue
│   │   └── storage.service.ts  # MinIO file operations
│   ├── entities/
│   │   ├── User.ts             # User model
│   │   ├── MasterKey.ts        # API key model
│   │   ├── CompanyFile.ts      # File model
│   │   └── AuditLog.ts         # Audit logging
│   └── database/
│       ├── connection.ts       # Database connection
│       ├── migrations/         # Database migrations
│       └── seeds/              # Database seeds
├── config/
│   ├── prometheus.yml          # Prometheus config
│   └── grafana/                # Grafana provisioning
├── Dockerfile
├── docker-compose.yml
├── package.json
├── tsconfig.json
└── .env.example
```

## Setup

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone repository
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start infrastructure
docker-compose up -d

# Run migrations
npm run migrate

# Start development server
npm run dev
```

### Services URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| API | `http://localhost:3001` | - |
| Kong Admin | `http://localhost:8001` | - |
| PostgreSQL | `localhost:5432` | user: 3web, pass: secure_password |
| Redis | `localhost:6379` | - |
| RabbitMQ | `http://localhost:15672` | guest:guest |
| MinIO Console | `http://localhost:9001` | minioadmin:minioadmin |
| Prometheus | `http://localhost:9090` | - |
| Grafana | `http://localhost:3001` | admin:admin |

## API Documentation

### Authentication

```bash
# Register
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name"
}

# Login
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

# Validate Token
POST /api/auth/validate
Headers: Authorization: Bearer <token>
```

### API Keys

```bash
# List keys
GET /api/keys
Headers: Authorization: Bearer <token>

# Create key
POST /api/keys
Headers: Authorization: Bearer <token>
{
  "name": "Production Key",
  "permissions": ["read", "write"]
}

# Delete key
DELETE /api/keys/:id
Headers: Authorization: Bearer <token>
```

### Health Check

```bash
GET /api/health
GET /api/health/ready
GET /api/health/live
```

## Technologies

- **Runtime**: Node.js 18
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL + TypeORM
- **Cache**: Redis (ioredis)
- **Queue**: RabbitMQ (amqplib)
- **Storage**: MinIO
- **Gateway**: Kong
- **Monitoring**: Prometheus + Grafana
- **Auth**: JWT + Master Keys
- **Validation**: Joi + class-validator

## Development

### Scripts

```bash
npm run dev         # Start development server with hot reload
npm run build       # Build TypeScript
npm start           # Start production server
npm test            # Run tests
npm run lint        # Run linter
npm run migrate     # Run database migrations
npm run seed        # Seed database with sample data
```

### Database Migrations

```bash
# Create migration
npm run typeorm migration:create -- -n MigrationName

# Run migrations
npm run migrate

# Revert migration
npm run typeorm migration:revert
```

## Monitoring

### Prometheus
- **URL**: http://localhost:9090
- **Targets**: Configured to scrape API metrics

### Grafana
- **URL**: http://localhost:3001
- **Username**: admin
- **Password**: admin (or set via `GRAFANA_PASSWORD`)
- **Data Source**: Prometheus

## Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test auth.test.ts

# Watch mode
npm run test:watch

# Coverage
npm test -- --coverage
```

## Deployment

### Docker

```bash
# Build image
docker build -t 3web-backend .

# Run container
docker run -d \
  -p 3001:3001 \
  --env-file .env \
  3web-backend
```

### Kubernetes

See `k8s/` directory for Kubernetes manifests.

```bash
kubectl apply -f k8s/
```

## Security

- JWT token-based authentication
- Master key management system
- Rate limiting per IP
- Request validation
- Helmet.js security headers
- CORS configuration
- Audit logging
- Password hashing (bcryptjs)

## Contributing

1. Create a feature branch
2. Follow coding standards
3. Write tests
4. Submit pull request

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
