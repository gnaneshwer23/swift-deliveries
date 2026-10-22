import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, Menu, X } from "lucide-react";
import { AccountMenu } from "./account-menu";
import { useSession } from "@/hooks/use-session";
import { BrandLogo } from "@/components/brand-logo";
import {
  ProductDiscoveryIcon,
  ProductPrdIcon,
  ProductPrototypeIcon,
  ProductImproveIcon,
  MissionPlannerIcon,
  ApprovalGateIcon,
  BudgetShieldIcon,
} from "./motion-product-visuals";

const FEATURE_ITEMS = [
  {
    href: "/#feature-discovery",
    title: "AI Product Discovery",
    desc: "Investigate strategic decisions with sourced facts vs assumptions",
    icon: ProductDiscoveryIcon,
  },
  {
    href: "/#feature-prototype",
    title: "AI PRD & Specs",
    desc: "Structured requirements, acceptance criteria & trade-off matrices",
    icon: ProductPrdIcon,
  },
  {
    href: "/#feature-prototype",
    title: "AI Sandboxed Prototyper",
    desc: "Interactive HTML/UI states inside an isolated preview sandbox",
    icon: ProductPrototypeIcon,
  },
  {
    href: "/#feature-improve",
    title: "AI Flow Diagnostics",
    desc: "Funnel drop-off root-cause analysis & bounded remediation plans",
    icon: ProductImproveIcon,
  },
  {
    href: "/#feature-lifecycle",
    title: "AI Mission Planner",
    desc: "Task dependency graphs routed to 12 verified specialist capabilities",
    icon: MissionPlannerIcon,
  },
  {
    href: "/#feature-lifecycle",
    title: "Human Approval Gates",
    desc: "4-tier permission ladder (Plan → Create → Internal → External)",
    icon: ApprovalGateIcon,
  },
  {
    href: "/#feature-governance",
    title: "Hard-Stop Budget Ceilings",
    desc: "Deterministic workspace credit cap with zero silent overspend",
    icon: BudgetShieldIcon,
  },
] as const;

const USE_CASE_ITEMS = [
  {
    href: "/#use-cases",
    title: "Product Managers & Leads",
    desc: "Turn ambiguous product briefs into decision memos, PRDs, and prototypes",
  },
  {
    href: "/#use-cases",
    title: "Founders & SaaS Teams",
    desc: "Run a supervised AI product workforce without hiring 6 separate agencies",
  },
  {
    href: "/#use-cases",
    title: "Product Ops & PMO Sponsors",
    desc: "Enforce permission tiers, budget hard-stops, and audit trails across missions",
  },
  {
    href: "/experience",
    title: "PM Career Evidence (Experience & Prove)",
    desc: "Build externally attested product artefacts for your PM career portfolio",
  },
] as const;

