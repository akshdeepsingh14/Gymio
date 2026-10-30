import { Logo } from "@/components/common/Logo";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { Hex } from "@/components/ui/hex";
import { Ruler } from "@/components/ui/ruler";

const points = [
  { n: "01", title: "Every member, one record", text: "Plans, expiry dates and payment history in one place." },
  { n: "02", title: "Renewals without chasing", text: "See who expires this week and record the renewal in seconds." },
  { n: "03", title: "Receipts that match the books", text: "Every payment produces a numbered receipt." },
];

function AuthAside() {
  return (
    <aside className="tone-invert relative hidden flex-col justify-between overflow-hidden p-12 lg:flex">
      <Ruler />

      <div>
        <p
          aria-hidden="true"
          className="select-none font-display text-[clamp(5rem,9vw,9rem)] font-extrabold uppercase leading-[0.82] text-outline"
        >
          Train
          <br />
          Track
          <br />
          Renew
        </p>

        <ol className="mt-12 max-w-md space-y-6">
          {points.map((point) => (
            <li key={point.n} className="flex gap-4">
              <Hex outline className="size-10">
                <span className="label-mono text-[0.6rem]">{point.n}</span>
              </Hex>
              <div>
                <h2 className="!text-xl !normal-case !leading-tight">{point.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{point.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <p className="label-mono text-muted-foreground">
        Demo build · data stays in this browser
      </p>
    </aside>
  );
}

export function AuthLayout({ title, description, children, footer }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* React 19 hoists this into <head> */}
      <title>{`${title} — Gymio`}</title>
      <meta name="robots" content="noindex" />

      <div className="flex flex-col px-4 py-5 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between">
          <Logo />
          <ThemeToggle />
        </header>

        <main className="flex flex-1 items-center py-10">
          <div className="mx-auto w-full max-w-md animate-fade-up">
            <h1 className="text-[clamp(2.75rem,9vw,4.25rem)] font-extrabold">{title}</h1>
            {description && (
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">{description}</p>
            )}
            <div className="mt-8">{children}</div>
            {footer && (
              <div className="mt-8 border-t border-border pt-6 text-sm text-muted-foreground">
                {footer}
              </div>
            )}
          </div>
        </main>
      </div>

      <AuthAside />
    </div>
  );
}