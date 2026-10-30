import { useMemo } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildDatasets, buildFullExport, downloadFile, exportFilename, toCsv } from "@/lib/export";
import { formatNumber } from "@/lib/format";
import { logExport } from "@/services/privacyService";

export function ExportCard({ db, user, currency }) {
  const datasets = useMemo(() => buildDatasets(db, currency), [db, currency]);
  const username = user.gym?.username;

  const downloadCsv = (dataset) => {
    const count = dataset.rows.length;
    downloadFile(exportFilename(username, dataset.id, "csv"), toCsv(dataset.columns, dataset.rows), "text/csv");
    logExport(`Exported ${dataset.label.toLowerCase()} (CSV, ${count} ${count === 1 ? "row" : "rows"}).`);
    toast.success(`${dataset.label} downloaded.`);
  };

  const downloadEverything = () => {
    downloadFile(exportFilename(username, "all-records", "json"), buildFullExport(db, user), "application/json");
    logExport("Exported all records (JSON).");
    toast.success("All records downloaded.");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export your records</CardTitle>
        <CardDescription>
          Your data is yours. Each CSV opens in Excel or Google Sheets. Access codes are never included, and every
          export is written to the audit log below.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <ul className="divide-y divide-border rounded-sm border border-border">
          {datasets.map((dataset) => (
            <li key={dataset.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  {dataset.label} <span className="font-mono text-muted-foreground">({formatNumber(dataset.rows.length)})</span>
                </p>
                <p className="text-sm text-muted-foreground">{dataset.description}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={dataset.rows.length === 0}
                onClick={() => downloadCsv(dataset)}
                aria-label={`Download ${dataset.label} as CSV`}
              >
                <Download aria-hidden="true" />
                CSV
              </Button>
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
          <p className="max-w-md text-sm text-muted-foreground">
            One JSON file with everything above, plus staff, access requests and announcements. Photo image data is left
            out.
          </p>
          <Button onClick={downloadEverything}>
            <Download aria-hidden="true" />
            Download everything (JSON)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}