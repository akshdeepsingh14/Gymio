import { isRouteErrorResponse, Link, useRouteError } from "react-router";
import { TriangleAlert } from "lucide-react";

import { Logo } from "@/components/common/Logo";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Shown when a page crashes while it renders or a route fails to load.
 * It replaces React Router's default error screen. In development it also prints the
 * real error, because that is what you need while building.
 */
export function RouteError() {
  const error = useRouteError();

  const status = isRouteErrorResponse(error) ? error.status : null;
  const detail = error instanceof Error ? error.message : typeof error === "string" ? error : "";

  return (
    <div className="flex min-h-svh flex-col">
      <title>Something went wrong — Gymio</title>
      <meta name="robots" content="noindex" />

      <header className="mx-auto flex w-full max-w-7xl items-center px-4 py-5 sm:px-6 lg:px-8">
        <Logo />
      </header>

      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <div role="alert" className="w-full max-w-lg text-center">
          <TriangleAlert className="mx-auto size-10 text-muted-foreground" aria-hidden="true" />
          <h1 className="mt-6 text-[clamp(2.25rem,8vw,3.5rem)] font-extrabold">
            {status ? `Error ${status}` : "Something went wrong"}
          </h1>
          <p className="mt-4 text-base text-muted-foreground">
            This page hit a problem. Your data is safe. Try again, and if it keeps happening, go back to the start.
          </p>

          {import.meta.env.DEV && detail && (
            <pre className="mt-6 max-h-40 overflow-auto rounded-sm border border-border bg-muted/50 p-3 text-left font-mono text-xs">
              {detail}
            </pre>
          )}

          <div className="mt-8 flex flex-wrap justify-center gap-2">
            <Button size="lg" onClick={() => window.location.reload()}>
              Try again
            </Button>
            <Link to="/" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
              Back to home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}