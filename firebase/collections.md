# Firestore Collections

- `users`: user profile, online status, diamonds
- `partners`: verified partner profiles, pricing, welcome message
- `aiBots`: AI bot profile, personality, reply templates, free reply limit
- `chats`: chat metadata and participants
- `chats/{chatId}/messages`: realtime messages
- `payments`: Razorpay order and payment records
- `diamondWallets`: diamonds and voice minutes per user
- `plans`: admin-managed recharge plans
- `bankAccounts`: UPI/bank routing accounts with limits
- `apiKeys`: provider key metadata, never expose secret fields to frontend
- `appSettings`: voice preview seconds and global settings
- `reports`: block/report records
- `notifications`: FCM notification records
- `adminLogs`: backend/admin action log
- `replyTemplates`: admin-controlled message templates
