# 3Web API Documentation

## Overview

3Web is a comprehensive Web3 SaaS platform that provides global API gateway access using Master Key authentication.

## Base URL

```
https://api.3web.com/api
```

## Authentication

All requests (except `/auth/register` and `/auth/login`) require a Master Key header:

```
X-Master-Key: your-master-key-here
```

Or use Authorization header:

```
Authorization: Bearer your-master-key-here
```

## API Endpoints

### Authentication Endpoints

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure-password",
  "name": "John Doe"
}
```

Response:
```json
{
  "status": "success",
  "data": {
    "userId": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "apiKey": "api-key",
    "masterKey": "jwt-token",
    "expiresIn": "24h"
  }
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure-password"
}
```

#### Refresh Master Key
```http
POST /auth/refresh
Content-Type: application/json

{
  "masterKey": "current-master-key"
}
```

### API Gateway Endpoints

#### Proxy Request
```http
POST /gateway/proxy
X-Master-Key: your-master-key

{
  "url": "https://api.example.com/endpoint",
  "method": "GET",
  "headers": {},
  "data": {},
  "cacheKey": "optional-cache-key"
}
```

#### Batch Requests
```http
POST /gateway/batch
X-Master-Key: your-master-key

{
  "requests": [
    {
      "id": "req-1",
      "url": "https://api.example.com/endpoint1",
      "method": "GET"
    },
    {
      "id": "req-2",
      "url": "https://api.example.com/endpoint2",
      "method": "POST",
      "data": {}
    }
  ]
}
```

#### API Health Check
```http
GET /gateway/health
X-Master-Key: your-master-key
```

#### List Endpoints
```http
GET /gateway/endpoints
X-Master-Key: your-master-key
```

### Web3 Endpoints

#### Get Balance
```http
GET /web3/balance/0x1234567890123456789012345678901234567890?network=mainnet
X-Master-Key: your-master-key
```

#### Get Transaction
```http
GET /web3/transaction/0xhash?network=mainnet
X-Master-Key: your-master-key
```

#### Get Gas Price
```http
GET /web3/gas-price?network=mainnet
X-Master-Key: your-master-key
```

#### Get Supported Networks
```http
GET /web3/networks
X-Master-Key: your-master-key
```

### Services Endpoints

#### Service Status
```http
GET /services/status
X-Master-Key: your-master-key
```

#### Analytics
```http
GET /services/analytics
X-Master-Key: your-master-key
```

#### API Usage
```http
GET /services/usage?period=day
X-Master-Key: your-master-key
```

#### Create Webhook
```http
POST /services/webhooks/subscribe
X-Master-Key: your-master-key

{
  "url": "https://your-domain.com/webhook",
  "events": ["transaction.created", "balance.updated"],
  "active": true
}
```

#### Create Alert
```http
POST /services/alerts/create
X-Master-Key: your-master-key

{
  "type": "price_alert",
  "condition": "price > 2000",
  "notification_channel": "email",
  "threshold": 2000
}
```

## Error Handling

All errors follow this format:

```json
{
  "status": "error",
  "message": "Error description",
  "code": "ERROR_CODE"
}
```

## Rate Limiting

- **Default**: 100 requests per 15 minutes
- **Header**: `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Supported Networks

- Ethereum Mainnet (chain: ethereum)
- Polygon (chain: polygon)
- Arbitrum One (chain: arbitrum)
- Optimism (chain: optimism)

## Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

const api = axios.create({
  baseURL: 'https://api.3web.com/api',
  headers: {
    'X-Master-Key': 'your-master-key'
  }
});

// Get balance
const balance = await api.get('/web3/balance/0x1234567890123456789012345678901234567890');
console.log(balance.data);
```

### Python
```python
import requests

headers = {
    'X-Master-Key': 'your-master-key'
}

response = requests.get(
    'https://api.3web.com/api/web3/balance/0x1234567890123456789012345678901234567890',
    headers=headers
)
print(response.json())
```

### cURL
```bash
curl -X GET 'https://api.3web.com/api/web3/balance/0x1234567890123456789012345678901234567890' \
  -H 'X-Master-Key: your-master-key'
```
