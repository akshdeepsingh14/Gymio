import { RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { AppearancePreview } from "@/components/settings/AppearancePreview";
import { ChoiceCards } from "@/components/settings/ChoiceCards";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppearance } from "@/hooks/useAppearance";
import { useTheme } from "@/hooks/useTheme";
import { APPEARANCE_OPTIONS, resetAppearance, setAppearance } from "@/lib/appearance";

const themeOptions = [
  { value: "light", label: "Light", description: "Bright background, dark text." },
  { value: "dark", label: "Dark", description: "Dark background. The Gymio default." },
  { value: "system", label: "System", description: "Follows your device setting." },
];

export default function AppearancePage() {
  const { theme, setTheme } = useTheme();
  const appearance = useAppearance();

  const resetAll = () => {
    resetAppearance();
    setTheme("dark");
    toast.success("Appearance reset to defaults.");
  };

  return (
    <>
      <title>Appearance — Settings — Gymio</title>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Theme</CardTitle>
              <CardDescription>Choose how Gymio looks on this device.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChoiceCards legend="Colour theme" name="theme" value={theme} onChange={setTheme} options={themeOptions} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Layout</CardTitle>
              <CardDescription>Corners, spacing and cards across your dashboard.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <ChoiceCards
                legend="Corners"
                name="radius"
                value={appearance.radius}
                onChange={(radius) => setAppearance({ radius })}
                options={APPEARANCE_OPTIONS.radius}
              />
              <ChoiceCards
                legend="Spacing"
                name="density"
                value={appearance.density}
                onChange={(density) => setAppearance({ density })}
                options={APPEARANCE_OPTIONS.density}
              />
              <ChoiceCards
                legend="Card style"
                name="cards"
                value={appearance.cards}
                onChange={(cards) => setAppearance({ cards })}
                options={APPEARANCE_OPTIONS.cards}
              />
              <ChoiceCards
                legend="Sidebar"
                description="You can also collapse it with the button in the top bar. On phones it always opens as a menu."
                name="sidebar"
                value={appearance.sidebar}
                onChange={(sidebar) => setAppearance({ sidebar })}
                options={APPEARANCE_OPTIONS.sidebar}
              />
            </CardContent>
          </Card>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Saved automatically in this browser. They are demo preferences and do not follow you to other devices.
            </p>
            <Button variant="outline" onClick={resetAll}>
              <RotateCcw aria-hidden="true" />
              Reset to defaults
            </Button>
          </div>
        </div>

        <div className="xl:sticky xl:top-24 xl:self-start">
          <AppearancePreview />
        </div>
      </div>
    </>
  );
}