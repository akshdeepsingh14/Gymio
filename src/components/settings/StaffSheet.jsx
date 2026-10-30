import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { FormAlert, SelectField, TextField } from "@/components/common/FormFields";
import { LoadingButton } from "@/components/common/LoadingButton";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ROLES } from "@/lib/staff";
import { editStaffSchema, inviteStaffSchema } from "@/lib/validation/staff";
import { ServiceError } from "@/services/memberService";
import { inviteStaff, updateStaff } from "@/services/staffService";

const roleOptions = ROLES.map(({ value, label }) => ({ value, label }));

function StaffForm({ member, onDone }) {
  const editing = Boolean(member);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(editing ? editStaffSchema : inviteStaffSchema),
    defaultValues: editing
      ? { name: member.name, phone: member.phone ?? "", role: member.role }
      : { name: "", email: "", phone: "", role: "frontDesk" },
  });

  const role = ROLES.find((item) => item.value === watch("role"));

  const onSubmit = async (values) => {
    try {
      if (editing) {
        await updateStaff(member.id, values);
        toast.success("Team member updated.");
      } else {
        const created = await inviteStaff(values);
        toast.success(`${created.name} invited. Demo: no email was sent.`);
      }
      onDone();
    } catch (error) {
      if (error instanceof ServiceError && error.field) {
        setError(error.field, { message: error.message });
      } else {
        setError("root", { message: error.message ?? "Something went wrong. Try again." });
      }
    }
  };

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        <FormAlert message={errors.root?.message} />

        <TextField
          label="Full name"
          autoComplete="off"
          error={errors.name?.message}
          {...register("name")}
        />

        {editing ? (
          <div className="space-y-1">
            <p className="label-mono text-muted-foreground">Email</p>
            <p className="text-sm font-semibold">{member.email}</p>
            <p className="text-sm text-muted-foreground">
              The email is their sign-in, so it cannot be changed. Remove them and invite again to use another one.
            </p>
          </div>
        ) : (
          <TextField
            label="Email address"
            type="email"
            autoComplete="off"
            inputMode="email"
            hint="Where the invite goes. It becomes their sign-in."
            error={errors.email?.message}
            {...register("email")}
          />
        )}

        <TextField
          label="Phone (optional)"
          type="tel"
          autoComplete="off"
          inputMode="tel"
          error={errors.phone?.message}
          {...register("phone")}
        />

        <SelectField
          label="Role"
          options={roleOptions}
          hint={role?.description}
          error={errors.role?.message}
          {...register("role")}
        />
      </div>

      <SheetFooter className="mt-0 flex-row justify-end gap-2 border-t border-border p-5">
        <Button type="button" variant="outline" onClick={onDone} disabled={isSubmitting}>
          Cancel
        </Button>
        <LoadingButton type="submit" loading={isSubmitting} loadingText={editing ? "Saving…" : "Inviting…"}>
          {editing ? "Save changes" : "Send invite"}
        </LoadingButton>
      </SheetFooter>
    </form>
  );
}

/** `member` is the person being edited, or null to invite someone new. */
export function StaffSheet({ open, onOpenChange, member }) {
  const editing = Boolean(member);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-lg">
        <SheetHeader className="border-b border-border p-5">
          <SheetTitle>{editing ? "Edit team member" : "Invite staff"}</SheetTitle>
          <SheetDescription>
            {editing ? member.name : "They get their own sign-in, with only what their role allows."}
          </SheetDescription>
        </SheetHeader>

        {/* The drawer unmounts its content when closed, so the form resets every time it opens */}
        <StaffForm key={member?.id ?? "new"} member={member} onDone={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  );
}