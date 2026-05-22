import { Navigate, Route, Routes } from "react-router-dom";
import AdminLayout from "./components/AdminLayout";
import AdminLogin from "./pages/AdminLogin";
import Dashboard from "./pages/Dashboard";
import ResourcePage from "./pages/ResourcePage";

function Guard({ children }) {
  return localStorage.getItem("friendHubAdminToken") || import.meta.env.VITE_ADMIN_TOKEN ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AdminLogin />} />
      <Route path="/" element={<Guard><AdminLayout /></Guard>}>
        <Route index element={<Dashboard />} />
        <Route path="users" element={<ResourcePage title="Users" endpoint="/admin/users" fields={["name", "age", "gender", "city", "diamonds", "active"]} />} />
        <Route path="partners" element={<ResourcePage title="Partners" endpoint="/admin/partners" fields={["name", "age", "gender", "city", "chatPrice", "voiceCallPrice", "active"]} />} />
        <Route path="bots" element={<ResourcePage title="AI Bots" endpoint="/admin/aiBots" fields={["name", "age", "city", "personality", "welcomeMessage", "firstReply", "secondReply", "freeReplyLimit", "active"]} />} />
        <Route path="chats" element={<ResourcePage title="Chats" endpoint="/admin/chats" fields={["userId", "targetId", "targetType", "reported", "blocked"]} />} />
        <Route path="payments" element={<ResourcePage title="Payments" endpoint="/admin/payments" fields={["userId", "amount", "status", "orderId", "paymentId"]} />} />
        <Route path="plans" element={<ResourcePage title="Recharge Plans" endpoint="/admin/plans" fields={["title", "originalPrice", "price", "diamonds", "minutes", "active"]} />} />
        <Route path="banks" element={<ResourcePage title="Bank / UPI Accounts" endpoint="/admin/bankAccounts" fields={["bankName", "accountHolderName", "upiId", "qrImage", "dailyLimit", "weeklyLimit", "monthlyLimit", "yearlyLimit", "usedAmount", "remainingLimit", "active", "priority"]} />} />
        <Route path="api-keys" element={<ResourcePage title="Multi API Keys" endpoint="/admin/apiKeys" fields={["providerName", "apiKey", "secretKey", "dailyLimit", "monthlyLimit", "usedCount", "remainingCount", "errorCount", "active", "priority", "lastUsedTime"]} />} />
        <Route path="settings" element={<ResourcePage title="App Settings" endpoint="/admin/appSettings" fields={["id", "title", "subtitle", "bgPhoto", "welcomeBgPhoto", "primaryColor", "freePreviewSeconds", "ratePerMinute", "active"]} />} />
        <Route path="templates" element={<ResourcePage title="Reply Templates" endpoint="/admin/replyTemplates" fields={["welcomeMessage", "firstReply", "secondReply", "limitReachedMessage", "rechargeMessage", "voiceCallLockedMessage"]} />} />
      </Route>
    </Routes>
  );
}
