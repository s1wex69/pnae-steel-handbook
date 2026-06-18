import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@/hooks/useTheme";
import { SteelPropertiesPage } from "@/pages/SteelPropertiesPage";
import { TildaShell } from "@/tilda/TildaShell";
import "@/tilda/tilda.css";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <BrowserRouter>
      <TildaShell>
        <SteelPropertiesPage />
      </TildaShell>
    </BrowserRouter>
  </ThemeProvider>
);
