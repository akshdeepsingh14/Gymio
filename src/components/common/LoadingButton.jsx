import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

export function LoadingButton({ loading = false, loadingText, children, disabled, ...props }) {
  return (
    <Button disabled={disabled || loading} aria-busy={loading} {...props}>
      {loading && <LoaderCircle className="animate-spin" aria-hidden="true" />}
      {loading && loadingText ? loadingText : children}
    </Button>
  );
}