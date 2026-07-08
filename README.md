# BigCommerce to HubSpot Sync

Basic Node.js app that listens for BigCommerce `store/customer/created` and `store/company/created` webhook callbacks, fetches the full record from BigCommerce, and creates or updates the matching HubSpot contact or company.

## Requirements

- Node.js 18 or newer
- BigCommerce API account token with customer read access and B2B company read access
- HubSpot private app token with CRM contact and company read/write scopes
- Public HTTPS URL for BigCommerce webhook delivery. BigCommerce webhook destinations must use port 443.

## Setup

1. Copy the environment template:

   ```bash
   cp .env.example .env
   ```

2. Fill in `.env`:

   ```bash
   PORT=3000
   HOST=0.0.0.0
   BIGCOMMERCE_STORE_HASH=abc123
   BIGCOMMERCE_ACCESS_TOKEN=...
   HUBSPOT_ACCESS_TOKEN=...
   WEBHOOK_SECRET=some-random-secret
   ```

3. Start the app with nodemon:

   ```bash
   npm start
   ```

   For a non-watch production-style run:

   ```bash
   npm run serve
   ```

4. Register the BigCommerce customer-created webhook:

   ```bash
   curl --request POST \
     --url "https://api.bigcommerce.com/stores/$BIGCOMMERCE_STORE_HASH/v3/hooks" \
     --header "X-Auth-Token: $BIGCOMMERCE_ACCESS_TOKEN" \
     --header "Accept: application/json" \
     --header "Content-Type: application/json" \
     --data '{
       "scope": "store/customer/created",
       "destination": "https://your-domain.com/webhooks/bigcommerce/customer-created",
       "is_active": true,
       "headers": {
         "x-webhook-secret": "some-random-secret"
       }
     }'
   ```

5. Register the BigCommerce company-created webhook:

   ```bash
   curl --request POST \
     --url "https://api.bigcommerce.com/stores/$BIGCOMMERCE_STORE_HASH/v3/hooks" \
     --header "X-Auth-Token: $BIGCOMMERCE_ACCESS_TOKEN" \
     --header "Accept: application/json" \
     --header "Content-Type: application/json" \
     --data '{
       "scope": "store/company/created",
       "destination": "https://your-domain.com/webhooks/bigcommerce/company-created",
       "is_active": true,
       "headers": {
         "x-webhook-secret": "some-random-secret"
       }
     }'
   ```

## Endpoints

- `GET /health` returns `{ "ok": true }`
- `POST /webhooks/bigcommerce/customer-created` receives BigCommerce webhook callbacks
- `POST /webhooks/bigcommerce/company-created` receives BigCommerce company webhook callbacks

## Webhook to HubSpot Flow

This is the full path from a BigCommerce webhook to a HubSpot create or update.

1. App startup begins in `index.js`.
   - `require('dotenv').config()` loads `.env` values before the app reads configuration.
   - `assertConfig()` from `src/config/validateEnv.js` checks that `BIGCOMMERCE_STORE_HASH`, `BIGCOMMERCE_ACCESS_TOKEN`, and `HUBSPOT_ACCESS_TOKEN` are present. If any are missing, the app throws an error and does not start.
   - `app.listen(config.port, config.host, ...)` starts the Express server.

2. Express middleware and routes are registered in `src/app.js`.
   - `express.json({ limit: '1mb' })` parses JSON webhook request bodies.
   - `app.use('/webhooks/bigcommerce', webhookRoutes)` mounts the BigCommerce webhook router.
   - `app.use(notFoundHandler)` handles unmatched routes after all registered routes.
   - `app.use(errorHandler)` handles request errors, including invalid JSON.

3. The webhook routes are defined in `src/routes/webhookRoutes.js`.
   - `router.post('/customer-created', validateWebhookSecret, validateCustomerCreatedPayload, handleCustomerCreated)` receives `POST /webhooks/bigcommerce/customer-created`.
   - `router.post('/company-created', validateWebhookSecret, validateCompanyCreatedPayload, handleCompanyCreated)` receives `POST /webhooks/bigcommerce/company-created`.
   - The request passes through `validateWebhookSecret`, the matching payload validator, then the matching controller.

4. `validateWebhookSecret(req, res, next)` in `src/middleware/validateWebhookSecret.js` checks the shared webhook secret.
   - If `WEBHOOK_SECRET` is not configured, the middleware calls `next()` and skips secret validation.
   - If `WEBHOOK_SECRET` is configured, it compares the request header named by `WEBHOOK_SECRET_HEADER` or the default `x-webhook-secret`.
   - If the header value does not match, it returns `401 { "error": "Invalid webhook secret" }`.
   - If the header matches, it calls `next()`.

