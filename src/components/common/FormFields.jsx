import { useId, useState } from "react";
import { ChevronDown, CircleAlert, Eye, EyeOff } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

function FieldMessage({ id, error, hint }) {
  if (error) {
    return (
      <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
        {error}
      </p>
    );
  }
  if (hint) {
    return (
      <p id={`${id}-hint`} className="text-sm text-muted-foreground">
        {hint}
      </p>
    );
  }
  return null;
}

const describedBy = (id, error, hint) =>
  error ? `${id}-error` : hint ? `${id}-hint` : undefined;

/** Label + input + message. Works with react-hook-form's register(). */
export function TextField({ label, error, hint, id, type = "text", className, ref, ...props }) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={fieldId}>{label}</Label>
      <div className="relative">
        <Input
          id={fieldId}
          ref={ref}
          type={isPassword && visible ? "text" : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(fieldId, error, hint)}
          className={isPassword ? "pr-11" : undefined}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted-foreground transition-colors hover:text-foreground"
          >
            {visible ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
          </button>
        )}
      </div>
      <FieldMessage id={fieldId} error={error} hint={hint} />
    </div>
  );
}

/** Native <select>, styled to match. Accessible and works on every phone. */
export function SelectField({ label, error, hint, id, options, className, ref, ...props }) {
  const autoId = useId();
  const fieldId = id ?? autoId;

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={fieldId}>{label}</Label>
      <div className="relative">
        <select
          id={fieldId}
          ref={ref}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(fieldId, error, hint)}
          className="h-11 w-full appearance-none rounded-sm border border-input bg-background px-3 pr-10 text-base text-foreground outline-none transition-colors focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-destructive"
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
      </div>
      <FieldMessage id={fieldId} error={error} hint={hint} />
    </div>
  );
}

/** Form-level error box (wrong password, server error, etc.) */
export function FormAlert({ message }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-sm border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
    >
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}


export function TextAreaField({ label, error, hint, id, className, ref, rows = 3, ...props }) {
  const autoId = useId();
  const fieldId = id ?? autoId;

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={fieldId}>{label}</Label>
      <textarea
        id={fieldId}
        ref={ref}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId, error, hint)}
        className="w-full resize-y rounded-sm border border-input bg-transparent px-3 py-2.5 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-destructive"
        {...props}
      />
      <FieldMessage id={fieldId} error={error} hint={hint} />
    </div>
  );
}