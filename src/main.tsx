import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { mobileUtils } from "./lib/mobile-utils";

// Initialize mobile optimizations
mobileUtils.optimizeForMobile();

createRoot(document.getElementById("root")!).render(<App />);
