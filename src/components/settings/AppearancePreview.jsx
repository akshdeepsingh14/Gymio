import { TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

/** Real components, so it always matches the rest of the app. */
export function AppearancePreview() {
  return (
    <Card aria-label="Preview of your appearance settings" role="group">
      <CardHeader>
        <CardTitle>Preview</CardTitle>
        <CardDescription>Updates as you change settings.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Card size="sm" className="bg-background">
          <CardContent>
            <p className="label-mono text-muted-foreground">Active members</p>
            <p className="mt-2 font-display text-4xl font-extrabold leading-none tabular-nums">248</p>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
              <TrendingUp className="size-4" aria-hidden="true" />
              12 joined this month
            </p>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-2">
          <Badge>Active</Badge>
          <Badge variant="secondary">Pending</Badge>
          <Badge variant="outline">Expiring</Badge>
        </div>

        <Input aria-label="Sample input" placeholder="Search members" readOnly tabIndex={-1} />

        <div className="flex flex-wrap gap-2">
          <Button tabIndex={-1}>Save</Button>
          <Button variant="outline" tabIndex={-1}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}