import { useCallback, useEffect, useState } from "react";
import { sumFmt } from "@/lib/calcInputUtils";

export function useAllowanceFields(initial?: {
  c1?: string;
  c2?: string;
  c3?: string;
}) {
  const [c1, setC1State] = useState(initial?.c1 ?? "0.2");
  const [c2, setC2State] = useState(initial?.c2 ?? "0.2");
  const [c3, setC3State] = useState(initial?.c3 ?? "0.3");
  const [cc, setCcState] = useState("0.7");
  const [ccManual, setCcManual] = useState(false);

  useEffect(() => {
    if (ccManual) return;
    setCcState(sumFmt([c1, c2, c3], 2));
  }, [c1, c2, c3, ccManual]);

  const setC1 = useCallback((v: string) => {
    setCcManual(false);
    setC1State(v);
  }, []);

  const setC2 = useCallback((v: string) => {
    setCcManual(false);
    setC2State(v);
  }, []);

  const setC3 = useCallback((v: string) => {
    setCcManual(false);
    setC3State(v);
  }, []);

  const setCc = useCallback((v: string) => {
    setCcManual(true);
    setCcState(v);
  }, []);

  return {
    c1,
    c2,
    c3,
    cc,
    setC1,
    setC2,
    setC3,
    setCc,
  };
}
