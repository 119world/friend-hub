import BottomNav from "./BottomNav";

export default function AppLayout({ children }) {
  return (
    <main className="app-shell pb-24">
      {children}
      <BottomNav />
    </main>
  );
}
