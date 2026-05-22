import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import { useAuth } from "./hooks/useAuth";
import ChatRoom from "./pages/ChatRoom";
import Discovery from "./pages/Discovery";
import Login from "./pages/Login";
import Matches from "./pages/Matches";
import Profile from "./pages/Profile";
import Recharge from "./pages/Recharge";

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <main className="app-shell grid place-items-center text-roseDeep">Loading Friend Hub...</main>;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <Protected>
            <AppLayout>
              <Routes>
                <Route path="/" element={<Discovery />} />
                <Route path="/discovery" element={<Discovery />} />
                <Route path="/likes" element={<Matches mode="likes" />} />
                <Route path="/matches" element={<Matches />} />
                <Route path="/messages" element={<Matches mode="messages" />} />
                <Route path="/chat/:chatId" element={<ChatRoom />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/recharge" element={<Recharge />} />
              </Routes>
            </AppLayout>
          </Protected>
        }
      />
    </Routes>
  );
}
