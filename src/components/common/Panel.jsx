import { Link } from "react-router";

import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function PanelLink({ to, children }) {
  return (
    <Link
      to={to}
      className="label-mono text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
    >
      {children}
    </Link>
  );
}

/** Titled card used for every dashboard block. */
export function Panel({ title, description, action, className, children }) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
        {action && <CardAction>{action}</CardAction>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}