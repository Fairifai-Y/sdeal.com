# Seller Admin API Integratie Guide

Deze guide beschrijft hoe de Seller Admin API geïntegreerd is in het SDeal project en hoe je deze kunt gebruiken.

## Overzicht

De Seller Admin API integratie maakt verbinding met de externe SDeal Admin API op `sportdeal.nl` om ordergegevens, balance informatie en delivery statistieken op te halen voor sellers.

## Configuratie

### Environment Variabelen

Voeg de volgende environment variabelen toe aan je `.env` bestand of Vercel environment settings:

```env
SELLER_ADMIN_API_BASE_URL=https://www.sportdeal.nl/rest/V1
SELLER_ADMIN_ACCESS_TOKEN=eqvh4bios3s7zf9znksr2rbgqsyel9hw
```

**Belangrijk:** 
- De `SELLER_ADMIN_ACCESS_TOKEN` moet verkregen worden van de admin
- Bewaar deze token veilig en deel deze niet publiekelijk

## API Endpoints

### 1. Orders Lijst Ophalen

Haalt een lijst van orders op basis van verschillende filters.

**Endpoint:** `GET /api/seller-admin/orders`

**Query Parameters:**
- `supplierId` (string, optioneel) - Enkele supplier ID
- `supplierIds` (string, optioneel) - Meerdere supplier IDs (comma-separated, bijv. "1773,1774,1775")
- `orderStatus` (number, optioneel) - Enkele order status
- `orderStatuses` (string, optioneel) - Meerdere order statussen (comma-separated, bijv. "20,25,30")
- `dateFrom` (string, optioneel) - Startdatum filter (format: YYYY-MM-DD)
- `dateTo` (string, optioneel) - Einddatum filter (format: YYYY-MM-DD)
- `page` (number, optioneel) - Paginanummer (default: 1)
- `pageSize` (number, optioneel) - Aantal items per pagina (default: 20)

**Voorbeelden:**

```bash
# Alle orders voor supplier 1773
GET /api/seller-admin/orders?supplierId=1773

# Orders met paginatie
GET /api/seller-admin/orders?supplierId=1773&page=1&pageSize=20

# Orders met status filter
GET /api/seller-admin/orders?supplierId=1773&orderStatus=20

# Meerdere suppliers
GET /api/seller-admin/orders?supplierIds=1773,1774,1775

# Meerdere statussen
GET /api/seller-admin/orders?supplierId=1773&orderStatuses=20,25,30

# Met datum filter
GET /api/seller-admin/orders?supplierId=1773&dateFrom=2021-01-01&dateTo=2021-12-31
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 2919,
        "supplier_id": 1773,
        "supplier_quote_id": 1104,
        "supplier_name": "OV Stock",
        "order_type": 4,
        "order_status": 25,
        "finance_status": 80,
        "commission_status": 10,
        "created_at": "2021-02-03 05:03:07",
        "updated_at": "2024-04-30 04:27:23",
        ...
      }
    ]
  }
}
```

### 2. Specifieke Order Details

Haalt complete details op van een specifieke order inclusief order items.

**Endpoint:** `GET /api/seller-admin/order`

**Query Parameters:**
- `orderId` of `id` (number, vereist) - Order ID

**Voorbeeld:**

```bash
GET /api/seller-admin/order?orderId=68074
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 68074,
    "supplier_id": 1773,
    "supplier_name": "OV Stock",
    "order_status": 20,
    "order_items": "[{\"ean\":\"5708441001567\",\"quantity\":1,\"supplier_sku\":\"OVSTOCK57\",\"name\":\"Reelight Verlichtingsset SL150 Steady Light dynamo zwart\",\"price\":\"29.9500\"}]",
    "customer_email": "olegrootes@hotmail.com",
    "customer_order_id": "SD-NL-O-000034619",
    ...
  }
}
```

### 3. Seller Balance Data

Haalt balance informatie op voor een specifieke supplier.

**Endpoint:** `GET /api/seller-admin/balance`

**Query Parameters:**
- `supplierId` (number, vereist) - Supplier ID

