# SDeal Backend Server

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment Variables

Create a `.env` file in the `server` directory:

```env
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
PORT=3000
NODE_ENV=production
```

For Neon PostgreSQL, your DATABASE_URL will look like:
```
postgresql://username:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
```

### 3. Setup Prisma

Generate Prisma Client:
```bash
npm run prisma:generate
```

Run migrations:
```bash
npm run prisma:migrate
```

This will create the database tables.

### 4. Open Prisma Studio

To view and manage your database:
```bash
npm run prisma:studio
```

This will open Prisma Studio at http://localhost:5555

### 5. Start the Server

Development:
```bash
npm run dev
```

Production:
```bash
npm start
```

## API Endpoints

### POST /api/package/submit
Submit a package selection.

Request body:
```json
{
  "package": "A" | "B" | "C",
  "addons": {
    "dealCSS": boolean,
    "caas": boolean,
    "fairifAI": boolean
  },
  "agreementAccepted": boolean,
  "language": "en" | "nl" | "de" | "fr",
  "sellerEmail": "optional@email.com",
  "sellerId": "optional-seller-id"
}
```

### GET /api/package/all
Get all package selections (for admin).

Query parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50)
- `package`: Filter by package (A, B, or C)
- `language`: Filter by language (en, nl, de, fr)

### GET /api/package/stats
Get statistics about package selections.

## Database Schema

The `PackageSelection` model includes:
- `id`: Unique identifier
- `package`: Selected package (A, B, or C)
- `addonDealCSS`, `addonCAAS`, `addonFairifAI`: Add-on selections
- `agreementAccepted`: Whether agreement was accepted
- `agreementVersion`, `termsVersion`: Version numbers
- `language`: Language code
- `ipAddress`: Client IP address
- `sellerEmail`, `sellerId`: Optional seller information
- `createdAt`, `updatedAt`: Timestamps

## Vercel Deployment

For Vercel deployment, add these environment variables:

1. Go to your Vercel project settings
2. Navigate to Environment Variables
3. Add:
   - `DATABASE_URL`: Your Neon PostgreSQL connection string
   - `NODE_ENV`: `production`
   - `PORT`: (optional, Vercel sets this automatically)

Make sure to run `prisma migrate deploy` in your build process or as a post-deploy hook.

