# Friend Hub Environment Setup

Use these files for keys and URLs. Do not paste real secret keys into frontend code except Firebase Web App keys, because Vite frontend values are public in the browser.

## 1. User Frontend

File:

```text
I:\Friend Hub\frontend\.env
```

Copy from:

```text
I:\Friend Hub\frontend\.env.example
```

Structure:

```env
VITE_API_URL=https://friend-hub-backend.onrender.com/api
# Optional fallback if VITE_API_URL is not set:
# VITE_API_BASE_URL=https://friend-hub-backend.onrender.com
VITE_ADMIN_APP_URL=
VITE_FIREBASE_API_KEY=xxxx
VITE_FIREBASE_AUTH_DOMAIN=xxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=xxxx
VITE_FIREBASE_STORAGE_BUCKET=xxxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=xxxx
VITE_FIREBASE_APP_ID=xxxx
VITE_FIREBASE_VAPID_KEY=xxxx
```

Google login needs these Firebase settings:

- Enable Authentication > Sign-in method > Google in Firebase Console.
- Add your live frontend domain in Authentication > Settings > Authorized domains.
- Add localhost while testing locally.

## 2. Admin Frontend

File:

```text
I:\Friend Hub\admin\.env
```

Copy from:

```text
I:\Friend Hub\admin\.env.example
```

Structure:

```env
VITE_API_URL=https://friend-hub-backend.onrender.com/api
# Optional fallback if VITE_API_URL is not set:
# VITE_API_BASE_URL=https://friend-hub-backend.onrender.com
```

The admin frontend uses JWT login through the backend. Do not put backend admin secrets in Vite env.

## 3. Backend API

File:

```text
I:\Friend Hub\backend\.env
```

Copy from:

```text
I:\Friend Hub\backend\.env.example
```

Structure:

```env
PORT=8080
NODE_ENV=production
CLIENT_URL=https://friend-hub-pi.vercel.app
ADMIN_URL=https://friend-hub-pi.vercel.app
CORS_ORIGINS=https://friend-hub-pi.vercel.app
ADMIN_TOKEN=replace-with-long-random-admin-token
ADMIN_USERNAME=replace-with-admin-username
ADMIN_PASSWORD=replace-with-strong-admin-password
DEFAULT_PARTNER_LOGIN_ID=replace-with-partner-login-id
DEFAULT_PARTNER_PASSWORD=replace-with-partner-password
JWT_SECRET=change-this-long-random-jwt-secret
FIREBASE_PROJECT_ID=xxxx
FIRESTORE_ENABLED=true
FIREBASE_STORAGE_BUCKET=xxxx.firebasestorage.app
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@xxxx.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nPASTE_PRIVATE_KEY_WITH_N_SLASHES_HERE\n-----END PRIVATE KEY-----\n"
CLOUDINARY_CLOUD_NAME=xxxx
CLOUDINARY_API_KEY=xxxx
CLOUDINARY_API_SECRET=xxxx
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=xxxx
RAZORPAY_WEBHOOK_SECRET=xxxx
```

Razorpay webhook URL:

```text
https://friend-hub-backend.onrender.com/api/payments/webhook
```

## 4. Admin-Managed Keys

These are not required in `.env` because the admin dashboard stores them in Firestore:

- Extra Razorpay accounts
- UPI/QR payment accounts
- API key failover entries
- Recharge plans
- Partner profiles
- Bot profiles
- Media uploads

Cloudinary is the preferred low-budget media upload provider in this project. It is used for admin partner/bot media and chat attachments when `CLOUDINARY_*` keys are present.

After changing any `.env` file, restart the backend/frontend/admin server.
