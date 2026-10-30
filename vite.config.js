import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },

  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    open: true,

    // Transform the landing page files as soon as the server starts,
    // so the first page load in dev doesn't wait on them one by one.
    warmup: {
      clientFiles: [
        "./src/main.jsx",
        "./src/App.jsx",
        "./src/pages/public/LandingPage.jsx",
        "./src/components/landing/*.jsx",
        "./src/components/ui/*.jsx",
      ],
    },
  },

  // Pre-bundle every dependency up front. Without this, Vite discovers some
  // of them mid-session, re-optimizes and reloads the whole page in dev.
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "react-router",
      "lucide-react",
      "radix-ui",
      "vaul",
      "sonner",
      "class-variance-authority",
      "clsx",
      "tailwind-merge",
      "jspdf",
    ],
  },

  build: {
    target: "es2022",
    sourcemap: false,
  },
});