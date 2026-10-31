import { useMemo, useState } from "react";
import { Check, Minus } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { FormAlert } from "@/components/common/FormFields";
import { SegmentedControl } from "@/components/common/SegmentedControl";
import { SaveBar } from "@/components/settings/SaveBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { staffNavGroups } from "@/data/staffNav";
import { useDb } from "@/hooks/useDb";
import { useSettingsForm } from "@/hooks/useSettingsForm";
import {
  DEFAULT_ROLE_PERMISSIONS,
  getRolePermissions,
  isOnTeam,
  lockedPermissions,
  OWNER_ONLY,
  PERMISSIONS,
  ROLES,
  SENSITIVE_PERMISSIONS,
  togglePermission,
} from "@/lib/staff";
import { cn } from "@/lib/utils";
import { saveRolePermissions } from "@/services/staffService";

const KEYS = ["rolePermissions"];

// Group permissions in their listed order.
const GROUPS = PERMISSIONS.reduce((groups, permission) => {
  (groups[permission.group] ??= []).push(permission);
  return groups;
}, {});

const labelOf = (key) => PERMISSIONS.find((permission) => permission.key === key)?.label ?? key;

export function RolePermissionsCard() {
  const db = useDb();
  const [role, setRole] = useState(ROLES[0].value);
  const [pending, setPending] = useState(null); // a sensitive permission waiting for the owner's OK

  const saved = useMemo(() => ({ rolePermissions: getRolePermissions(db.rolePermissions) }), [db.rolePermissions]);

  const { draft, update, dirty, saving, error, discard, submit } = useSettingsForm({
    saved,
    keys: KEYS,
    save: (values) => saveRolePermissions(values.rolePermissions),
    successMessage: "Permissions saved.",
  });

  const current = draft.rolePermissions[role];
  const locked = lockedPermissions(current);
  const activeRole = ROLES.find((item) => item.value === role);

  // The preview reads the same navigation list the staff sidebar uses, so they cannot disagree
  const sections = [
    ...staffNavGroups[0].items.map((item) => ({
      label: item.label,
      allowed: !item.permission || current.includes(item.permission),
    })),
    { label: "Revenue and analytics", allowed: current.includes("reports.view") },
  ];

  const setPermissions = (list) =>
    update({ rolePermissions: { ...draft.rolePermissions, [role]: list } });

  /** Ticks or unticks one permission and says what else changed because of it. */
  const apply = (key, on) => {
    const next = togglePermission(current, key, on);
    const side = on
      ? next.filter((item) => !current.includes(item) && item !== key)
      : current.filter((item) => !next.includes(item) && item !== key);

    setPermissions(next);
    if (side.length > 0) {
      toast.info(`${on ? "Also turned on" : "Also turned off"}: ${side.map(labelOf).join(", ")}.`);
    }
  };

  const items = ROLES.map(({ value, label }) => ({
    id: value,
    label,
    count: db.staff.filter((member) => member.role === value && isOnTeam(member)).length,
  }));

  const isDefault = JSON.stringify(current) === JSON.stringify(DEFAULT_ROLE_PERMISSIONS[role]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Roles and permissions</CardTitle>
        <CardDescription>
          Choose what each role can do. A permission that needs another one turns it on too. The number beside a role
          is how many people have it. Changes reach staff the next time they open a page.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SegmentedControl label="Role" value={role} onChange={setRole} items={items} />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isDefault}
            onClick={() => setPermissions([...DEFAULT_ROLE_PERMISSIONS[role]])}
          >
            Reset {activeRole.label} to default
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">{activeRole.description}</p>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <div className="space-y-6">
            {Object.entries(GROUPS).map(([group, permissions]) => (
              <fieldset key={group} className="space-y-2">
                <legend className="label-mono mb-2">{group}</legend>

                {permissions.map((permission) => {
                  const checked = current.includes(permission.key);
                  const isLocked = locked.has(permission.key);
                  const sensitive = Boolean(SENSITIVE_PERMISSIONS[permission.key]);

                  return (
                    <label
                      key={permission.key}
                      title={isLocked ? "Another permission you turned on needs this one" : undefined}
                      className={cn(
                        "flex items-start gap-3 rounded-sm border p-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                        checked ? "border-foreground bg-muted" : "border-border hover:border-foreground/50",
                        isLocked ? "cursor-not-allowed" : "cursor-pointer",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={isLocked}
                        onChange={(event) => {
                          const on = event.target.checked;
                          if (on && sensitive) setPending(permission);
                          else apply(permission.key, on);
                        }}
                        className="mt-0.5 size-4 shrink-0 accent-foreground"
                      />

                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                          {permission.label}
                          {sensitive && <Badge variant="destructive">Sensitive</Badge>}
                        </span>
                        <span className="block text-sm text-muted-foreground">{permission.description}</span>
                      </span>
                    </label>
                  );
                })}
              </fieldset>
            ))}
          </div>

          <aside aria-label={`What a ${activeRole.label} can open`} className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-sm border border-border p-4">
              <p className="label-mono text-muted-foreground">A {activeRole.label.toLowerCase()} can open</p>

              <ul className="mt-3 space-y-2">
                {sections.map((section) => (
                  <li
                    key={section.label}
                    className={cn("flex items-center gap-2 text-sm", !section.allowed && "text-muted-foreground")}
                  >
                    {section.allowed ? (
                      <Check className="size-4 shrink-0" aria-hidden="true" />
                    ) : (
                      <Minus className="size-4 shrink-0" aria-hidden="true" />
                    )}
                    <span>
                      {section.label}
                      <span className="sr-only">{section.allowed ? ": allowed" : ": not allowed"}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-sm border border-dashed border-border p-4">
              <p className="label-mono text-muted-foreground">Always owner-only</p>
              <p className="mt-2 text-sm text-muted-foreground">{OWNER_ONLY.join(", ")}.</p>
            </div>
          </aside>
        </div>

        <FormAlert message={error} />

        <SaveBar dirty={dirty} saving={saving} onSave={submit} onDiscard={discard} />
      </CardContent>

      <ConfirmDialog
        open={Boolean(pending)}
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
        title="Grant sensitive access?"
        description={
          pending
            ? `“${pending.label}” for ${activeRole.label}. ${SENSITIVE_PERMISSIONS[pending.key]} Nothing changes until you save, so you can still undo it.`
            : ""
        }
        confirmLabel="Grant permission"
        onConfirm={() => {
          apply(pending.key, true);
          setPending(null);
        }}
      />
    </Card>
  );
}