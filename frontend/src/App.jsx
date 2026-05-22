import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import MaintenanceGate from "./components/MaintenanceGate";
import { useAuth } from "./hooks/useAuth";

const ChatRoom = lazy(() => import("./pages/ChatRoom"));
const Discovery = lazy(() => import("./pages/Discovery"));
const Login = lazy(() => import("./pages/Login"));
const Matches = lazy(() => import("./pages/Matches"));
const PartnerPortal = lazy(() => import("./pages/PartnerPortal"));
const Profile = lazy(() => import("./pages/Profile"));
const Recharge = lazy(() => import("./pages/Recharge"));
const TargetProfile = lazy(() => import("./pages/TargetProfile"));

function PageLoader() {
  return <main className="app-shell grid place-items-center text-roseDeep">Loading Friend Hub...</main>;
}

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <main className="app-shell grid place-items-center text-roseDeep">Loading Friend Hub...</main>;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <MaintenanceGate>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/partner" element={<PartnerPortal />} />
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
                    <Route path="/people/:targetId" element={<TargetProfile />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/recharge" element={<Recharge />} />
                  </Routes>
                </AppLayout>
              </Protected>
            }
          />
        </Routes>
      </Suspense>
    </MaintenanceGate>
  );
}
