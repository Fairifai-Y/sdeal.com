# Endpoint Verificatie

## Huidige Configuratie

**Base URL:** `https://www.sdeal.nl/rest/V1`

**Endpoints:**
1. Orders: `/supplier/orders/`
   - **Totaal URL:** `https://www.sdeal.nl/rest/V1/supplier/orders/` ✅

2. Order Details: `/supplier/order/{id}`
   - **Totaal URL:** `https://www.sdeal.nl/rest/V1/supplier/order/68074` ✅

3. Balance: `/sportdeal-balancemanagement/balance/search/`
   - **Totaal URL:** `https://www.sdeal.nl/rest/V1/sportdeal-balancemanagement/balance/search/` ✅

4. Delivery Info: `/sportdeal-delivery/info/`
   - **Totaal URL:** `https://www.sdeal.nl/rest/V1/sportdeal-delivery/info/` ✅

## Documentatie Specificatie

Volgens de documentatie:

1. **Orders:** `https://www.sportdeal.nl/rest/V1/supplier/orders/?searchCriteria[...]`
2. **Order:** `https://www.sportdeal.nl/rest/V1/supplier/order/68074`
3. **Balance:** `https://www.sportdeal.nl/rest/V1/sportdeal-balancemanagement/balance/search/?searchCriteria[...]`
4. **Delivery:** `https://www.sportdeal.nl/rest/V1/sportdeal-delivery/info/?supplierId=1773`

## Verificatie

De endpoints lijken correct te zijn. Maar misschien is de vraag:

### Mogelijkheid 1: Base URL moet anders?
- Huidig: `https://www.sdeal.nl/rest/V1`
- Misschien: `https://www.sdeal.nl/rest` (zonder `/V1`)?
- Dan zouden endpoints moeten zijn: `/V1/supplier/orders/`

### Mogelijkheid 2: Endpoints missen iets?
- Misschien moet er nog iets tussen `/rest/V1` en het endpoint?

### Mogelijkheid 3: Trailing slashes?
- Sommige endpoints hebben `/` aan het einde, andere niet
- Dit kan belangrijk zijn voor sommige APIs

## Test

Laat me een test endpoint maken die de exacte URLs logt zodat we kunnen zien wat er precies wordt aangeroepen.

