# Seller Admin API Integratie

Deze directory bevat de integratie met de externe SDeal Seller Admin API.

## Quick Start

### 1. Environment Variabelen Instellen

Voeg toe aan je `.env` bestand of Vercel environment variables:

```env
SELLER_ADMIN_API_BASE_URL=https://www.sportdeal.nl/rest/V1
SELLER_ADMIN_ACCESS_TOKEN=your_access_token_here
```

### 2. Endpoints Gebruiken

#### Orders Lijst
```bash
GET /api/seller-admin/orders?supplierId=1773&page=1&pageSize=20
```

#### Specifieke Order
```bash
GET /api/seller-admin/order?orderId=68074
```

#### Balance Data
```bash
GET /api/seller-admin/balance?supplierId=1773
```

#### Delivery Info
```bash
GET /api/seller-admin/delivery-info?supplierId=1773
```

## Bestandsstructuur

- `helpers.js` - Authenticatie en HTTP request helpers
- `orders.js` - Orders lijst endpoint
- `order.js` - Specifieke order endpoint  
- `balance.js` - Balance data endpoint
- `delivery-info.js` - Delivery info endpoint

## Zie ook

Voor volledige documentatie, zie `SELLER_ADMIN_API_INTEGRATION.md` in de root directory.

