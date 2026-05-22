# Razorpay Setup

1. Create Razorpay account.
2. Add `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` to `backend/.env`.
3. Add webhook URL:

```txt
https://your-api-domain.com/api/payments/webhook
```

4. Enable `payment.captured` event.

The backend verifies webhook signatures before crediting diamonds.