**Voorbeeld:**

```bash
GET /api/seller-admin/balance?supplierId=1773
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "balance_id": "107",
        "supplier_id": "1773",
        "supplier_name": "OV Stock",
        "balance_total": "161.9600",
        "balance_pending": "-0.0057",
        "balance_commission": "-0.0001",
        "balance_available": "0.0000",
        "balance_pending_partner": "0.0000",
        "balance_partner": "161.9600",
        "balance_available_partner": "0.0000",
        "date": "2025-08-07 06:22:20"
      }
    ],
    "total_count": 1
  }
}
```

### 4. Delivery Info

Haalt delivery reliability en statistieken op voor een supplier.

**Endpoint:** `GET /api/seller-admin/delivery-info`

**Query Parameters:**
- `supplierId` (number, vereist) - Supplier ID

**Voorbeeld:**

```bash
GET /api/seller-admin/delivery-info?supplierId=1773
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "delivery_reliability_90_days": 100,
      "total_email_sent_90_days": 0,
      "answered_90_days": 0,
      "not_answered_90_days": 0,
      "not_received_90_days": 0,
      "received_90_days": 0,
      "delivery_reliability": 100,
      "total_email_sent": 3,
      "answered": 0,
      "not_answered": 3,
      "not_received": 0,
      "received": 0
    }
  ]
}
```

## Gebruik in Frontend

### JavaScript/React Voorbeeld

```javascript
// Orders ophalen
const fetchOrders = async (supplierId, filters = {}) => {
  const params = new URLSearchParams({
    supplierId: supplierId,
    ...filters
  });
  
  const response = await fetch(`/api/seller-admin/orders?${params}`);
  const result = await response.json();
  
  if (result.success) {
    return result.data.items;
  } else {
    throw new Error(result.error);
  }
};

// Specifieke order ophalen
const fetchOrderDetails = async (orderId) => {
  const response = await fetch(`/api/seller-admin/order?orderId=${orderId}`);
  const result = await response.json();
  
  if (result.success) {
    return result.data;
  } else {
    throw new Error(result.error);
  }
};

// Balance ophalen
const fetchBalance = async (supplierId) => {
  const response = await fetch(`/api/seller-admin/balance?supplierId=${supplierId}`);
  const result = await response.json();
  
  if (result.success) {
    return result.data.items[0]; // Eerste item bevat de balance data
  } else {
    throw new Error(result.error);
  }
};

// Delivery info ophalen
const fetchDeliveryInfo = async (supplierId) => {
  const response = await fetch(`/api/seller-admin/delivery-info?supplierId=${supplierId}`);
  const result = await response.json();
  
  if (result.success) {
    return result.data[0]; // Eerste item bevat de delivery info
  } else {
    throw new Error(result.error);
  }
};
```

### React Component Voorbeeld

```jsx
import React, { useState, useEffect } from 'react';

const SellerOrders = ({ supplierId }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(
          `/api/seller-admin/orders?supplierId=${supplierId}&page=1&pageSize=20`
        );
        const result = await response.json();
        
        if (result.success) {
          setOrders(result.data.items || []);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (supplierId) {
      loadOrders();
    }
  }, [supplierId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Orders</h2>
      <table>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Status</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.id}>
              <td>{order.id}</td>
              <td>{order.order_status}</td>
              <td>{order.created_at}</td>
              <td>
                <button onClick={() => viewOrderDetails(order.id)}>
                  View Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SellerOrders;
```

## Foutafhandeling

Alle endpoints retourneren een consistente error response:

```json
{
  "success": false,
  "error": "Error message",
  "details": "Detailed error information (alleen in development mode)"
}
```

**HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (ontbrekende of ongeldige parameters)
- `405` - Method Not Allowed (verkeerde HTTP method)
- `500` - Internal Server Error (API fout of configuratie probleem)

## Authenticatie

De API gebruikt automatisch de `SELLER_ADMIN_ACCESS_TOKEN` environment variabele voor authenticatie. Deze wordt toegevoegd als:
- `Authorization` header: De access token waarde
- `Token-Type` header: "admin"

