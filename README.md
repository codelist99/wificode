# WiFi Code funnel and campaign administration

## Verified production architecture

- Hosting: Vercel
- Production domain: `https://wificode.dev`
- Runtime: Node.js 22.5 or newer
- Database: dedicated Neon Postgres database (`neondb`)
- Database driver: `@neondatabase/serverless`
- Payment gateway: Authorize.Net
- Chargeback reporting: Zen Dashboard

The application requires `DATABASE_URL`. `lib/database.mjs` connects to it with the Neon serverless driver and ensures the required tables, columns, and indexes exist when the database is first used.

Use the pooled `DATABASE_URL` for the running application. Keep `DATABASE_URL_UNPOOLED` available for maintenance tasks such as schema work, dumps, and restores. WiFi Code must retain its own database connection; never copy another offer's database URL into this project.

The previous references to SQLite, `data/wificode.sqlite`, and a persistent application disk were obsolete. WiFi Code does not use those in the current production architecture.

## Local setup

Copy `.env.example` to `.env`, fill in the private values, then run `npm.cmd start` and open `/admin`. The start command loads `.env` automatically. Never commit `.env` or any production credential.

## Production configuration

The Vercel project must contain the applicable variables below. This list contains variable names only, never secret values.

- Database: `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, and the Neon/Postgres variables provisioned by the Vercel Neon integration
- Application security: `SESSION_SECRET`, `CRON_SECRET`, and `WEBHOOK_SECRET`
- Authorize.Net: `AUTHORIZE_NET_ENV`, `AUTHORIZE_NET_API_LOGIN_ID`, `AUTHORIZE_NET_TRANSACTION_KEY`, and `AUTHORIZE_NET_PUBLIC_CLIENT_KEY`
- Reporting and messaging, when enabled: Zen Dashboard, Resend, Twilio, and Cal.com variables used by the application

## Stored data

The Postgres schema includes leads, tracking events, orders, refunds, traffic-spend entries, chargebacks, automation records, messages, gateway profiles, synchronization state, and WiFi Code member/access records. Treat the database as production customer and payment-reporting infrastructure.

## Conversion webhook

Configure the JVZoo IPN/webhook URL as:

`https://YOUR-DOMAIN/api/webhooks/jvzoo?secret=YOUR_WEBHOOK_SECRET`

Sales and refunds join to leads using checkout email. Browser tracking records page views, checkout clicks, and forms containing an email or telephone field.

## Follow-ups

- Email: configure `RESEND_API_KEY` and a verified-domain `EMAIL_FROM`.
- SMS: configure `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM`.

Automations send only when a lead has consent for that channel. Templates support `{{first_name}}`, `{{last_name}}`, `{{email}}`, and `{{phone}}`.

## Deployment verification

Before changing production configuration, verify all three layers:

1. Code imports `@neondatabase/serverless` and reads `DATABASE_URL`.
2. The WiFi Code Vercel project has its own Neon/Postgres environment variables in the required environments.
3. The authenticated system audit reports the expected database and payment gateway.

Do not infer infrastructure from an old README or copy settings from CashTap AI, Push Button Cash, or another offer.
