import "@/services/actor";
import { RouterProvider } from "react-router";
import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/AuthProvider";
import { StaffAuthProvider } from "@/contexts/StaffAuthProvider";
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { useTheme } from "@/hooks/useTheme";
import { router } from "@/routes/router";

function AppToaster() {
  const { resolvedTheme } = useTheme();
  return <Toaster theme={resolvedTheme} position="top-right" richColors closeButton />;
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <AuthProvider>
        <StaffAuthProvider>
          <RouterProvider router={router} />
        </StaffAuthProvider>
      </AuthProvider>
      <AppToaster />
    </ThemeProvider>
  );
}