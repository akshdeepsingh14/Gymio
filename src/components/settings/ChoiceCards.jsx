import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * A set of radio options shown as cards. Real radio inputs underneath,
 * so keyboard (arrow keys) and screen readers work as expected.
 * options: [{ value, label, description }]
 */
export function ChoiceCards({ legend, description, name, value, onChange, options }) {
  return (
    <fieldset className="space-y-3">
      <legend className="label-mono">{legend}</legend>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}

      <div className={cn("grid gap-3", options.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
        {options.map((option) => {
          const checked = option.value === value;
          return (
            <label
              key={option.value}
              className={cn(
                "flex cursor-pointer flex-col gap-1 rounded-sm border p-4 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                checked ? "border-foreground bg-muted" : "border-border hover:border-foreground/50",
              )}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              <span className="flex items-center justify-between gap-2 text-sm font-semibold">
                {option.label}
                {checked && <Check className="size-4" aria-hidden="true" />}
              </span>
              <span className="text-sm text-muted-foreground">{option.description}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}