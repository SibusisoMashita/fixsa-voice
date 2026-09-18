"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Brand } from "./Brand";

const links = [
  ["Report", "/report"],
  ["Track", "/track"],
  ["Judge demo", "/demo"],
  ["Operations", "/ops"],
  ["About", "/about"],
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  return (
    <header className="site-header">
      <div className="header-inner">
        <Brand />
        <button className="icon-button mobile-menu-button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="primary-nav" aria-label={open ? "Close menu" : "Open menu"}>
          {open ? <X /> : <Menu />}
        </button>
        <nav id="primary-nav" className={open ? "primary-nav is-open" : "primary-nav"} aria-label="Primary navigation">
          {links.map(([label, href]) => (
            <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} onClick={() => setOpen(false)}>{label}</Link>
          ))}
          <Link className="button button-small button-primary" href="/report" onClick={() => setOpen(false)}>Report an issue</Link>
        </nav>
      </div>
    </header>
  );
}