## Best Practices

1. **Caching**: Overweeg caching voor balance en delivery info data, aangezien deze niet constant veranderen
2. **Error Handling**: Implementeer altijd proper error handling in je frontend
3. **Loading States**: Toon loading states tijdens API calls
4. **Paginatie**: Gebruik paginatie voor grote order lijsten
5. **Security**: Deel de access token nooit publiekelijk of in client-side code

## Testing

### Test Endpoint

Er is een speciale test endpoint beschikbaar om te controleren of de configuratie correct is:

```bash
GET /api/seller-admin/test?supplierId=1773
```

Deze endpoint:
- Controleert of de environment variabelen correct zijn ingesteld
- Test de authenticatie headers
- Maakt een test API call naar de externe API
- Retourneert een gedetailleerd test rapport

**Voorbeeld Response:**
```json
{
  "success": true,
  "message": "All tests passed! API is configured correctly.",
  "results": {
    "configuration": {
      "baseUrl": "https://www.sportdeal.nl/rest/V1",
      "hasAccessToken": true,
      "accessTokenLength": 32
    },
    "tests": [
      {
        "name": "Authentication Headers",
        "status": "success",
        "message": "Headers generated successfully"
      },
      {
        "name": "API Connection Test",
        "status": "success",
        "message": "Successfully connected to Seller Admin API"
      }
    ]
  }
}
```

### Test Script

Er is een test script beschikbaar om alle endpoints automatisch te testen:

```bash
# Test tegen lokale server
node scripts/test-seller-admin-api.js

# Test tegen Vercel deployment
node scripts/test-seller-admin-api.js https://your-app.vercel.app
```

Het script test alle endpoints en geeft een samenvatting van de resultaten.

### Handmatig Testen

Je kunt de endpoints ook handmatig testen met curl:

```bash
# Test configuratie
curl "https://your-app.vercel.app/api/seller-admin/test?supplierId=1773"

# Test orders
curl "https://your-app.vercel.app/api/seller-admin/orders?supplierId=1773&page=1&pageSize=5"

# Test balance
curl "https://your-app.vercel.app/api/seller-admin/balance?supplierId=1773"

# Test delivery info
curl "https://your-app.vercel.app/api/seller-admin/delivery-info?supplierId=1773"
```

## Troubleshooting

### "Access token is not configured"
- Controleer of `SELLER_ADMIN_ACCESS_TOKEN` is ingesteld in je environment variabelen
- Voor Vercel: Ga naar Project Settings > Environment Variables
- Zorg dat de variabele beschikbaar is voor alle environments (Production, Preview, Development)
- **Belangrijk**: Na het toevoegen van environment variabelen in Vercel, moet je een nieuwe deployment triggeren

### "API request failed"
- Controleer of de access token geldig is
- Controleer of de base URL correct is ingesteld (`SELLER_ADMIN_API_BASE_URL`)
- Controleer de Vercel function logs voor meer details
- Test eerst de `/api/seller-admin/test` endpoint om te zien wat er mis gaat

### CORS Errors
- De API endpoints draaien server-side, dus CORS zou geen probleem moeten zijn
- Als je direct naar de externe API belt vanuit de browser, gebruik dan de proxy endpoints

### Vercel Deployment Issues
- Zorg dat alle environment variabelen zijn ingesteld voordat je deployt
- Controleer de Vercel deployment logs voor errors
- Gebruik de test endpoint om te verifiëren dat alles werkt na deployment

## Bestandsstructuur

```
api/
  seller-admin/
    helpers.js          # Authenticatie en HTTP request helpers
    orders.js          # Orders lijst endpoint
    order.js           # Specifieke order endpoint
    balance.js         # Balance endpoint
    delivery-info.js   # Delivery info endpoint
```

## Volgende Stappen

1. Voeg environment variabelen toe aan je deployment
2. Test de endpoints met Postman of curl
3. Integreer de endpoints in je frontend applicatie
4. Overweeg caching implementatie voor performance
5. Voeg eventuele extra filters of functionaliteit toe indien nodig

