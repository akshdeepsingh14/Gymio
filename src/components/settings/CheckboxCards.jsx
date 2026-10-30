import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Pick any number of options, shown as cards. Real checkboxes underneath.
 * options: [{ value, label, description }]. `values` is the list of ticked values.
 * minSelected stops the last ticked card from being unticked.
 */
export function CheckboxCards({ legend, description, name, values, onChange, options, minSelected = 0 }) {
  const toggle = (value) => {
    const next = values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
    // Keep the order of `options`, so saved lists always look the same
    onChange(options.map((option) => option.value).filter((item) => next.includes(item)));
  };

  return (
    <fieldset className="space-y-3">
      <legend className="label-mono">{legend}</legend>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((option) => {
          const checked = values.includes(option.value);
          const locked = checked && values.length <= minSelected;
          return (
            <label
              key={option.value}
              title={locked ? "Keep at least one selected" : undefined}
              className={cn(
                "flex flex-col gap-1 rounded-sm border p-4 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                checked ? "border-foreground bg-muted" : "border-border hover:border-foreground/50",
                locked ? "cursor-not-allowed" : "cursor-pointer",
              )}
            >
              <input
                type="checkbox"
                name={name}
                value={option.value}
                checked={checked}
                disabled={locked}
                onChange={() => toggle(option.value)}
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