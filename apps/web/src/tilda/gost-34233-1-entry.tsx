import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@/hooks/useTheme";
import { Gost34233_1SteelPropertiesPage } from "@/pages/Gost34233_1SteelPropertiesPage";
import { TildaShell } from "@/tilda/TildaShell";
import "@/tilda/tilda.css";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <BrowserRouter>
      <TildaShell>
        <Gost34233_1SteelPropertiesPage />
      </TildaShell>
    </BrowserRouter>
  </ThemeProvider>
);

