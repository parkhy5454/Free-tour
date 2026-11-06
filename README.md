# FreeTour Global — MVP

**Travel Like a Local.** A responsive global travel marketplace starter for travelers and local guides.

## Included in this MVP

- Responsive desktop and mobile web UI
- PWA manifest / installable-web-app foundation
- Traveler and guide registration
- Email/password login with hashed passwords and HTTP-only session cookie
- Guide profile creation and country/city search
- Traveler custom trip request submission
- User dashboard
- Neon PostgreSQL + Prisma data model
- Health-check endpoint

## Stack

- Next.js 15 App Router / React / TypeScript
- Neon PostgreSQL
- Prisma ORM
- Render deployment

## Local setup

1. Install Node.js 20.9+.
2. Create a Neon PostgreSQL database.
3. Copy `.env.example` to `.env` and set `DATABASE_URL` and `AUTH_SECRET`.
4. Install dependencies and sync schema:

```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

Open `http://localhost:3000`.

## Render deployment

Create a new **Web Service** from this GitHub repository.

- Runtime: Node
- Build command: `npm install && npx prisma generate && npx prisma db push && npm run build`
- Start command: `npm start`

Set environment variables in Render:
- `DATABASE_URL`: Neon pooled or direct connection string (use the provider's recommended connection string)
- `AUTH_SECRET`: long random secret
- `NEXT_PUBLIC_APP_URL`: deployed URL

Health check path: `/api/health`

## First test flow

1. Open `/register` and create a traveler account.
2. Log in and create a trip request at `/requests/new`.
3. Register a separate guide account at `/register`, then open `/guide/join`.
4. Search the new guide from `/guides`.

## Important scope / production checklist

This is an executable MVP foundation, not a finished global booking/payment business. Before public launch:
- Add email verification, password reset, rate limiting, bot protection and account recovery.
- Add role/ownership checks to every guide and request action.
- Add guide proposal acceptance, booking lifecycle, chat and notifications.
- Integrate payment providers only after checking supported countries, currencies, payout rules and local law.
- Add moderation, identity verification, report/block tools, reviews, cancellation/refund rules and support workflows.
- Review travel agency / guide licensing, local transport, insurance, tax, privacy and consumer-protection requirements country by country.
- Add translated UI strings and professional translations beyond Korean-first MVP.
- Add real PWA icons, offline behavior, push notification opt-in and store apps if needed.

## Security notes

- Never commit `.env` or API keys.
- Replace the fallback `AUTH_SECRET` before deployment.
- Do not use the development configuration with real customer data until the production checklist is completed.

## Revenue / booking foundation (v1.1)

Added:
- Guide proposal submission endpoint: `POST /api/proposals`
- Traveler proposal inbox endpoint: `GET /api/proposals` (optionally `?requestId=...`)
- Proposal acceptance endpoint: `POST /api/proposals/:id/accept`
- Booking and platform-fee records with an initial configurable-in-code 18% example rate
- Booking list endpoint/page: `GET /api/bookings`, `/bookings`
- Admin KPI page at `/admin` (requires an ADMIN role assigned securely outside public signup)
- Logout changed to POST
- Removed the insecure hard-coded AUTH_SECRET fallback; set a random secret of 32+ characters

### Important payment limitation
The booking acceptance flow creates a `PENDING_PAYMENT` booking and computes an illustrative 18% platform fee. It does **not** charge a card, collect money, refund a customer, or pay out a guide. Do not advertise a booking as paid/confirmed until a supported payment provider has been integrated and its webhook has verified payment. Payment-provider, currency, payout, tax and travel/transport compliance must be reviewed country by country.

### API examples
Guide submits a quote:
```json
POST /api/proposals
{"requestId":"REQUEST_ID","price":120000,"currency":"KRW","message":"현지에서 4시간 동안 맞춤 투어를 진행하겠습니다."}
```
Traveler accepts a quote:
```http
POST /api/proposals/PROPOSAL_ID/accept
```

### Before production
- Set `AUTH_SECRET` to a unique random value of at least 32 characters. The app now fails closed if it is missing/too short.
- Create/assign the first ADMIN account through a trusted database operation; never expose public admin-role assignment.
- Add email verification, password recovery, MFA for admins/guides, rate limiting, bot protection, audit logs and monitoring.
- Integrate a payment provider with signed webhook verification, idempotency, refunds and country-specific guide payouts.
- Add booking-verified reviews, moderation, identity verification, report/block and dispute workflows.
- Test migrations and full build against a staging Neon database before production deployment.

## Revenue / booking foundation (v1.1)

Added:
- Guide proposal submission endpoint: `POST /api/proposals`
- Traveler proposal inbox endpoint: `GET /api/proposals` (optionally `?requestId=...`)
- Proposal acceptance endpoint: `POST /api/proposals/:id/accept`
- Booking and platform-fee records with an initial illustrative 18% rate
- Booking list endpoint/page: `GET /api/bookings`, `/bookings`
- Admin KPI page at `/admin` (requires an ADMIN role assigned securely outside public signup)
- Logout changed to POST
- Removed the insecure hard-coded AUTH_SECRET fallback; set a random secret of 32+ characters

### Important payment limitation
The booking acceptance flow creates a `PENDING_PAYMENT` booking and computes an illustrative 18% platform fee. It does **not** charge a card, collect money, refund a customer, or pay out a guide. Do not advertise a booking as paid/confirmed until a supported payment provider has been integrated and its webhook has verified payment. Payment-provider, currency, payout, tax and travel/transport compliance must be reviewed country by country.

### API examples
Guide submits a quote:
```json
POST /api/proposals
{"requestId":"REQUEST_ID","price":120000,"currency":"KRW","message":"현지에서 4시간 동안 맞춤 투어를 진행하겠습니다."}
```
Traveler accepts a quote:
```http
POST /api/proposals/PROPOSAL_ID/accept
```

### Before production
- Set `AUTH_SECRET` to a unique random value of at least 32 characters. The app now fails closed if it is missing/too short.
- Create/assign the first ADMIN account through a trusted database operation; never expose public admin-role assignment.
- Add email verification, password recovery, MFA for admins/guides, rate limiting, bot protection, audit logs and monitoring.
- Integrate a payment provider with signed webhook verification, idempotency, refunds and country-specific guide payouts.
- Add booking-verified reviews, moderation, identity verification, report/block and dispute workflows.
- Test migrations and full build against a staging Neon database before production deployment.

### Database migration note
For this MVP, the Render build command can continue using `npx prisma db push` while developing. Before a production launch, use reviewed Prisma migrations and a staging database. The first administrator must be promoted manually by a trusted database operator, for example:
```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'your-admin-email@example.com';
```
Do not add a public endpoint or signup option that lets users choose `ADMIN`.
