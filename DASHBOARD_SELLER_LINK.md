# Dashboard ↔ Seller-koppeling (Clerk + PackageSelection)

Sellers loggen in via Clerk. Hun **supplier_id** (seller ID, bijv. 1773) komt uit de bestaande tabel **PackageSelection**: het veld **clerkUserId** koppelt een Clerk user aan een aanmelding (en dus aan een sellerId).

## Database

- **PackageSelection** heeft nu:
  - **sellerId** – SDeal/Magento supplier ID (bijv. `"1773"`)
  - **clerkUserId** – Clerk user ID (bijv. `user_xxx`), optioneel, uniek

Als `clerkUserId` is gezet, kan die gebruiker inloggen op het dashboard en ziet alleen data van die seller.

## Migratie draaien

```bash
npx prisma migrate deploy
```

(of lokaal: `npx prisma migrate dev`)

## Jouw testuser (seller 1773) koppelen

### Optie A: Via admin API (aanbevolen)

1. Log in op **sdeal.com/admin** met een Clerk-account dat admin is.
2. Haal je **Clerk user ID** op (bijv. in Clerk Dashboard → Users → jouw user → kopieer de ID, begint met `user_`).
3. Doe een POST naar de admin API:

```http
POST /api/admin/link-seller
Authorization: Bearer <jouw-admin-token>
Content-Type: application/json

{
  "clerkUserId": "user_xxxxxxxxxxxx",
  "sellerId": "1773"
}
```

Er moet al een **PackageSelection**-rij bestaan met `sellerId = "1773"` (een eerdere aanmelding). Die rij wordt dan gekoppeld aan jouw Clerk-account.

### Optie B: Handmatig in de database

Als je geen PackageSelection voor 1773 hebt, maak die eerst (of gebruik een bestaande rij). Daarna:

```sql
UPDATE "PackageSelection"
SET "clerkUserId" = 'user_xxxxxxxxxxxx'
WHERE "sellerId" = '1773'
ORDER BY "createdAt" DESC
LIMIT 1;
```

Vervang `user_xxxxxxxxxxxx` door je echte Clerk user ID (te vinden in het Clerk Dashboard).

## Dashboard API’s (Clerk + supplier uit DB)

Alle onderstaande endpoints vereisen een **Clerk Bearer token** (van de ingelogde dashboard-user). De **supplierId** wordt altijd uit de database gehaald (via `clerkUserId`), nooit uit de request.

| Endpoint | Beschrijving |
|----------|--------------|
| `GET /api/dashboard/me` | Geeft `supplierId`, package, sellerEmail, etc. voor de ingelogde user. |
| `GET /api/dashboard/orders` | Orders van jouw seller (zelfde query params als seller-admin, behalve supplierId). |
| `GET /api/dashboard/balance` | Saldo van jouw seller. |
| `GET /api/dashboard/delivery-info` | Leveringsinfo van jouw seller. |
| `GET /api/dashboard/reviews` | Reviews van jouw seller. |

Als de Clerk user nog **niet** is gekoppeld (geen `clerkUserId` in PackageSelection), krijg je **403** met de melding dat het account niet aan een seller is gekoppeld.

## Frontend

In het dashboard kun je:

1. Na inloggen **`GET /api/dashboard/me`** aanroepen (met de Clerk session token) om `supplierId` en andere gegevens op te halen.
2. Daarna **`/api/dashboard/orders`**, **`/api/dashboard/balance`**, enz. aanroepen; die gebruiken intern al de gekoppelde seller.

Je hoeft **supplierId** niet in de frontend te bewaren voor deze endpoints; de backend bepaalt die uit de token.
