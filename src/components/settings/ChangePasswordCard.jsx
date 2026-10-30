import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { FormAlert, TextField } from "@/components/common/FormFields";
import { LoadingButton } from "@/components/common/LoadingButton";
import { SwitchRow } from "@/components/settings/SwitchRow";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { changePasswordSchema } from "@/lib/validation/auth";
import { AuthError, changePassword } from "@/services/authService";

export function ChangePasswordCard({ ownerId, onChanged }) {
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "", signOutOthers: true },
  });

  const signOutOthers = watch("signOutOthers");

  const onSubmit = async (values) => {
    try {
      await changePassword(ownerId, values);
      toast.success("Password updated.");
      reset();
      onChanged();
    } catch (error) {
      if (error instanceof AuthError && error.field) {
        setError(error.field, { message: error.message });
      } else {
        setError("root", { message: error.message ?? "Something went wrong. Try again." });
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change password</CardTitle>
        <CardDescription>
          Use at least 8 characters, with a letter and a number. Demo only: this account's password is kept in plain
          text in your browser. The backend stores only a hash.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          <FormAlert message={errors.root?.message} />

          <TextField
            label="Current password"
            type="password"
            autoComplete="current-password"
            className="sm:max-w-sm"
            error={errors.currentPassword?.message}
            {...register("currentPassword")}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              label="New password"
              type="password"
              autoComplete="new-password"
              error={errors.newPassword?.message}
              {...register("newPassword")}
            />
            <TextField
              label="Confirm new password"
              type="password"
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              {...register("confirmPassword")}
            />
          </div>

          <SwitchRow
            label="Sign out my other sessions"
            description="Recommended. Ends every session except this one when the password changes."
            checked={signOutOthers}
            onChange={(value) => setValue("signOutOthers", value)}
          />

          <div className="flex justify-end border-t border-border pt-6">
            <LoadingButton type="submit" loading={isSubmitting} loadingText="Updating…">
              Update password
            </LoadingButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}