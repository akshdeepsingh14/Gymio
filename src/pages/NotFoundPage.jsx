import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/common/Logo";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { cn } from "@/lib/utils";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-svh flex-col overflow-hidden">
      {/* React 19 hoists these into <head> */}
      <title>Page not found — Gymio</title>
      <meta name="robots" content="noindex" />

      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <Logo />
        <ThemeToggle />
      </header>

      <main className="relative flex flex-1 flex-col justify-center px-4 pb-16 sm:px-8">
        {/* Giant 404 behind the message, same idea as the hero headline */}
        <p
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 select-none text-center font-display text-[clamp(10rem,48vw,40rem)] font-extrabold leading-none text-outline"
        >
          404
        </p>

        <div className="relative mx-auto max-w-xl animate-fade-up bg-background/80 p-6 text-center sm:p-8">
          <h1 className="text-[clamp(2.5rem,9vw,4.5rem)] font-extrabold">
            <span className="sr-only">404: </span>
            This page skipped leg day
          </h1>
          <p className="mt-4 text-base text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or has moved.
          </p>
          <Link
            to="/"
            className={cn(buttonVariants({ size: "lg" }), "mt-8 h-12 gap-2 px-6 text-base")}
          >
            <ArrowLeft aria-hidden="true" />
            Back to home
          </Link>
        </div>
      </main>
    </div>
  );
}