5. `validateCustomerCreatedPayload(req, res, next)` in `src/middleware/validateCustomerCreatedPayload.js` verifies the webhook shape.
   - It requires `req.body.scope` to be `store/customer/created`.
   - It requires `req.body.data.id`, because that BigCommerce customer ID is used for the API lookup.
   - If validation fails, it returns `400 { "error": "Expected store/customer/created payload with data.id" }`.
   - If validation passes, it calls `next()`.

6. `validateCompanyCreatedPayload(req, res, next)` in `src/middleware/validateCompanyCreatedPayload.js` verifies the company webhook shape.
   - It requires `req.body.scope` to be `store/company/created`.
   - It requires `req.body.data.company_id`, because that BigCommerce company ID is used for the API lookup.
   - If validation fails, it returns `400 { "error": "Expected store/company/created payload with data.company_id" }`.
   - If validation passes, it calls `next()`.

7. `handleCustomerCreated(req, res)` and `handleCompanyCreated(req, res)` in `src/controllers/webhookController.js` acknowledge the webhook.
   - It immediately sends `200 OK` with `res.sendStatus(200)` so BigCommerce receives a fast response.
   - It then starts the async sync by calling `syncCustomerCreatedWebhook(req.body)` or `syncCompanyCreatedWebhook(req.body)`.
   - If the async sync fails after the response has already been sent, the controller logs `Customer sync failed:` with the error message.

8. `syncCustomerCreatedWebhook(payload)` in `src/services/customerSyncService.js` coordinates the contact sync.
   - It reads the BigCommerce customer ID from `payload.data.id`.
   - It calls `fetchBigCommerceCustomer(customerId)` to get the complete customer record from BigCommerce.
   - It calls `toHubSpotContactProperties(customer)` to convert the BigCommerce customer into HubSpot contact properties.
   - It calls `upsertHubSpotContact(properties)` to create or update the HubSpot contact.
   - It logs the BigCommerce customer ID and the returned HubSpot contact ID when the sync succeeds.

9. `syncCompanyCreatedWebhook(payload)` in `src/services/companySyncService.js` coordinates the company sync.
   - It reads the BigCommerce company ID from `payload.data.company_id`.
   - It calls `fetchBigCommerceCompany(companyId)` to get the complete company record from BigCommerce.
   - It calls `toHubSpotCompanyProperties(company)` to convert the BigCommerce company into HubSpot company properties.
   - It calls `upsertHubSpotCompany(properties)` to create or update the HubSpot company.
   - It logs the BigCommerce company ID and the returned HubSpot company ID when the sync succeeds.

10. `fetchBigCommerceCustomer(customerId)` in `src/services/bigCommerceService.js` loads the full customer from BigCommerce.
   - It calls `bigCommerceRequest('/v3/customers?id:in=...')` with the URL-encoded customer ID.
   - It reads the first customer from `customerResponse.data[0]`.
   - If BigCommerce returns no customer, it throws `BigCommerce customer not found: <customerId>`.

11. `fetchBigCommerceCompany(companyId)` in `src/services/bigCommerceService.js` loads the full company from BigCommerce B2B.
   - It calls `bigCommerceB2BRequest('/api/v3/io/companies/{id}')` on `https://api-b2b.bigcommerce.com` with the URL-encoded company ID.
   - It authenticates with `X-Auth-Token` and sends `X-Store-Hash`, as required by the BigCommerce B2B Company API.
   - It reads the company from `companyResponse.data`.
   - If BigCommerce returns no company, it throws `BigCommerce company not found: <companyId>`.

12. `bigCommerceRequest(path)` in `src/services/bigCommerceService.js` performs the BigCommerce API call.
   - It sends a request to `https://api.bigcommerce.com/stores/${config.bigCommerceStoreHash}${path}`.
   - It authenticates with the `x-auth-token` header using `BIGCOMMERCE_ACCESS_TOKEN`.
   - It parses the JSON response body.
   - If BigCommerce returns a non-2xx response, it throws `BigCommerce API error <status>: <body>`.

13. `toHubSpotContactProperties(customer)` in `src/utils/contactMapper.js` maps BigCommerce fields into HubSpot contact fields.
    - `customer.email` becomes `email`.
    - `customer.first_name` becomes `firstname`.
    - `customer.last_name` becomes `lastname`.
    - `customer.phone` becomes `phone`.
    - `customer.company` becomes `company`.
    - If `HUBSPOT_INCLUDE_BIGCOMMERCE_ID=true`, `customer.id` is converted to a string and mapped to `bigcommerce_customer_id`.
    - Empty, `null`, and `undefined` values are removed before the HubSpot request is made.

