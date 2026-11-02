/**
 * Settings: one page header, a section list on the left (a row of tabs on small screens),
 * and the chosen section on the right.
 */
import { Link, Outlet } from "@tanstack/react-router";
import { ArrowRight, CreditCard, UserRound } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import "@/styles/projects-dashboard.css";
import "@/styles/profile.css";
import "@/styles/settings.css";

const SECTIONS = [
  { to: "/settings/profile", label: "Profile", icon: UserRound },
  { to: "/settings/billing", label: "Billing", icon: CreditCard },
] as const;

export function SettingsShell() {
  return (
    <div className="dxs pf-page st-page">
      <header className="pf-top">
        <BrandLogo to="/" tagline="Product Super Intelligence" />
        <Link to="/command" className="pf-back">
          Back to Studio <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </header>
      <div className="st-layout">
        <nav className="st-nav" aria-label="Settings">
          <p className="st-nav-title">Settings</p>
          <ul>
            {SECTIONS.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <Link to={to} className="st-nav-link">
                  <Icon size={16} aria-hidden="true" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <main className="st-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
