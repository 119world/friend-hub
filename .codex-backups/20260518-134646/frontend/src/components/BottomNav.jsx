import { Flame, Heart, MessageCircle, User, UsersRound } from "lucide-react";
import { NavLink } from "react-router-dom";

const items = [
  { to: "/discovery", label: "Discover", icon: Flame },
  { to: "/likes", label: "Likes", icon: Heart },
  { to: "/matches", label: "Matches", icon: UsersRound },
  { to: "/messages", label: "Messages", icon: MessageCircle },
  { to: "/profile", label: "Profile", icon: User }
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 z-30 grid w-full max-w-[430px] -translate-x-1/2 grid-cols-5 border-t border-zinc-100 bg-white px-2 pb-8 pt-4">
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className="rounded-lg"
        >
          {({ isActive }) => (
            <span className={`flex flex-col items-center gap-1 px-1 py-1 text-[11px] font-semibold ${isActive ? "text-[#f72565]" : "text-zinc-500"}`}>
              <Icon size={25} strokeWidth={2.2} fill={isActive ? "currentColor" : "none"} />
              <span>{label}</span>
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
