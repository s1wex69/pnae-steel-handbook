import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "@/hooks/useTheme";
import { EmbedGuard } from "@/components/EmbedGuard";
import { AppLayout } from "@/components/layout/AppLayout";
import { SteelPropertiesPage } from "@/pages/SteelPropertiesPage";
import { PnaeCalculatorsPage } from "@/pages/PnaeCalculatorsPage";
import { CylindricalShellInternalPage } from "@/pages/CylindricalShellInternalPage";
import { CylindricalShellExternalPage } from "@/pages/CylindricalShellExternalPage";
import { HemisphericalHeadPage } from "@/pages/HemisphericalHeadPage";
import { EllipticalHeadPage } from "@/pages/EllipticalHeadPage";
import { TorisphericalHeadPage } from "@/pages/TorisphericalHeadPage";
import { PipeCollectorPage } from "@/pages/PipeCollectorPage";
import { PipeInternalPage } from "@/pages/PipeInternalPage";
import { ConicalShellInternalPage } from "@/pages/ConicalShellInternalPage";
import { ElbowPage } from "@/pages/ElbowPage";
import { FlatCircularHeadPage } from "@/pages/FlatCircularHeadPage";

function LegacyPnaeRedirect() {
  const { search } = useLocation();
  return <Navigate to={{ pathname: "/", search }} replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <EmbedGuard>
        <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "") || undefined}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<SteelPropertiesPage />} />
              <Route path="calculators" element={<PnaeCalculatorsPage />} />
              <Route path="calculators/cylindrical-shell-internal" element={<CylindricalShellInternalPage />} />
              <Route path="calculators/cylindrical-shell-external" element={<CylindricalShellExternalPage />} />
              <Route path="calculators/hemispherical-head" element={<HemisphericalHeadPage />} />
              <Route path="calculators/elliptical-head" element={<EllipticalHeadPage />} />
              <Route path="calculators/torispherical-head" element={<TorisphericalHeadPage />} />
              <Route path="calculators/pipe-internal" element={<PipeInternalPage />} />
              <Route path="calculators/conical-shell-internal" element={<ConicalShellInternalPage />} />
              <Route path="calculators/pipe-collector" element={<PipeCollectorPage />} />
              <Route path="calculators/elbow" element={<ElbowPage />} />
              <Route path="calculators/flat-circular-head" element={<FlatCircularHeadPage />} />
              <Route path="handbooks/pnae-steel" element={<LegacyPnaeRedirect />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </EmbedGuard>
    </ThemeProvider>
  );
}
