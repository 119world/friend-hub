# Firestore Collections

- `users`: user profile, online status, diamonds
- `partners`: verified partner profiles, pricing, welcome message
- `aiBots`: AI bot profile, personality, reply templates, free reply limit
- `chats`: chat metadata and participants
- `chats/{chatId}/messages`: realtime messages
- `payments`: Cashfree order and payment records with `order_id`, `payment_id`, `user_id`, `amount`, `currency`, `status`, `created_at`, `updated_at`
- `diamondWallets`: diamonds and voice minutes per user
- `plans`: admin-managed recharge plans
- `apiKeys`: provider key metadata, never expose secret fields to frontend
- `appSettings`: voice preview seconds and global settings
- `reports`: block/report records
- `notifications`: FCM notification records
- `adminLogs`: backend/admin action log
- `replyTemplates`: admin-controlled message templates
