import { useState } from "react";
import { Link } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { FormAlert, TextField } from "@/components/common/FormFields";
import { LoadingButton } from "@/components/common/LoadingButton";
import { ImageUpload } from "@/components/profile/ImageUpload";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useStaffAuth } from "@/hooks/useStaffAuth";
import { getInitials } from "@/lib/profile";
import { staffProfileSchema } from "@/lib/validation/staffProfile";
import { updateStaffProfile } from "@/services/staffAuthService";
import { UnsavedChangesGuard } from "@/components/settings/UnsavedChangesGuard";

const formatJoined = (iso) =>
  iso ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(iso)) : "—";

function Row({ label, children }) {
  return (
    <div className="grid gap-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-4">
      <dt className="label-mono">{label}</dt>
      <dd className="break-words text-sm">{children}</dd>
    </div>
  );
}

export default function StaffProfilePage() {
  const { user, refresh } = useStaffAuth();
  const [photo, setPhoto] = useState(user.photo);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty, isSubmitting },
  } = useForm({
    resolver: zodResolver(staffProfileSchema),
    defaultValues: { name: user.name, phone: user.phone },
  });

  const dirty = isDirty || photo !== user.photo;

  const onSubmit = async (values) => {
    try {
      await updateStaffProfile({ ...values, photo });
      refresh(); // the header and menu pick up the new name and photo
      reset({ name: values.name.trim(), phone: values.phone.trim() });
      toast.success("Profile updated.");
    } catch (error) {
      setError("root", { message: error.message ?? "Something went wrong. Try again." });
    }
  };

  const discard = () => {
    reset({ name: user.name, phone: user.phone });
    setPhoto(user.photo);
  };

  return (
    <>
      <title>{`Profile — ${user.gymName} — Gymio staff`}</title>
        <UnsavedChangesGuard when={dirty} />
        
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Your profile</CardTitle>
            <CardDescription>
              What the gym owner and your colleagues see next to your work. Demo: the photo stays in this browser.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
              <FormAlert message={errors.root?.message} />

              <ImageUpload
                label="Profile photo"
                hint="JPG, PNG or WebP. It is shrunk before saving."
                value={photo}
                onChange={setPhoto}
                maxSide={256}
                fallback={<span className="font-mono text-lg font-bold">{getInitials(user.name)}</span>}
              />

              <div className="grid gap-5 sm:grid-cols-2">
                <TextField
                  label="Full name"
                  autoComplete="name"
                  error={errors.name?.message}
                  {...register("name")}
                />
                <TextField
                  label="Phone (optional)"
                  type="tel"
                  autoComplete="tel"
                  error={errors.phone?.message}
                  {...register("phone")}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
                <p role="status" className="text-sm text-muted-foreground">
                  {dirty ? "You have unsaved changes." : "No unsaved changes."}
                </p>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={discard} disabled={!dirty || isSubmitting}>
                    Discard
                  </Button>
                  <LoadingButton type="submit" loading={isSubmitting} loadingText="Saving…" disabled={!dirty}>
                    Save changes
                  </LoadingButton>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your account</CardTitle>
            <CardDescription>
              Set by the gym owner, so you cannot change these here. To fix one, ask the owner.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="divide-y divide-border">
              <Row label="Email">{user.email}</Row>
              <Row label="Role">
                <Badge variant="secondary">{user.roleLabel}</Badge>{" "}
                <Link to="/staff/my-access" className="ml-1 font-semibold underline underline-offset-4">
                  See what it allows
                </Link>
              </Row>
              <Row label="Gym">{user.gymName}</Row>
              <Row label="Joined">{formatJoined(user.joinedAt)}</Row>
            </dl>
          </CardContent>
        </Card>
      </div>
    </>
  );
}