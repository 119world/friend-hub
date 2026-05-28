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
    <nav className="fixed bottom-0 left-1/2 z-30 grid w-full max-w-[430px] -translate-x-1/2 grid-cols-5 border-t border-zinc-100 bg-white px-2 pb-9 pt-4">
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className="rounded-lg"
        >
          {({ isActive }) => (
            <span className={`flex flex-col items-center gap-1.5 px-1 py-1 text-[13px] font-medium ${isActive ? "text-[#f72565]" : "text-zinc-500"}`}>
              <Icon size={28} strokeWidth={2.2} fill={isActive ? "currentColor" : "none"} />
              <span className={isActive ? "font-bold" : ""}>{label}</span>
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
