# Friend Hub Live Deployment A to Z

This project has three deployable apps:

- `backend`: Node/Express API for Render
- `frontend`: Vite user app for Vercel
- `admin`: Vite admin app for Vercel

Do not commit real `.env` files or private keys.

## 1. Pre-Deploy Checks

Run these locally before deploying:

```bash
cd backend
npm install
npm start
```

Backend health should work:

```text
http://localhost:8080/health
```

Build frontend:

```bash
cd frontend
npm install
npm run build
```

Build admin:

```bash
cd admin
npm install
npm run build
```

## 2. Backend on Render

Recommended Render settings:

- Service type: Web Service
- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`
- Health check path: `/health`
- Plan: Free for demo/start

You can also use the root `render.yaml` blueprint. Render will ask for secret values where `sync: false` is used.

Backend environment variables:

```env
NODE_ENV=production
FIRESTORE_ENABLED=true
CLIENT_URL=https://your-user-app.vercel.app
ADMIN_URL=https://your-admin-app.vercel.app
ADMIN_TOKEN=make-a-long-random-token
ADMIN_USERNAME=mdibrahim
ADMIN_PASSWORD=change-this-before-public-launch
DEFAULT_PARTNER_LOGIN_ID=sonu119
DEFAULT_PARTNER_PASSWORD=change-this-before-public-launch
JWT_SECRET=make-a-long-random-secret

FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-bucket
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nPASTE_KEY_WITH_N_SLASHES\n-----END PRIVATE KEY-----\n"

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

RAZORPAY_KEY_ID=rzp_test_or_live_key
RAZORPAY_KEY_SECRET=your-razorpay-secret
RAZORPAY_WEBHOOK_SECRET=your-webhook-secret
```

After Render deploys, check:

```text
https://your-render-service.onrender.com/health
https://your-render-service.onrender.com/api/public/profiles
```

## 3. Frontend on Vercel

Create a Vercel project for `frontend`.

Settings:

- Root directory: `frontend`
- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`

Frontend environment variables:

```env
VITE_API_BASE_URL=https://your-render-service.onrender.com
VITE_ADMIN_APP_URL=https://your-admin-app.vercel.app/login
VITE_FIREBASE_API_KEY=your-web-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_VAPID_KEY=your-vapid-key
VITE_USE_FIRESTORE=false
```

The app automatically adds `/api` to `VITE_API_BASE_URL`.

## 4. Admin on Vercel

Create a second Vercel project for `admin`.

Settings:

- Root directory: `admin`
- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`

Admin environment variables:

```env
VITE_API_BASE_URL=https://your-render-service.onrender.com
VITE_ADMIN_TOKEN=same-value-as-backend-ADMIN_TOKEN
```

## 5. Connect URLs

After both Vercel apps are live, update Render environment variables:

```env
CLIENT_URL=https://your-user-app.vercel.app
ADMIN_URL=https://your-admin-app.vercel.app
```

Then redeploy/restart the Render backend so CORS allows both apps.

## 6. Firebase Console

In Firebase Console:

- Authentication > Settings > Authorized domains
- Add both Vercel domains
- Add your future custom domain if you buy one

If Google login is enabled, make sure Google provider is enabled in Firebase Authentication.

## 7. Razorpay

In Razorpay Dashboard:

- Keep test keys for testing
- Change to live keys later in Render env variables
- Set webhook URL:

```text
https://your-render-service.onrender.com/api/payments/webhook
```

Webhook secret must match `RAZORPAY_WEBHOOK_SECRET`.

For subscription/autopay later:

- Create Razorpay subscription plan in Razorpay dashboard
- Copy Razorpay plan id
- Add it in Admin > Recharge Plans as `razorpayPlanId` or `gatewayPlanId`

## 8. Cloudinary

Cloudinary keys must be set on backend Render only. Frontend does not need Cloudinary secrets.

Admin media upload flow:

- Admin uploads media
- Backend uploads it to Cloudinary
- Returned URL can be saved into partner, bot, banner, plan, or setting fields

## 9. Important Free-Tier Warning

Render free service can sleep after inactivity.

Also, do not run production with `FIRESTORE_ENABLED=false`. Backend local JSON data is not a durable production database on Render. It is fine for demo/testing only; production should use a durable free-tier database:

- Firebase Firestore free quota
- Supabase free tier
- Neon Postgres free tier
- MongoDB Atlas free tier

Use Firestore or another durable DB before real public launch if profile data, admin data, partner media, payment accounts, and API keys must survive redeploys.

## 10. Final Live QA

After deployment, check:

- Backend `/health`
- Frontend welcome page
- `Get Started` direct login
- Google login
- Discovery profiles from backend
- Admin login
- Admin partner/bot create/update
- Admin media upload
- Recharge plan list
- Razorpay test order
- Maintenance mode on/off
- Mobile layout
