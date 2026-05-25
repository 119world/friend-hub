import AutoEngagement from "./AutoEngagement";
import BottomNav from "./BottomNav";
import { Link, useLocation } from "react-router-dom";

export default function AppLayout({ children }) {
  const location = useLocation();
  const isRechargePage = location.pathname.startsWith("/recharge");

  return (
    <main className={`app-shell ${isRechargePage ? "" : "pb-24"}`}>
      {children}
      {!isRechargePage && (
        <>
          <footer className="mx-auto mb-24 mt-4 w-full max-w-[430px] px-4 text-center text-[11px] font-medium text-zinc-500">
            <p>Friend Hub is a social networking and friendship platform. It is not an adult, escort, or matrimonial service.</p>
            <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1">
              <Link to="/about" className="text-[#f72565]">About Us</Link>
              <Link to="/contact" className="text-[#f72565]">Contact Us</Link>
              <Link to="/privacy" className="text-[#f72565]">Privacy Policy</Link>
              <Link to="/terms" className="text-[#f72565]">Terms</Link>
              <Link to="/refund" className="text-[#f72565]">Refund Policy</Link>
              <Link to="/safety" className="text-[#f72565]">User Safety</Link>
              <Link to="/abuse" className="text-[#f72565]">Report Abuse</Link>
            </div>
          </footer>
          <AutoEngagement />
          <BottomNav />
          <span className="ios-home-bar" />
        </>
      )}
    </main>
  );
}
