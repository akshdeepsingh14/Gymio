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
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);