import { Navigate, Route, Routes } from "react-router-dom";
import AdminLayout from "./components/AdminLayout";
import AdminLogin from "./pages/AdminLogin";
import Dashboard from "./pages/Dashboard";
import MediaManager from "./pages/MediaManager";
import Moderation from "./pages/Moderation";
import ResourcePage from "./pages/ResourcePage";
import { hasAdminSession } from "./services/adminApi";

function Guard({ children }) {
  return hasAdminSession() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AdminLogin />} />
      <Route path="/" element={<Guard><AdminLayout /></Guard>}>
        <Route index element={<Dashboard />} />
        <Route path="moderation" element={<Moderation />} />
        <Route path="users" element={<ResourcePage title="Users" endpoint="/admin/users" fields={["name", "age", "gender", "city", "diamonds", "referralCode", "referralCount", "active"]} />} />
        <Route path="partners" element={<ResourcePage title="Partners" endpoint="/admin/partners" fields={["id", "name", "age", "gender", "city", "location", "distanceKm", "lat", "lng", "profession", "bio", "interests", "photos", "videos", "welcomeMessage", "firstReply", "secondReply", "freeReplyLimit", "delayMs", "online", "verified", "showInDiscovery", "showInMatches", "allowAutoContact", "chatPrice", "voiceCallPrice", "active"]} />} />
        <Route path="bots" element={<ResourcePage title="AI Bots" endpoint="/admin/aiBots" fields={["id", "name", "age", "gender", "city", "location", "distanceKm", "lat", "lng", "bio", "personality", "personalityConfig", "welcomeMessage", "firstReply", "secondReply", "freeReplyLimit", "delayMs", "photos", "galleryPhotos", "videos", "online", "verified", "showInDiscovery", "showInMatches", "allowAutoContact", "active"]} />} />
        <Route path="chats" element={<ResourcePage title="Chats" endpoint="/admin/chats" fields={["userId", "targetId", "targetType", "reported", "blocked"]} />} />
        <Route path="payments" element={<ResourcePage title="Payments" endpoint="/admin/payments" fields={["userId", "amount", "status", "orderId", "paymentId", "manualTransactionId", "userNote", "verifiedByAdmin"]} />} />
        <Route path="plans" element={<ResourcePage title="Recharge Plans" endpoint="/admin/plans" fields={["id", "title", "originalPrice", "price", "diamonds", "minutes", "subscription", "autoPay", "autoPayAmount", "renewEveryDays", "gatewayPreference", "razorpayPlanId", "gatewayPlanId", "totalCycles", "active"]} />} />
        <Route path="offers" element={<ResourcePage title="Offers" endpoint="/admin/offers" fields={["title", "bannerUrl", "price", "originalPrice", "discount", "active", "startsAt", "endsAt"]} />} />
        <Route path="media" element={<MediaManager />} />
        <Route path="banks" element={<ResourcePage title="Bank / UPI Accounts" endpoint="/admin/bankAccounts" fields={["bankName", "accountHolderName", "upiId", "qrImage", "dailyLimit", "weeklyLimit", "monthlyLimit", "yearlyLimit", "usedAmount", "remainingLimit", "active", "priority"]} />} />
        <Route path="payment-accounts" element={<ResourcePage title="Payment Accounts" endpoint="/admin/paymentAccounts" fields={["id", "gateway", "label", "keyId", "keySecret", "webhookSecret", "upiId", "qrImage", "dailyLimit", "weeklyLimit", "monthlyLimit", "yearlyLimit", "usedAmount", "autoRecycleOnExhaustion", "active", "priority"]} />} />
        <Route path="api-keys" element={<ResourcePage title="Multi API Keys" endpoint="/admin/apiKeys" fields={["providerName", "apiKey", "secretKey", "dailyLimit", "monthlyLimit", "usedCount", "remainingCount", "errorCount", "autoRecycleOnExhaustion", "active", "priority", "lastUsedTime"]} />} />
        <Route path="admin-accounts" element={<ResourcePage title="Admin Accounts" endpoint="/admin/adminAccounts" fields={["id", "loginId", "displayName", "password", "role", "active"]} />} />
        <Route path="partner-accounts" element={<ResourcePage title="Partner Accounts" endpoint="/admin/partnerAccounts" fields={["id", "partnerId", "loginId", "displayName", "temporaryAccessCode", "active"]} />} />
        <Route path="settings" element={<ResourcePage title="App Settings" endpoint="/admin/appSettings" fields={["id", "title", "subtitle", "bgPhoto", "welcomeBgPhoto", "primaryColor", "freePreviewSeconds", "ratePerMinute", "maintenanceMode", "maintenanceTitle", "maintenanceMessage", "maintenanceActionLabel", "maintenanceActionUrl", "active"]} />} />
        <Route path="templates" element={<ResourcePage title="Auto Reply Templates" endpoint="/admin/replyTemplates" fields={["id", "welcomeMessage", "firstReply", "secondReply", "keywords", "delayMs", "replyLimit", "limitReachedMessage", "rechargeMessage", "promotionalOfferId", "voiceCallLockedMessage"]} />} />
        <Route path="auto-replies" element={<ResourcePage title="Keyword Auto Replies" endpoint="/admin/autoReplies" fields={["title", "keywords", "replyText", "delayMs", "replyLimit", "rechargeTrigger", "offerTrigger", "active"]} />} />
        <Route path="referrals" element={<ResourcePage title="Referral Bonuses" endpoint="/admin/referralRules" fields={["id", "requiredReferrals", "bonusDiamonds", "title", "active"]} />} />
        <Route path="subscriptions" element={<ResourcePage title="Subscriptions" endpoint="/admin/subscriptions" fields={["userId", "planId", "price", "status", "startedAt", "renewAt", "cancelledAt", "active"]} />} />
        <Route path="calls" element={<ResourcePage title="Call Sessions" endpoint="/admin/callSessions" fields={["userId", "targetId", "mode", "status", "seconds", "diamondsDeducted", "createdAt"]} />} />
        <Route path="refunds" element={<ResourcePage title="Refund Requests" endpoint="/admin/refundRequests" fields={["id", "userId", "orderId", "paymentId", "amount", "reason", "status", "adminNote", "active"]} />} />
      </Route>
    </Routes>
  );
}
