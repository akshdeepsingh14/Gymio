import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowUpRight, Menu } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Logo } from "@/components/common/Logo";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { SignInMenu } from "@/components/landing/SignInMenu";
import { navLinks } from "@/data/landingContent";
import { signInOptions } from "@/data/signInOptions";
import { scrollToSection } from "@/lib/scroll";
import { cn } from "@/lib/utils";

/**
 * `sectionsReady` turns true once the lower part of the page has loaded.
 * Until then those sections don't exist, so there is nothing to track.
 */
export function Navbar({ sectionsReady = false }) {
  const navigate = useNavigate();

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [underline, setUnderline] = useState(null);

  const listRef = useRef(null);
  const itemRefs = useRef({});
  const progressRef = useRef(null);

  // One scroll listener (throttled with rAF): compact bar + reading progress.
  useEffect(() => {
    let ticking = false;

    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(window.scrollY / max, 1) : 0;

      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${progress})`;
      }
      setScrolled(window.scrollY > 16);
      if (window.scrollY < 100) setActiveId(null); // back at the hero: no link is active
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // Track which section is in view.
  useEffect(() => {
    if (!sectionsReady || !("IntersectionObserver" in window)) return;

    const elements = navLinks
      .map((link) => document.getElementById(link.id))
      .filter(Boolean);
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible) setActiveId(visible.target.id);
        else if (window.scrollY < 100) setActiveId(null);
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: [0, 0.25, 0.5, 1] }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sectionsReady]);

  // Slide the underline to the active desktop link.
  useEffect(() => {
    const update = () => {
      const element = itemRefs.current[activeId];
      if (!element || !listRef.current) {
        setUnderline(null);
        return;
      }
      setUnderline({ left: element.offsetLeft, width: element.offsetWidth });
    };

    update();
    window.addEventListener("resize", update);
    // Link widths change once the web fonts finish loading
    document.fonts?.ready.then(update);
    return () => window.removeEventListener("resize", update);
  }, [activeId]);

  const handleNavClick = (event, id, fromMenu = false) => {
    event.preventDefault();

    if (fromMenu) {
      setMenuOpen(false);
      scrollToSection(id, 300); // let the overlay finish closing first
      return;
    }

    scrollToSection(id);
  };

  const goTo = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 pt-[env(safe-area-inset-top)] transition-colors duration-300",
          scrolled ? "bg-background/95" : "bg-transparent"
        )}
      >
        <nav
          aria-label="Main navigation"
          className={cn(
            "mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 transition-[height] duration-300 sm:px-8",
            scrolled ? "h-14" : "h-16 sm:h-[4.5rem]"
          )}
        >
          <Logo />

          {/* Desktop links: plain text, one sliding underline */}
          <ul ref={listRef} className="relative hidden items-center gap-1 lg:flex">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute bottom-0 left-0 h-0.5 bg-foreground transition-[transform,width,opacity] duration-300 ease-out motion-reduce:transition-none"
              style={{
                width: underline ? underline.width : 0,
                transform: `translateX(${underline ? underline.left : 0}px)`,
                opacity: underline ? 1 : 0,
              }}
            />

            {navLinks.map((link) => {
              const isActive = activeId === link.id;

              return (
                <li key={link.id}>
                  <a
                    ref={(el) => {
                      itemRefs.current[link.id] = el;
                    }}
                    href={`#${link.id}`}
                    onClick={(event) => handleNavClick(event, link.id)}
                    aria-current={isActive ? "location" : undefined}
                    className={cn(
                      "block px-4 py-2.5 text-sm font-semibold transition-colors duration-200",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isActive
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {link.label}
                  </a>
                </li>
              );
            })}
          </ul>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Desktop only: on phones the toggle lives inside the menu */}
            <div className="hidden lg:block">
              <ThemeToggle />
            </div>

              <div className="hidden sm:block">
              <SignInMenu />
            </div>

            <Link
              to="/sign-up"
              className={cn(buttonVariants(), "h-10 gap-1.5 px-4")}
            >
              Get started
              <ArrowUpRight aria-hidden="true" />
            </Link>

            <Button
              variant="outline"
              size="icon"
              className="size-10 lg:hidden"
              aria-label="Open navigation menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
            >
              <Menu className="size-5" aria-hidden="true" />
            </Button>
          </div>
        </nav>

        {/* Bottom rule doubles as the reading-progress bar */}
        <div
          aria-hidden="true"
          className={cn(
            "h-px w-full transition-colors duration-300",
            scrolled ? "bg-border" : "bg-transparent"
          )}
        >
          <div
            ref={progressRef}
            className="h-0.5 origin-left scale-x-0 bg-foreground will-change-transform"
          />
        </div>
      </header>

      {/* Mobile: full-screen menu */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent
          side="top"
          className="flex h-dvh max-h-dvh flex-col gap-0 rounded-none border-0 p-0"
        >
          <SheetHeader className="px-5 pb-4 pt-[max(1.25rem,env(safe-area-inset-top))] text-left">
            <SheetTitle asChild>
              <div>
                <Logo />
              </div>
            </SheetTitle>
            <SheetDescription className="sr-only">
              Choose a section to scroll to, change the theme, or sign in.
            </SheetDescription>
          </SheetHeader>

          <ul className="flex flex-1 flex-col justify-center overflow-y-auto overscroll-contain px-5">
            {navLinks.map((link) => {
              const isActive = activeId === link.id;

              return (
                <li key={link.id} className="border-b border-border first:border-t-2 first:border-t-foreground">
                  <a
                    href={`#${link.id}`}
                    onClick={(event) => handleNavClick(event, link.id, true)}
                    aria-current={isActive ? "location" : undefined}
                    className="group flex min-h-16 items-center justify-between gap-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span
                      className={cn(
                        "font-display text-4xl font-extrabold uppercase leading-none transition-transform duration-200 group-active:translate-x-1",
                        isActive ? "text-foreground" : "text-foreground/80"
                      )}
                    >
                      {link.label}
                    </span>
                    <ArrowUpRight
                      className="size-6 text-muted-foreground"
                      aria-hidden="true"
                    />
                  </a>
                </li>
              );
            })}
          </ul>

          {/* Theme row: mobile-only home for the toggle */}
          <div className="flex min-h-16 items-center justify-between gap-4 border-t border-border px-5 py-3">
            <span className="text-base font-semibold text-foreground">Dark theme</span>
            <ThemeToggle />
          </div>

          <div className="border-t border-border p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <p className="label-mono text-muted-foreground">Sign in as</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {signInOptions.map((option) => (
                <Button key={option.key} variant="outline" onClick={() => goTo(option.to)} className="h-12 px-2 text-sm">
                  {option.shortLabel}
                </Button>
              ))}
            </div>
            <Button onClick={() => goTo("/sign-up")} className="mt-3 h-12 w-full gap-1.5 text-base">
              Get started
              <ArrowUpRight aria-hidden="true" />
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}