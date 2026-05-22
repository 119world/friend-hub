import AutoEngagement from "./AutoEngagement";
import BottomNav from "./BottomNav";

export default function AppLayout({ children }) {
  return (
    <main className="app-shell pb-24">
      {children}
      <AutoEngagement />
      <BottomNav />
      <span className="ios-home-bar" />
    </main>
  );
}
