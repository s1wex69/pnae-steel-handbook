import { Navigate } from "react-router-dom";

export function FlatCoverPage() {
  return <Navigate to="/calculators/flat-head?mode=cover" replace />;
}
