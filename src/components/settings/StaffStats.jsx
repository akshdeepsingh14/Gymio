/** Four counts at the top of the team card. Total is active + pending + suspended. */
export function StaffStats({ counts }) {
  const tiles = [
    { label: "Total", value: counts.total },
    { label: "Active", value: counts.active },
    { label: "Pending", value: counts.pending },
    { label: "Suspended", value: counts.suspended },
  ];

  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {tiles.map((tile) => (
        <div key={tile.label} className="rounded-sm border border-border bg-card p-4">
          <dt className="label-mono text-muted-foreground">{tile.label}</dt>
          <dd className="mt-2 font-display text-4xl font-extrabold leading-none tabular-nums">{tile.value}</dd>
        </div>
      ))}
    </dl>
  );
}