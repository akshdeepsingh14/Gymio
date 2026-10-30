import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

/** Temporary page. Each section is replaced by its real screen in a later phase. */
export default function SectionPlaceholder({ title, description, phase }) {
  const { user } = useAuth();

  return (
    <>
      <title>{`${title} — Gymio`}</title>
      <PageHeader title={title} description={description} />

      <Card className="mt-8">
        <CardContent className="flex flex-col items-start gap-3">
          <Badge variant="outline">Built in {phase}</Badge>
          <p className="text-muted-foreground">
            Signed in as <span className="font-semibold text-foreground">{user.gymName}</span>. The sidebar,
            header, theme toggle and menus around this page are live.
          </p>
        </CardContent>
      </Card>
    </>
  );
}