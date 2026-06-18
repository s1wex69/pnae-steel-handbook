import { useEffect, useState } from "react";
import { sumFmt } from "@/lib/calcInputUtils";

export function useAllowanceFields(initial?: {
  c1?: string;
  c2?: string;
  c31?: string;
  c32?: string;
  c33?: string;
}) {
  const [c1, setC1] = useState(initial?.c1 ?? "0.2");
  const [c2, setC2] = useState(initial?.c2 ?? "0.2");
  const [c31, setC31] = useState(initial?.c31 ?? "0.1");
  const [c32, setC32] = useState(initial?.c32 ?? "0.1");
  const [c33, setC33] = useState(initial?.c33 ?? "0.1");
  const [c3, setC3] = useState("0.3");
  const [cc, setCc] = useState("0.7");
  const [c3Manual, setC3Manual] = useState(false);
  const [ccManual, setCcManual] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (c3Manual) return;
    setC3(sumFmt([c31, c32, c33]));
  }, [c31, c32, c33, c3Manual]);

  useEffect(() => {
    if (ccManual) return;
    setCc(sumFmt([c1, c2, c3]));
  }, [c1, c2, c3, ccManual]);

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
    setC3Manual: () => setC3Manual(true),
    setCcManual: () => setCcManual(true),
    setExpanded,
    toggleExpanded: () => setExpanded((v) => !v),
  };
}
