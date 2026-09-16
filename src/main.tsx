import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AuthGate } from "./components/AuthGate";
import "./index.css";

createRoot(document.getElementById("root")!).render(<StrictMode><AuthGate>{(profile, productionMode) => <App initialProfile={profile} productionMode={productionMode} />}</AuthGate></StrictMode>);
