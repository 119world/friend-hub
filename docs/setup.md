# Setup

1. Install dependencies:

```bash
npm run install:all
```

2. Copy environment files:

```bash
cp frontend/.env.example frontend/.env
cp admin/.env.example admin/.env
cp backend/.env.example backend/.env
```

3. Add Firebase web config in `frontend/.env`.

4. Add Firebase Admin service account values and Cashfree keys in `backend/.env`.

5. Run all apps:

```bash
npm run dev
```

Frontend: `http://localhost:5173`  
Admin: `http://localhost:5174`  
Backend: `http://localhost:8080`
