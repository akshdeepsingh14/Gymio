import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";

import { Logo } from "@/components/common/Logo";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { buttonVariants } from "@/components/ui/button";
import { Ruler } from "@/components/ui/ruler";
import { cn } from "@/lib/utils";

/** Page frame for the privacy policy and terms. `sections` is [{ heading, body: [paragraph, ...] }]. */
export function LegalLayout({ title, updated, intro, sections }) {
  return (
    <div className="flex min-h-svh flex-col">
      <title>{`${title} — Gymio`}</title>

      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <Logo />
        <ThemeToggle />
      </header>

      <main className="flex-1 px-4 pb-20 pt-6 sm:pt-10">
        <article className="mx-auto w-full max-w-2xl animate-fade-up">
          <Ruler />
          <p className="label-mono mt-6 text-muted-foreground">Last updated {updated}</p>
          <h1 className="mt-3 text-[clamp(2.75rem,10vw,4.5rem)] font-extrabold">{title}</h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">{intro}</p>

          <div className="mt-10 space-y-8">
            {sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-2xl font-extrabold">{section.heading}</h2>
                <div className="mt-3 space-y-3 text-base leading-relaxed text-muted-foreground">
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <Link to="/" className={cn(buttonVariants({ variant: "outline" }), "mt-12 h-11 gap-2 px-5 text-base")}>
            <ArrowLeft aria-hidden="true" />
            Back to home
          </Link>
        </article>
      </main>
    </div>
  );
}