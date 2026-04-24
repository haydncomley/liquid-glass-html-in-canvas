import type { ComponentType } from "react";
import { House, LayoutGrid, Radio, Library, Search } from "lucide-react";
import { NavLink } from "react-router-dom";
import { LiquidGlass } from "./liquid-glass";
import "./NavigationBar.scss";

type LucideIcon = ComponentType<{ size?: number; strokeWidth?: number }>;

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
};

const items: NavItem[] = [
  { to: "/", label: "Home", icon: House },
  { to: "/new", label: "New", icon: LayoutGrid },
  { to: "/radio", label: "Radio", icon: Radio },
  { to: "/library", label: "Library", icon: Library },
];

export function NavigationBar() {
  return (
    <nav className="nav-bar" aria-label="Primary">
      <LiquidGlass className="nav-bar__pill">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `nav-bar__item${isActive ? " is-active" : ""}`
            }
          >
            <Icon size={24} strokeWidth={2} />
            <span>{label}</span>
          </NavLink>
        ))}
      </LiquidGlass>

      <LiquidGlass className="nav-bar__search">
        <button
          type="button"
          className="nav-bar__search-btn"
          aria-label="Search"
        >
          <Search size={24} strokeWidth={2} />
        </button>
      </LiquidGlass>
    </nav>
  );
}
