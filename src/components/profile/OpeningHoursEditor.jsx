import { DAYS } from "@/lib/profile";
import { Button } from "@/components/ui/button";

const timeClass =
  "h-10 w-full min-w-0 rounded-sm border border-input bg-transparent px-2 text-sm text-foreground outline-none transition-colors focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-destructive";

/**
 * Seven rows: an "open" checkbox and two time inputs.
 * Uses react-hook-form's register, so it plugs into the profile form.
 */
export function OpeningHoursEditor({ register, errors, hours, onCopyMonday }) {
  return (
    <div className="space-y-3">
      <ul className="divide-y divide-border border border-border">
        {DAYS.map(({ key, label }) => {
          const open = hours?.[key]?.open ?? false;
          const dayErrors = errors?.[key];
          const message = dayErrors?.from?.message ?? dayErrors?.to?.message;

          return (
            <li key={key} className="p-3">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <label className="flex w-36 shrink-0 cursor-pointer items-center gap-3 text-sm font-semibold">
                  <input type="checkbox" className="size-4 accent-foreground" {...register(`hours.${key}.open`)} />
                  {label}
                </label>

                {open ? (
                  <div className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-sm">
                    <input
                      type="time"
                      aria-label={`${label} opening time`}
                      aria-invalid={dayErrors?.from ? true : undefined}
                      className={timeClass}
                      {...register(`hours.${key}.from`)}
                    />
                    <span aria-hidden="true" className="text-muted-foreground">
                      to
                    </span>
                    <input
                      type="time"
                      aria-label={`${label} closing time`}
                      aria-invalid={dayErrors?.to ? true : undefined}
                      className={timeClass}
                      {...register(`hours.${key}.to`)}
                    />
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Closed</span>
                )}
              </div>

              {message && (
                <p role="alert" className="mt-2 text-sm text-destructive">
                  {message}
                </p>
              )}
            </li>
          );
        })}
      </ul>

      <Button type="button" variant="ghost" size="sm" onClick={onCopyMonday}>
        Copy Monday to every day
      </Button>
    </div>
  );
}