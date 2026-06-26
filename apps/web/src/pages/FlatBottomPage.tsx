import { Navigate } from "react-router-dom";

export function FlatBottomPage() {
  return <Navigate to="/calculators/flat-head?mode=bottom" replace />;
}
