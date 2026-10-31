import { useState } from "react";
import { Link } from "react-router";
import { Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const storageKey = (ownerId) => `gymio-setup-hidden-${ownerId}`;

function readHidden(ownerId) {
  try {
    return localStorage.getItem(storageKey(ownerId)) === "1";
  } catch {
    return false;
  }
}

/** "Getting started" card. Disappears once every step is done, or when the owner closes it. */
export function SetupChecklist({ steps, ownerId }) {
  const [hidden, setHidden] = useState(() => readHidden(ownerId));

  const done = steps.filter((step) => step.done).length;
  if (hidden || done === steps.length) return null;

  const dismiss = () => {
    setHidden(true);
    try {
      localStorage.setItem(storageKey(ownerId), "1");
    } catch {
      // Storage blocked: it will show again after a refresh.
    }
  };

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-xl font-extrabold uppercase leading-none">Get your gym set up</p>
            <p className="label-mono mt-2 text-muted-foreground">
              {done} of {steps.length} done
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={dismiss} aria-label="Hide the setup checklist">
            <X aria-hidden="true" />
          </Button>
        </div>

        <div className="flex gap-1" aria-hidden="true">
          {steps.map((step) => (
            <span key={step.id} className={cn("h-1 flex-1", step.done ? "bg-foreground" : "bg-border")} />
          ))}
        </div>

        <ul className="grid gap-x-8 sm:grid-cols-2">
          {steps.map((step) => (
            <li key={step.id}>
              <Link
                to={step.to}
                className="flex min-h-11 items-center gap-3 border-b border-border text-sm outline-none transition-colors hover:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span
                  className={cn(
                    "grid size-5 shrink-0 place-items-center rounded-full border",
                    step.done ? "border-foreground bg-foreground text-background" : "border-border",
                  )}
                  aria-hidden="true"
                >
                  {step.done && <Check className="size-3" />}
                </span>
                <span className={cn(step.done && "text-muted-foreground line-through")}>{step.label}</span>
                {step.done && <span className="sr-only"> (done)</span>}
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}