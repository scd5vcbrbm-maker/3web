# 3Web API v2.0 - Complete Reference

## Authentication

All requests require Master Key header:
```
X-Master-Key: your-master-key
```

## Wallet Management

### Create Wallet
```http
POST /api/wallets/create
Content-Type: application/json

{
  "walletType": "ethereum",
  "network": "mainnet"
}
```

**Supported Wallet Types:**
- ethereum, polygon, arbitrum, optimism, bitcoin, solana, cardano, xrp, dogecoin, litecoin

### List Wallets
```http
GET /api/wallets
```

### Get Wallet Details
```http
GET /api/wallets/:walletId
```

### Transfer Crypto
```http
POST /api/wallets/transfer
Content-Type: application/json

{
  "fromWalletId": "wallet_1",
  "toAddress": "0x...",
  "amount": "1.5",
  "network": "mainnet"
}
```

## Exchange & Trading

### Buy Prepaid Card
```http
POST /api/exchanges/buy-card
Content-Type: application/json

{
  "cardType": "binance_card",
  "amount": 500,
  "currency": "USD",
  "paymentMethod": "crypto"
}
```

**Supported Card Types:**
- binance_card, visa_debit, mastercard_debit, crypto_visa, payoneer_card, wise_card

### List Cards
```http
GET /api/exchanges/cards
```

### Execute Trade
```http
POST /api/exchanges/trade
Content-Type: application/json

{
  "exchange": "binance",
  "fromToken": "BTC",
  "toToken": "ETH",
  "amount": 0.5
}
```

**Supported Exchanges:**
- binance, coinbase, kraken, huobi, kucoin, bybit

### Get Exchange Rates
```http
GET /api/exchanges/rates
```

### Get Market Data
```http
GET /api/exchanges/market
```

## Cloud Synchronization

### Connect Cloud Provider
```http
POST /api/cloud-sync/connect
Content-Type: application/json

{
  "provider": "aws_s3",
  "credentials": {
    "accessKey": "...",
    "secretKey": "..."
  }
}
```

**Supported Providers:**
- aws_s3, google_drive, dropbox, azure_blob, ipfs, arweave

### List Cloud Connections
```http
GET /api/cloud-sync/connections
```

### Create Backup
```http
POST /api/cloud-sync/backup
Content-Type: application/json

{
  "cloudProvider": "aws_s3"
}
```

### Restore from Backup
```http
POST /api/cloud-sync/restore
Content-Type: application/json

{
  "backupId": "backup_xxx"
}
```

### Get Sync Status
```http
GET /api/cloud-sync/sync-status
```

## Business Expansion

### Create Branch
```http
POST /api/expansion/create-branch
Content-Type: application/json

{
  "branchName": "Asia Trading Desk",
  "branchType": "trading_desk",
  "location": "Singapore",
  "settings": {}
}
```

**Supported Branch Types:**
- subsidiary, trading_desk, fund, dao, partnership

### List Branches
```http
GET /api/expansion/branches
```

### Add Team Member
```http
POST /api/expansion/add-team-member
Content-Type: application/json

{
  "branchId": "branch_1",
  "email": "user@example.com",
  "role": "trader",
  "permissions": ["read", "write"]
}
```

**Supported Roles:**
- admin, manager, trader, viewer, analyst

### Generate API Key
```http
POST /api/expansion/api-keys
Content-Type: application/json

{
  "branchId": "branch_1",
  "name": "Trading Bot",
  "scopes": ["read", "write"]
}
```

### Get Expansion Analytics
```http
GET /api/expansion/analytics
```

## Response Format

All responses follow this format:

```json
{
  "status": "success|error",
  "data": {},
  "message": "Description",
  "code": "ERROR_CODE"
}
```

## Error Codes

- `INVALID_INPUT` - Missing or invalid parameters
- `INVALID_WALLET_TYPE` - Unsupported wallet type
- `INVALID_CARD_TYPE` - Unsupported card type
- `INVALID_EXCHANGE` - Unsupported exchange
- `INVALID_PROVIDER` - Unsupported cloud provider
- `INVALID_TYPE` - Invalid branch type
- `INVALID_ROLE` - Invalid team role
- `WALLET_ERROR` - Wallet operation failed
- `CARD_ERROR` - Card operation failed
- `TRANSFER_ERROR` - Transfer failed
- `TRADE_ERROR` - Trade execution failed
- `CLOUD_ERROR` - Cloud sync error
- `EXPANSION_ERROR` - Branch/expansion error
- `TEAM_ERROR` - Team management error

## Rate Limiting

- 100 requests per 15 minutes
- Headers: `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Pagination

For list endpoints:
```
GET /api/wallets?page=1&perPage=10
```

## Examples

### JavaScript
```javascript
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: { 'X-Master-Key': 'your-key' }
});

// Create wallet
const wallet = await api.post('/wallets/create', {
  walletType: 'ethereum'
});

// Buy card
const card = await api.post('/exchanges/buy-card', {
  cardType: 'binance_card',
  amount: 500
});
```

### Python
```python
import requests

headers = {'X-Master-Key': 'your-key'}
base_url = 'http://localhost:3000/api'

# Create wallet
response = requests.post(
  f'{base_url}/wallets/create',
  headers=headers,
  json={'walletType': 'ethereum'}
)
```