export function MarketingNav() {
  const [open, setOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<"features" | "useCases" | null>(null);
  const { user, loading } = useSession();

  return (
    <header
      className="nav motion-nav"
      onMouseLeave={() => setOpenDropdown(null)}
    >
      <div className="flex items-center gap-8">
        <BrandLogo />

        <nav className="nav-links motion-nav-links" aria-label="Primary navigation">
          {/* Features Dropdown */}
          <div
            className="motion-nav-dropdown-wrap"
            onMouseEnter={() => setOpenDropdown("features")}
          >
            <button
              type="button"
              className="motion-nav-trigger"
              aria-expanded={openDropdown === "features"}
              onClick={() =>
                setOpenDropdown((prev) => (prev === "features" ? null : "features"))
              }
            >
              <span>Product AI Features</span>
              <ChevronDown className="size-3.5 opacity-70" />
            </button>

            {openDropdown === "features" && (
              <div className="motion-dropdown-panel motion-dropdown-wide">
                <div className="motion-dropdown-header">
                  <span>SUPERVISED PRODUCT WORKFORCE SUITE</span>
                  <Link to="/how-it-works" onClick={() => setOpenDropdown(null)}>
                    Architecture overview →
                  </Link>
                </div>
                <div className="motion-dropdown-grid">
                  {FEATURE_ITEMS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <a
                        key={item.title}
                        href={item.href}
                        className="motion-dropdown-item"
                        onClick={() => setOpenDropdown(null)}
                      >
                        <div className="motion-dropdown-icon">
                          <Icon className="size-5" />
                        </div>
                        <div>
                          <strong>{item.title}</strong>
                          <span>{item.desc}</span>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Use Cases Dropdown */}
          <div
            className="motion-nav-dropdown-wrap"
            onMouseEnter={() => setOpenDropdown("useCases")}
          >
            <button
              type="button"
              className="motion-nav-trigger"
              aria-expanded={openDropdown === "useCases"}
              onClick={() =>
                setOpenDropdown((prev) => (prev === "useCases" ? null : "useCases"))
              }
            >
              <span>Solutions</span>
              <ChevronDown className="size-3.5 opacity-70" />
            </button>

            {openDropdown === "useCases" && (
              <div className="motion-dropdown-panel">
                <div className="motion-dropdown-header">
                  <span>BY PRODUCT ROLE &amp; WORKFLOW</span>
                </div>
                <div className="motion-dropdown-list">
                  {USE_CASE_ITEMS.map((item) => (
                    <a
                      key={item.title}
                      href={item.href}
                      className="motion-dropdown-item"
                      onClick={() => setOpenDropdown(null)}
                    >
                      <div>
                        <strong>{item.title}</strong>
                        <span>{item.desc}</span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          <a href="/#how-it-works" onClick={() => setOpenDropdown(null)}>
            Lifecycle
          </a>
          <a href="/#capabilities" onClick={() => setOpenDropdown(null)}>
            Capabilities
          </a>
          <Link to="/how-it-works" onClick={() => setOpenDropdown(null)}>
            How it works
          </Link>
          <Link to="/pricing" onClick={() => setOpenDropdown(null)}>
            Pricing
          </Link>
        </nav>
      </div>

      <div className="nav-right">
        {!loading && user ? (
          <>
            <Link to="/command" className="btn-nav motion-btn-nav-primary hidden sm:inline-flex">
              Open Command Centre →
            </Link>
            <AccountMenu user={user} />
          </>
        ) : (
          <>
            <Link to="/login" className="btn-nav hidden sm:inline-flex">
              Sign in
            </Link>
            <Link to="/signup" className="btn-nav motion-btn-nav-primary">
              Try DeliverX for free
            </Link>
          </>
        )}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="btn-nav inline-flex md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </div>

      {open && (
        <div
          className="absolute inset-x-0 top-16 border-b bg-white px-4 pb-5 pt-3 shadow-lg md:hidden z-50"
          style={{ borderColor: "var(--x-border)" }}
        >
          <nav className="flex flex-col" aria-label="Mobile navigation">
            <a
              href="/#feature-discovery"
              onClick={() => setOpen(false)}
              className="border-b py-3 text-sm font-medium text-[#101828]"
              style={{ borderColor: "var(--x-border)" }}
            >
              Product AI Features
            </a>
            <a
              href="/#use-cases"
              onClick={() => setOpen(false)}
              className="border-b py-3 text-sm font-medium text-[#101828]"
              style={{ borderColor: "var(--x-border)" }}
            >
              Solutions
            </a>
            <a
              href="/#how-it-works"
              onClick={() => setOpen(false)}
              className="border-b py-3 text-sm font-medium text-[#101828]"
              style={{ borderColor: "var(--x-border)" }}
            >
              Lifecycle
            </a>
            <a
              href="/#capabilities"
              onClick={() => setOpen(false)}
              className="border-b py-3 text-sm font-medium text-[#101828]"
              style={{ borderColor: "var(--x-border)" }}
            >
              Capabilities
            </a>
            <Link
              to="/how-it-works"
              onClick={() => setOpen(false)}
              className="border-b py-3 text-sm font-medium text-[#101828]"
              style={{ borderColor: "var(--x-border)" }}
            >
              How it works
            </Link>
            <Link
              to="/pricing"
              onClick={() => setOpen(false)}
              className="border-b py-3 text-sm font-medium text-[#101828]"
              style={{ borderColor: "var(--x-border)" }}
            >
              Pricing
            </Link>
            {!user && (
              <div className="mt-3 flex flex-col gap-2">
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="btn btn-secondary justify-center"
                >
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setOpen(false)}
                  className="btn motion-btn-primary justify-center"
                >
                  Try DeliverX for free
                </Link>
              </div>
            )}
            {user ? (
              <Link
                to="/command"
                onClick={() => setOpen(false)}
                className="mt-3 btn motion-btn-primary justify-center"
              >
                Open Command Centre →
              </Link>
            ) : null}
          </nav>
        </div>
      )}
    </header>
  );
}
