import { cn } from "@/lib/utils";
import { Reveal } from "@/components/ui/reveal";
import { Ruler } from "@/components/ui/ruler";

/**
 * Shared section heading, used by every section on the page.
 *
 * - A tape-measure rule on top (same ticks as the hero ruler)
 * - A huge condensed title. Pass `title` as an array: each entry is one line,
 *   and every second line is indented, echoing the split headline in the hero.
 * - Lines rise out of a mask once, when the heading scrolls into view.
 *
 * layout="split"  title on the left, description on the right (wide sections)
 * layout="stack"  title above the description (narrow columns)
 */
export function SectionHeading({
  id,
  title,
  description,
  layout = "split",
  className,
  children,
}) {
  const lines = Array.isArray(title) ? title : [title];
  const isSplit = layout === "split";

  return (
    <Reveal from="fade" className={cn("group/head", className)}>
      <Ruler />

      <div
        className={cn(
          "mt-8 grid gap-6",
          isSplit && "lg:grid-cols-12 lg:items-end lg:gap-10"
        )}
      >
        <h2
          id={id}
          className={cn(
            "font-display font-extrabold uppercase leading-[0.9]",
            isSplit
              ? "text-[clamp(2.75rem,9vw,6.5rem)] lg:col-span-8"
              : "text-[clamp(2.75rem,9vw,5rem)] lg:text-[clamp(2.75rem,5.2vw,4.75rem)]"
          )}
        >
          {lines.map((line, index) => (
            <span
              key={index}
              className={cn(
                "-my-[0.06em] block overflow-hidden py-[0.06em]",
                index % 2 === 1 && "sm:pl-[10%]"
              )}
            >
              <span
                className="block translate-y-[112%] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-data-[visible=true]/head:translate-y-0 motion-reduce:translate-y-0 motion-reduce:transition-none"
                style={{ transitionDelay: `${index * 90}ms` }}
              >
                {line}
              </span>
            </span>
          ))}
        </h2>

        {(description || children) && (
          <div className={cn(isSplit && "lg:col-span-4")}>
            {description && (
              <p className="max-w-md text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
                {description}
              </p>
            )}
            {children}
          </div>
        )}
      </div>
    </Reveal>
  );
}