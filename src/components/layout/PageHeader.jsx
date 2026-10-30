import { Ruler } from "@/components/ui/ruler";

/** Standard top of every owner page: title, description, optional actions. */
export function PageHeader({ title, description, actions }) {
  return (
    <div>
      <Ruler />
      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[clamp(2.5rem,7vw,4rem)] font-extrabold">{title}</h1>
          {description && <p className="mt-2 max-w-2xl text-base text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}