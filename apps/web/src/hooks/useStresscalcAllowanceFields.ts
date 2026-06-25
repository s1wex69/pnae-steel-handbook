import { useCallback, useEffect, useState } from "react";
import { sumFmt } from "@/lib/calcInputUtils";
import {
  stresscalcCorrosionAllowance,
  stresscalcElbowTechAllowance,
  stresscalcMinusTolerance,
} from "@/lib/stresscalcShell";

/** Прибавки трубы: c₂ — минусовой допуск, c₁ — коррозия (как c₁₁ и c₂₁ на stresscalc) */
export function usePipeAllowanceFields(initial?: { cMinus?: string; cCorrosion?: string }) {
  const [cMinus, setCMinusState] = useState(initial?.cMinus ?? "0.2");
  const [cCorrosion, setCCorrosionState] = useState(initial?.cCorrosion ?? "1");
  const [cc, setCcState] = useState("1.2");
  const [ccManual, setCcManual] = useState(false);

  useEffect(() => {
    if (ccManual) return;
    setCcState(sumFmt([cMinus, cCorrosion], 2));
  }, [cMinus, cCorrosion, ccManual]);

  const setCMinus = useCallback((v: string) => {
    setCcManual(false);
    setCMinusState(v);
  }, []);

  const setCCorrosion = useCallback((v: string) => {
    setCcManual(false);
    setCCorrosionState(v);
  }, []);

  const setCc = useCallback((v: string) => {
    setCcManual(true);
    setCcState(v);
  }, []);

  const applyStresscalcDefaults = useCallback((Da: number, s: number) => {
    if (!(Da > 0) || !(s > 0)) return;
    setCcManual(false);
    setCMinusState(String(stresscalcMinusTolerance(Da, s)));
    setCCorrosionState(String(stresscalcCorrosionAllowance(Da, false)));
  }, []);

  return {
    cMinus,
    cCorrosion,
    cc,
    setCMinus,
    setCCorrosion,
    setCc,
    applyStresscalcDefaults,
  };
}

/** Прибавки колена: c₁₁, c₁₂, c₂₁ (stresscalc.ru) */
export function useElbowAllowanceFields(initial?: { c11?: string; c12?: string; c21?: string }) {
  const [c11, setC11State] = useState(initial?.c11 ?? "0.2");
  const [c12, setC12State] = useState(initial?.c12 ?? "0.95");
  const [c21, setC21State] = useState(initial?.c21 ?? "3");

  const applyStresscalcDefaults = useCallback((Da: number, s: number, Rs: number) => {
    if (!(Da > 0) || !(s > 0) || !(Rs > 0)) return;
    setC11State(String(stresscalcMinusTolerance(Da, s)));
    setC12State(String(stresscalcElbowTechAllowance(s, Rs, Da)));
    setC21State(String(stresscalcCorrosionAllowance(Da, true)));
  }, []);

  return {
    c11,
    c12,
    c21,
    setC11: setC11State,
    setC12: setC12State,
    setC21: setC21State,
    applyStresscalcDefaults,
  };
}
