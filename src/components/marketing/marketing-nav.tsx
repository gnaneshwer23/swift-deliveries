import { useEffect, useId, useRef, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronDown, Menu, X } from "lucide-react";
import { AccountMenu } from "./account-menu";
import { useSession } from "@/hooks/use-session";
import { BrandLogo } from "@/components/brand-logo";

import { PRODUCT_LINKS, EXPLORE_LINKS } from "./marketing-navigation";

const LINKS = [
  { to: "/how-it-works", label: "How it works" },
  { to: "/learn", label: "Learn" },
  { to: "/pricing", label: "Pricing & Pilot" },
] as const;

const DESKTOP_NAV = "(min-width: 960px)";

export function MarketingNav() {
  const [open, setOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const productRef = useRef<HTMLDivElement>(null);
  const productToggleRef = useRef<HTMLButtonElement>(null);
  const productMenuId = useId();
  const { user, loading } = useSession();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const menuId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const desktop = window.matchMedia(DESKTOP_NAV);
    const closeOnDesktop = () => {
      if (desktop.matches) setOpen(false);
    };
    closeOnDesktop();
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  useEffect(() => {
    if (!open || window.matchMedia(DESKTOP_NAV).matches) return;
    menuRef.current?.querySelector<HTMLElement>("a")?.focus();
  }, [open]);

  useEffect(() => {
    if (!productOpen) return;
    const onOutside = (event: PointerEvent) => {
      if (!productRef.current?.contains(event.target as Node)) setProductOpen(false);
    };
    document.addEventListener("pointerdown", onOutside);
    return () => document.removeEventListener("pointerdown", onOutside);
  }, [productOpen]);

  const close = () => {
    setOpen(false);
    toggleRef.current?.focus();
  };

  return (
    <header
      className="nav motion-nav dxn"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          if (open) close();
          if (productOpen) {
            setProductOpen(false);
            productToggleRef.current?.focus();
          }
        }
      }}
    >
      <div className="dxn-left">
        <BrandLogo tagline="Product Super Intelligence" />
        <nav className="nav-links motion-nav-links" aria-label="Primary">
          <div
            className="public-product-menu"
            ref={productRef}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null))
                setProductOpen(false);
            }}
          >
            <button
              ref={productToggleRef}
              type="button"
              aria-expanded={productOpen}
              aria-controls={productMenuId}
              onClick={() => setProductOpen((value) => !value)}
              className={PRODUCT_LINKS.some((link) => link.to === pathname) ? "is-current" : ""}
            >
              Product <ChevronDown size={14} aria-hidden="true" />
            </button>
            <div className="public-product-panel" id={productMenuId} hidden={!productOpen}>
              {PRODUCT_LINKS.map((link) => (
                <Link key={link.label} to={link.to} onClick={() => setProductOpen(false)}>
                  <strong>{link.label}</strong>
                  <span>{link.description}</span>
                </Link>
              ))}
              <Link
                to="/resources"
                hash="brief-builder"
                className="public-product-start"
                onClick={() => setProductOpen(false)}
              >
                Prepare your brief <span>Start with your own product question →</span>
              </Link>
            </div>
          </div>
          {LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              aria-current={pathname === l.to ? "page" : undefined}
              className={pathname === l.to ? "active" : ""}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="nav-right">
        {!loading && user ? (
          <>
            <Link to="/command" className="dxn-cta dxn-desktop-cta">
              Launch PSI Workspace
            </Link>
            <AccountMenu user={user} />
          </>
        ) : (
          <>
            <Link to="/login" className="dxn-signin">
              Sign in
            </Link>
            <Link to="/pilot" search={{ plan: "founder" }} className="dxn-cta">
              Request a pilot
            </Link>
          </>
        )}
        <button
          ref={toggleRef}
          type="button"
          className="dxn-toggle"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </div>

      <div className="dxn-mobile" id={menuId} ref={menuRef} hidden={!open}>
        <nav className="flex flex-col" aria-label="Menu">
          <div className="public-mobile-group">
            <span>Product</span>
            {PRODUCT_LINKS.map((link) => (
              <Link key={link.label} to={link.to} onClick={() => setOpen(false)}>
                {link.label}
              </Link>
            ))}
            <Link to="/how-it-works" onClick={() => setOpen(false)}>
              How it works
            </Link>
          </div>
          <div className="public-mobile-group">
            <span>Explore & get started</span>
            {EXPLORE_LINKS.map((link) => (
              <Link key={link.to} to={link.to} onClick={() => setOpen(false)}>
                {link.label}
              </Link>
            ))}
            <Link to="/pricing" onClick={() => setOpen(false)}>
              Pricing & Pilot
            </Link>
            <Link to="/resources" hash="brief-builder" onClick={() => setOpen(false)}>
              Prepare your brief
            </Link>
          </div>
          {user ? (
            <Link to="/command" onClick={() => setOpen(false)}>
              Launch PSI Workspace
            </Link>
          ) : (
            <Link to="/login" className="dxn-signin" onClick={() => setOpen(false)}>
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
