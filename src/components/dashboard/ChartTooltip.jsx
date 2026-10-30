export function ChartTooltip({ active, payload, label, format }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-sm border border-foreground bg-popover px-3 py-2 text-popover-foreground shadow-hard-sm">
      <p className="label-mono text-muted-foreground">{label}</p>
      {payload.map((item) => (
        <p key={item.dataKey} className="mt-1 font-mono text-sm font-semibold">
          {format ? format(item.value) : item.value}
        </p>
      ))}
    </div>
  );
}