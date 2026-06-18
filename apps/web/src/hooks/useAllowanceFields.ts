import { useCallback, useEffect, useState } from "react";
import { sumFmt } from "@/lib/calcInputUtils";

export function useAllowanceFields(initial?: {
  c1?: string;
  c2?: string;
  c31?: string;
  c32?: string;
  c33?: string;
}) {
  const [c1, setC1State] = useState(initial?.c1 ?? "0.2");
  const [c2, setC2State] = useState(initial?.c2 ?? "0.2");
  const [c31, setC31State] = useState(initial?.c31 ?? "0.1");
  const [c32, setC32State] = useState(initial?.c32 ?? "0.1");
  const [c33, setC33State] = useState(initial?.c33 ?? "0.1");
  const [c3, setC3State] = useState("0.3");
  const [cc, setCcState] = useState("0.7");
  const [c3Manual, setC3Manual] = useState(false);
  const [ccManual, setCcManual] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (c3Manual) return;
    setC3State(sumFmt([c31, c32, c33]));
  }, [c31, c32, c33, c3Manual]);

  useEffect(() => {
    if (ccManual) return;
    setCcState(sumFmt([c1, c2, c3]));
  }, [c1, c2, c3, ccManual]);

  const setC1 = useCallback((v: string) => {
    setCcManual(false);
    setC1State(v);
  }, []);

  const setC2 = useCallback((v: string) => {
    setCcManual(false);
    setC2State(v);
  }, []);

  const setC31 = useCallback((v: string) => {
    setC3Manual(false);
    setC31State(v);
  }, []);

  const setC32 = useCallback((v: string) => {
    setC3Manual(false);
    setC32State(v);
  }, []);

  const setC33 = useCallback((v: string) => {
    setC3Manual(false);
    setC33State(v);
  }, []);

  const setC3 = useCallback((v: string) => {
    setC3Manual(true);
    setC3State(v);
  }, []);

  const setCc = useCallback((v: string) => {
    setCcManual(true);
    setCcState(v);
  }, []);

  return {
    c1,
    c2,
    c31,
    c32,
    c33,
    c3,
    cc,
    expanded,
    setC1,
    setC2,
    setC31,
    setC32,
    setC33,
    setC3,
    setCc,
    setExpanded,
    toggleExpanded: () => setExpanded((v) => !v),
  };
}
