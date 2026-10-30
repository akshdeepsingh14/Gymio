import { useLocation } from "react-router";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { settingsNav } from "@/data/settingsNav";

/** Shown for settings sections that are built in a later step. */
export default function SettingsPlaceholderPage() {
  const { pathname } = useLocation();
  const section = settingsNav.find((item) => pathname.endsWith(`/${item.path}`));

  return (
    <>
      <title>{`${section?.label ?? "Settings"} — Settings — Gymio`}</title>
      <Card>
        <CardContent className="flex flex-col items-start gap-3">
          <Badge variant="outline">Built in {section?.step ?? "a later step"}</Badge>
          <p className="text-muted-foreground">
            {section?.label ?? "This section"} is not built yet. Appearance is ready to try.
          </p>
        </CardContent>
      </Card>
    </>
  );
}