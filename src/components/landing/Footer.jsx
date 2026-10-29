import { Link, useLocation } from "react-router";
import { ArrowUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/common/Logo";
import { footerLinks } from "@/data/landingContent";
import { scrollToSection, scrollToTop } from "@/lib/scroll";

const CURRENT_YEAR = new Date().getFullYear();

const linkClass =
  "group relative inline-flex min-h-9 items-center text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function FooterLink({ link }) {
  const { pathname } = useLocation();

  // Links like "/#pricing" are in-app links. Using <Link> avoids a full page reload.
  const target = link.to ?? link.href;
  const sectionId = target.startsWith("/#") ? target.slice(2) : null;

  const handleClick = (event) => {
    // Already on the home page: just scroll, no navigation needed
    if (sectionId && pathname === "/") {
      event.preventDefault();
      scrollToSection(sectionId);
    }
  };

  return (
    <Link to={target} onClick={handleClick} className={linkClass}>
      {link.label}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-1.5 h-px origin-left scale-x-0 bg-foreground transition-transform duration-300 group-hover:scale-x-100 motion-reduce:transition-none"
      />
    </Link>
  );
}

export function Footer() {
  return (
    <footer className="overflow-hidden border-t-2 border-foreground px-4 pt-14 sm:px-6 lg:px-8 lg:pt-20">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
          {/* Brand */}
          <div>
            <Logo />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Free gym management for members, renewals, payments, receipts and
              member access.
            </p>
          </div>

          {/* Link groups */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3">
            {footerLinks.map((group) => (
              <nav key={group.title} aria-label={group.title} className="min-w-0">
                <p className="font-display text-xl font-extrabold uppercase leading-none">
                  {group.title}
                </p>
                <ul className="mt-4 space-y-0.5">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <FooterLink link={link} />
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <Separator className="mt-14 lg:mt-20" />

        {/* Bottom bar */}
        <div className="flex flex-col gap-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p>© {CURRENT_YEAR} Gymio. A portfolio project.</p>
            <p>Dashboard figures shown on this page are sample data.</p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={scrollToTop}
            className="group h-10 w-fit gap-2 px-4"
          >
            Back to top
            <ArrowUp
              className="transition-transform group-hover:-translate-y-0.5"
              aria-hidden="true"
            />
          </Button>
        </div>
      </div>

      {/* Oversized wordmark, cropped by the bottom edge of the page */}
      <p
        aria-hidden="true"
        className="mx-auto -mb-[0.12em] max-w-7xl select-none font-display text-[clamp(6rem,30vw,28rem)] font-extrabold uppercase leading-[0.78] text-foreground"
      >
        Gymio
      </p>
    </footer>
  );
}