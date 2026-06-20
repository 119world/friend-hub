# Friend Hub

Low-budget Firebase + React MVP for login, profiles, friend discovery, connections, realtime chat, voice-call billing button, Cashfree recharge, moderation, and admin controls.

## Apps

- `frontend`: user mobile-first web app
- `admin`: admin dashboard
- `backend`: Express API with Firebase Admin and Cashfree
- `firebase`: Firestore and Storage rules

## Quick Start

```bash
npm run install:all
cp frontend/.env.example frontend/.env
cp admin/.env.example admin/.env
cp backend/.env.example backend/.env
npm run dev
```

Frontend: http://localhost:5173  
Admin: http://localhost:5174  
Backend: http://localhost:8080

## VS Code Live Server note

Do not open `frontend/index.html` or `admin/index.html` directly with Live Server for development. These are Vite React apps, so JSX and module imports must be processed by Vite:

```bash
npm run dev
```

For static preview with Live Server, build first and serve `frontend/dist` or `admin/dist`. Vite is configured with relative asset paths so built files can be served from static folders more reliably.