14. `toHubSpotCompanyProperties(company)` in `src/utils/companyMapper.js` maps BigCommerce B2B company fields into HubSpot company fields.
    - `companyName` becomes `name`.
    - `companyPhone` becomes `phone`.
    - `domain` or website values are mapped when present directly or in `extraFields`.
    - Address, city, state, zip, and country are mapped when present directly or in `extraFields`.
    - If `HUBSPOT_INCLUDE_BIGCOMMERCE_ID=true`, `companyId` is converted to a string and mapped to `bigcommerce_company_id`.
    - Empty, `null`, and `undefined` values are removed before the HubSpot request is made.

15. `upsertHubSpotContact(properties)` in `src/services/hubSpotService.js` creates or updates the HubSpot contact.
    - It first requires `properties.email`; without an email it throws `Cannot sync customer without an email address`.
    - It calls `findHubSpotContactByEmail(properties.email)` to check whether the contact already exists.
    - If a contact exists, it calls `hubSpotRequest('/crm/v3/objects/contacts/{id}', { method: 'PATCH', ... })` to update that contact.
    - If no contact exists, it calls `hubSpotRequest('/crm/v3/objects/contacts', { method: 'POST', ... })` to create a new HubSpot contact.

16. `upsertHubSpotCompany(properties)` in `src/services/hubSpotService.js` creates or updates the HubSpot company.
    - It first requires `properties.name`; without a name it throws `Cannot sync company without a company name`.
    - It searches first by `bigcommerce_company_id` when configured, then by `domain` when present, then by `name`.
    - If a company exists, it calls `hubSpotRequest('/crm/v3/objects/companies/{id}', { method: 'PATCH', ... })` to update that company.
    - If no company exists, it calls `hubSpotRequest('/crm/v3/objects/companies', { method: 'POST', ... })` to create a new HubSpot company.

17. `findHubSpotContactByEmail(email)` in `src/services/hubSpotService.js` searches HubSpot by email.
    - It calls `hubSpotRequest('/crm/v3/objects/contacts/search', { method: 'POST', ... })`.
    - It searches for contacts where the HubSpot `email` property equals the BigCommerce customer email.
    - It requests the `email`, `firstname`, `lastname`, `phone`, and `company` properties.
    - It returns the first matching contact from `searchResponse.results[0]`, or `undefined` if none is found.

18. `hubSpotRequest(path, options = {})` in `src/services/hubSpotService.js` performs HubSpot API calls.
    - It sends a request to `https://api.hubapi.com${path}`.
    - It authenticates with the `authorization: Bearer <HUBSPOT_ACCESS_TOKEN>` header.
    - It sends and receives JSON.
    - If HubSpot returns a non-2xx response, it throws `HubSpot API error <status>: <body>`.

At the end of this flow, HubSpot has either a newly created or updated contact matched by email, or a newly created or updated company matched by BigCommerce ID, domain, or name.

## Function Reference

