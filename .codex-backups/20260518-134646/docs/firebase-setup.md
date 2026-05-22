# Firebase Setup

Enable these free-tier services:

- Authentication: Phone, Google, Anonymous
- Firestore Database
- Cloud Storage
- Cloud Messaging

Deploy rules:

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
```

The backend uses Firebase Admin SDK for secure writes to payments, wallets, bank accounts, API keys, plans, and admin resources.
