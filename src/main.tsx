import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AuthGate } from "./components/AuthGate";
import { AppEntry } from "./components/AppEntry";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthGate>
      {(profile, productionMode) => (
        <AppEntry profile={profile} productionMode={productionMode} />
      )}
    </AuthGate>
  </StrictMode>,
);
