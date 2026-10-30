import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// Fonts (already in package.json, nothing to install):
//   Big Shoulders Display → headlines
//   Instrument Sans       → body text
//   JetBrains Mono        → small labels and numbers
import "@fontsource-variable/big-shoulders-display";
import "@fontsource-variable/instrument-sans";
import "@fontsource-variable/jetbrains-mono";

import "./index.css";
import "./appearance.css";
import App from "./App.jsx";
import { applyAppearance } from "@/lib/appearance";

// Apply saved corner, spacing and card choices before the first paint.
applyAppearance();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);