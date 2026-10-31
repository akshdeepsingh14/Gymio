import { useState } from "react";
import { Link } from "react-router";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { signInOptions } from "@/data/signInOptions";
import { cn } from "@/lib/utils";

/** Desktop "Sign in" button that opens a small panel with the three ways in. */
export function SignInMenu() {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="h-10 gap-1.5 px-4">
          Sign in
          <ChevronDown
            className={cn("size-4 transition-transform duration-200 motion-reduce:transition-none", open && "rotate-180")}
            aria-hidden="true"
          />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 gap-1 p-2">
        <p className="label-mono px-3 pb-1 pt-2 text-muted-foreground">Sign in as</p>
        {signInOptions.map(({ key, label, description, to, icon: Icon }) => (
          <Link
            key={key}
            to={to}
            onClick={() => setOpen(false)}
            className="group flex items-start gap-3 rounded-sm px-3 py-3 outline-none transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{label}</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{description}</span>
            </span>
          </Link>
        ))}
      </PopoverContent>
    </Popover>
  );
}