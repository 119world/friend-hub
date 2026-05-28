import { Flame, Home, MessageCircle, User, UsersRound } from "lucide-react";
import { NavLink } from "react-router-dom";

const items = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/discovery", label: "Discover", icon: Flame },
  { to: "/matches", label: "Connections", icon: UsersRound },
  { to: "/messages", label: "Chat", icon: MessageCircle },
  { to: "/profile", label: "Profile", icon: User }
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 z-30 grid w-full max-w-[430px] -translate-x-1/2 grid-cols-5 border-t border-zinc-100 bg-white px-1 pb-[calc(.5rem+env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-10px_30px_rgba(15,23,42,.05)]">
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className="rounded-lg"
        >
          {({ isActive }) => (
            <span className={`flex min-h-14 flex-col items-center justify-center gap-1 px-0.5 py-1 text-[11px] font-medium leading-none min-[390px]:text-[12px] ${isActive ? "text-[#f72565]" : "text-zinc-500"}`}>
              <Icon size={24} strokeWidth={2.2} fill={isActive ? "currentColor" : "none"} />
              <span className={`max-w-full truncate ${isActive ? "font-bold" : ""}`}>{label}</span>
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
