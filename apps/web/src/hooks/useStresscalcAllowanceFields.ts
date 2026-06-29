import { useCallback, useEffect, useState } from "react";
import { sumFmt } from "@/lib/calcInputUtils";
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
    setCcManual(false);
    setCCorrosionState(v);
  }, []);

  const setCc = useCallback((v: string) => {
    setCcManual(true);
    setCcState(v);
  }, []);

  const syncAutoAllowances = useCallback(
    (Da: number, sr: number, c21: number) => {
      if (!(Da > 0) || !(sr >= 0)) return;
      setCCorrosionState(String(c21));
      if (!cMinusManual) {
        const { c11 } = resolvePipeThickness(sr, Da, c21);
        setCMinusState(String(c11));
      }
      setCcManual(false);
    },
    [cMinusManual]
  );

  return {
    cMinus,
    cCorrosion,
    cc,
    cMinusManual,
    setCMinus,
    setCCorrosion,
    setCc,
    syncAutoAllowances,
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
