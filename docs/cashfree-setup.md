# Cashfree Setup

1. Create or open your Cashfree merchant account.
2. Add backend environment variables:

```env
CASHFREE_CLIENT_ID=
CASHFREE_CLIENT_SECRET=
CASHFREE_ENV=PRODUCTION
BACKEND_URL=https://your-backend-domain.com
```

3. Configure the Cashfree webhook URL:

```text
https://your-backend-domain.com/api/payments/webhook
```

4. Enable payment success and failure webhook events.

The backend verifies Cashfree webhook signatures before updating payment records or crediting wallets.
