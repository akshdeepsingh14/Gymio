import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function MetricDefinitions({ graceDays, reminderDays }) {
  const items = [
    ["Total members", "Everyone on your roster, whatever their status."],
    ["Active", "Access is switched on and the membership has not passed its expiry date."],
    ["Inactive", "Deactivated by you, for example a member who left. Not counted as expired."],
    ["Suspended", "Temporarily blocked by you. Their membership dates keep running. Shown under the Inactive card."],
    ["Expired", `The expiry date has passed. Members within the ${graceDays}-day grace period are included, and counted separately underneath.`],
    ["Expiring soon", `Active members whose membership ends within the next ${reminderDays} days.`],
    ["Pending requests", "Members who asked for portal access and are waiting for you to approve or reject."],
    ["Revenue", "Total of payments you recorded in the selected period. Entered manually, not verified by a bank."],
    ["Payments received", "Number of payments recorded in the selected period."],
  ];

  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="definitions">
        <AccordionTrigger>How these numbers are counted</AccordionTrigger>
        <AccordionContent>
          <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {items.map(([term, text]) => (
              <div key={term}>
                <dt className="label-mono">{term}</dt>
                <dd className="mt-1 text-sm text-muted-foreground">{text}</dd>
              </div>
            ))}
          </dl>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}