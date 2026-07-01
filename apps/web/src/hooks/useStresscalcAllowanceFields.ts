import { useCallback, useEffect, useState } from "react";
import { num, sumFmt } from "@/lib/calcInputUtils";
import { resolvePipeThickness } from "@/lib/pipeStrength";
import {
  stresscalcCorrosionAllowance,
  stresscalcElbowTechAllowance,
  stresscalcMinusTolerance,
} from "@/lib/stresscalcShell";

/** Прибавки трубы: c₁ — минусовой допуск (c₁₁), c₂ — коррозия (c₂₁) */
export function usePipeAllowanceFields(initial?: { cMinus?: string; cCorrosion?: string }) {
  const [cMinus, setCMinusState] = useState(initial?.cMinus ?? "0.2");
  const [cCorrosion, setCCorrosionState] = useState(initial?.cCorrosion ?? "1");
  const [cc, setCcState] = useState("1.2");
  const [ccManual, setCcManual] = useState(false);
  const [cMinusManual, setCMinusManual] = useState(false);
  const [cCorrosionManual, setCCorrosionManual] = useState(false);

  useEffect(() => {
    if (ccManual) return;
    setCcState(sumFmt([cMinus, cCorrosion], 2));
  }, [cMinus, cCorrosion, ccManual]);

  const setCMinus = useCallback((v: string) => {
    setCMinusManual(true);
    setCcManual(false);
    setCMinusState(v);
  }, []);

  const setCCorrosion = useCallback((v: string) => {
    setCCorrosionManual(true);
    setCcManual(false);
    setCCorrosionState(v);
  }, []);

  const setCc = useCallback((v: string) => {
    setCcManual(true);
    setCcState(v);
  }, []);

  const syncAutoAllowances = useCallback(
    (Da: number, sr: number, autoC21: number) => {
      if (!(Da > 0) || !(sr >= 0)) return;

      const c21 = cCorrosionManual ? num(cCorrosion) : autoC21;
      if (!cCorrosionManual) {
        setCCorrosionState(String(autoC21));
      }

      if (!cMinusManual) {
        const { c11 } = resolvePipeThickness(sr, Da, c21);
        setCMinusState(String(c11));
      }
    },
    [cMinusManual, cCorrosionManual, cCorrosion]
  );

  return {
    cMinus,
    cCorrosion,
    cc,
    ccManual,
    cMinusManual,
    cCorrosionManual,
    setCMinus,
    setCCorrosion,
    setCc,
    syncAutoAllowances,
  };
}

/** Прибавки колена: c₁, c₂, c₃ */
export function useElbowAllowanceFields(initial?: { c11?: string; c12?: string; c21?: string }) {
  const [c11, setC11State] = useState(initial?.c11 ?? "1");
  const [c12, setC12State] = useState(initial?.c12 ?? "2");
  const [c21, setC21State] = useState(initial?.c21 ?? "1");
  const [cc, setCcState] = useState("4");
  const [ccManual, setCcManual] = useState(false);
  const [c11Manual, setC11Manual] = useState(false);
  const [c12Manual, setC12Manual] = useState(false);
  const [c21Manual, setC21Manual] = useState(false);

  useEffect(() => {
    if (ccManual) return;
    setCcState(sumFmt([c11, c12, c21], 2));
  }, [c11, c12, c21, ccManual]);

  const setC11 = useCallback((v: string) => {
    setC11Manual(true);
    setCcManual(false);
    setC11State(v);
  }, []);

  const setC12 = useCallback((v: string) => {
    setC12Manual(true);
    setCcManual(false);
    setC12State(v);
  }, []);

  const setC21 = useCallback((v: string) => {
    setC21Manual(true);
    setCcManual(false);
    setC21State(v);
  }, []);

  const setCc = useCallback((v: string) => {
    setCcManual(true);
    setCcState(v);
  }, []);

  const applyStresscalcDefaults = useCallback(
    (Da: number, s: number, Rs: number) => {
      if (!(Da > 0) || !(s > 0) || !(Rs > 0)) return;
      if (!c11Manual) setC11State(String(stresscalcMinusTolerance(Da, s)));
      if (!c12Manual) setC12State(String(stresscalcElbowTechAllowance(s, Rs, Da)));
      if (!c21Manual) setC21State(String(stresscalcCorrosionAllowance(Da, true)));
    },
    [c11Manual, c12Manual, c21Manual]
  );

  return {
    c11,
    c12,
    c21,
    cc,
    setC11,
    setC12,
    setC21,
    setCc,
    applyStresscalcDefaults,
  };
}
