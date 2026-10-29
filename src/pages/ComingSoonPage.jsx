import { Link } from "react-router";
import { ArrowLeft, Construction } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Hex } from "@/components/ui/hex";
import { Ruler } from "@/components/ui/ruler";
import { Logo } from "@/components/common/Logo";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { cn } from "@/lib/utils";

// Temporary page for routes that are built in later phases.
export default function ComingSoonPage({ title, description, phase }) {
  return (
    <div className="flex min-h-svh flex-col">
      {/* React 19 hoists these into <head> and removes them on unmount */}
      <title>{`${title} — Gymio`}</title>
      <meta name="robots" content="noindex" />

      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <Logo />
        <ThemeToggle />
      </header>

      <main className="flex flex-1 items-center justify-center px-4 pb-20">
        <div className="w-full max-w-xl animate-fade-up">
          <Ruler />

          <div className="mt-8 flex items-center gap-4">
            <Hex className="size-14">
              <Construction className="size-6" aria-hidden="true" />
            </Hex>
            <Badge variant="outline">Coming in {phase}</Badge>
          </div>

          <h1 className="mt-6 text-[clamp(3rem,12vw,5.5rem)] font-extrabold">{title}</h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
            {description}
          </p>

          <Link
            to="/"
            className={cn(buttonVariants({ variant: "outline" }), "mt-8 h-11 gap-2 px-5 text-base")}
          >
            <ArrowLeft aria-hidden="true" />
            Back to home
          </Link>
        </div>
      </main>
    </div>
  );
}