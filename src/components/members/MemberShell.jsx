import { Logo } from "@/components/common/Logo";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { Ruler } from "@/components/ui/ruler";

/** Page frame for the member portal's sign-in screens. */
export function MemberShell({ title, description, children, footer }) {
  return (
    <div className="flex min-h-svh flex-col">
      <title>{`${title} — Gymio`}</title>
      <meta name="robots" content="noindex" />

      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <Logo />
        <ThemeToggle />
      </header>

      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md animate-fade-up">
          <Ruler />
          <p className="label-mono mt-6 text-muted-foreground">Member portal</p>
          <h1 className="mt-3 text-[clamp(2.5rem,9vw,4rem)] font-extrabold">{title}</h1>
          {description && <p className="mt-3 text-base leading-relaxed text-muted-foreground">{description}</p>}

          <div className="mt-8">{children}</div>

          {footer && <div className="mt-8 border-t border-border pt-6 text-sm text-muted-foreground">{footer}</div>}
        </div>
      </main>
    </div>
  );
}