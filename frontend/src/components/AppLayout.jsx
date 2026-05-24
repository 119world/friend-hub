import AutoEngagement from "./AutoEngagement";
import BottomNav from "./BottomNav";
import { useLocation } from "react-router-dom";

export default function AppLayout({ children }) {
  const location = useLocation();
  const isRechargePage = location.pathname.startsWith("/recharge");

  return (
    <main className={isRechargePage ? "min-h-screen bg-[#f7f7fb]" : "app-shell pb-24"}>
      {children}
      {!isRechargePage && (
        <>
          <AutoEngagement />
          <BottomNav />
          <span className="ios-home-bar" />
        </>
      )}
    </main>
  );
}