| Function | Location | Purpose |
| --- | --- | --- |
| `assertConfig()` | `src/config/validateEnv.js` | Verifies required environment variables before the server starts. |
| `app.listen(...)` | `index.js` | Starts the HTTP server using the configured host and port. |
| `validateWebhookSecret(req, res, next)` | `src/middleware/validateWebhookSecret.js` | Accepts only webhook requests with the configured shared secret, unless no secret is configured. |
| `validateCustomerCreatedPayload(req, res, next)` | `src/middleware/validateCustomerCreatedPayload.js` | Confirms the request is a `store/customer/created` webhook with `data.id`. |
| `validateCompanyCreatedPayload(req, res, next)` | `src/middleware/validateCompanyCreatedPayload.js` | Confirms the request is a `store/company/created` webhook with `data.company_id`. |
| `handleCustomerCreated(req, res)` | `src/controllers/webhookController.js` | Sends the webhook acknowledgement and starts the async customer sync. |
| `handleCompanyCreated(req, res)` | `src/controllers/webhookController.js` | Sends the webhook acknowledgement and starts the async company sync. |
| `syncCustomerCreatedWebhook(payload)` | `src/services/customerSyncService.js` | Orchestrates customer ID extraction, BigCommerce fetch, HubSpot mapping, and HubSpot upsert. |
| `syncCompanyCreatedWebhook(payload)` | `src/services/companySyncService.js` | Orchestrates company ID extraction, BigCommerce fetch, HubSpot mapping, and HubSpot upsert. |
| `fetchBigCommerceCustomer(customerId)` | `src/services/bigCommerceService.js` | Fetches the full BigCommerce customer record for the webhook customer ID. |
| `fetchBigCommerceCompany(companyId)` | `src/services/bigCommerceService.js` | Fetches the full BigCommerce company record for the webhook company ID. |
| `bigCommerceRequest(path)` | `src/services/bigCommerceService.js` | Sends authenticated BigCommerce API requests and handles API errors. |
| `toHubSpotContactProperties(customer)` | `src/utils/contactMapper.js` | Converts a BigCommerce customer object into HubSpot contact properties. |
| `toHubSpotCompanyProperties(company)` | `src/utils/companyMapper.js` | Converts a BigCommerce company object into HubSpot company properties. |
| `upsertHubSpotContact(properties)` | `src/services/hubSpotService.js` | Creates a HubSpot contact if none exists for the email, or updates the existing contact. |
| `upsertHubSpotCompany(properties)` | `src/services/hubSpotService.js` | Creates a HubSpot company if none exists, or updates the existing company. |
| `findHubSpotContactByEmail(email)` | `src/services/hubSpotService.js` | Searches HubSpot contacts by email before deciding whether to create or update. |
| `hubSpotRequest(path, options = {})` | `src/services/hubSpotService.js` | Sends authenticated HubSpot API requests and handles API errors. |
| `errorHandler(error, req, res, next)` | `src/middleware/errorHandler.js` | Handles invalid JSON and unhandled request errors before a response is sent. |
| `notFoundHandler(req, res)` | `src/middleware/notFoundHandler.js` | Returns `404` for unmatched routes. |
| `getHealth(req, res)` | `src/controllers/healthController.js` | Returns `{ "ok": true }` for `GET /health`. |

## Project Structure

```text
index.js
src/
  app.js
  config/
  controllers/
  middleware/
  routes/
  services/
  utils/
```

- `controllers` handle HTTP request/response flow
- `routes` define endpoint paths and middleware
- `services` call BigCommerce and HubSpot APIs
- `utils` contains data mapping helpers
- `config` reads and validates environment settings

## HubSpot Field Mapping

The app maps these BigCommerce customer fields to HubSpot contact properties:

- `email` -> `email`
- `first_name` -> `firstname`
- `last_name` -> `lastname`
- `phone` -> `phone`
- `company` -> `company`

The app maps these BigCommerce B2B company fields to HubSpot company properties:

- `companyName` -> `name`
- `companyPhone` -> `phone`
- `domain`, `website`, `website_url`, `websiteUrl`, or matching `extraFields` values -> `domain`
- address, city, state, zip, and country values are mapped when present directly or in matching `extraFields`

`companyEmail` is available in the BigCommerce B2B response, but it is not mapped by default because HubSpot companies do not include a standard email property. Create a custom HubSpot company property and extend `toHubSpotCompanyProperties` if you need to store it.

Set `HUBSPOT_INCLUDE_BIGCOMMERCE_ID=true` only after creating HubSpot properties named `bigcommerce_customer_id` on contacts and `bigcommerce_company_id` on companies.

## Local Test Payload

```bash
curl --request POST \
  --url "http://localhost:3000/webhooks/bigcommerce/customer-created" \
  --header "Content-Type: application/json" \
  --header "x-webhook-secret: some-random-secret" \
  --data '{
    "scope": "store/customer/created",
    "store_id": "1025646",
    "data": {
      "type": "customer",
      "id": 32
    },
    "hash": "8768ab15aa86c6d73c7e4c3efbaee072110ad1d2",
    "created_at": 1561481571,
    "producer": "stores/abc123"
  }'
```

Company-created payload:

```bash
curl --request POST \
  --url "http://localhost:3000/webhooks/bigcommerce/company-created" \
  --header "Content-Type: application/json" \
  --header "x-webhook-secret: some-random-secret" \
  --data '{
    "scope": "store/company/created",
    "store_id": "1025646",
    "data": {
      "type": "company",
      "company_id": 45
    },
    "hash": "8768ab15aa86c6d73c7e4c3efbaee072110ad1d2",
    "created_at": 1561481571,
    "producer": "stores/abc123"
  }'
```

The test requests still call the live BigCommerce and HubSpot APIs, so use real IDs and valid tokens.
