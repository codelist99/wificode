# WifiCode funnel + lead management

## Local setup

Copy `.env.example` to `.env`, fill in the private values, then run `npm.cmd start` and open `/admin`. The start command loads `.env` automatically. Change the default admin password before deployment and never commit `.env`.

The application requires Node 22.5+ and stores data at `data/wificode.sqlite`. Production hosting needs a persistent disk.

## Conversion webhook

Configure the JVZoo IPN/webhook URL as:

`https://YOUR-DOMAIN/api/webhooks/jvzoo?secret=YOUR_WEBHOOK_SECRET`

Sales and refunds join to leads using checkout email. Browser tracking records page views, checkout clicks, and forms containing an email or telephone field.

## Follow-ups

- Email: configure `RESEND_API_KEY` and a verified-domain `EMAIL_FROM`.
- SMS: configure `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM`.

Automations send only when a lead has consent for that channel. Templates support `{{first_name}}`, `{{last_name}}`, `{{email}}`, and `{{phone}}`.

## Custom domain

Point the domain to the Node host, set `APP_URL`, attach persistent storage for `data/`, and enable HTTPS. The exact DNS records depend on the domain and hosting platform.
