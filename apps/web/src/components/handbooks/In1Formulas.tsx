import {
  AllowSigma,
  Frac,
  MathSpan,
  MinExpr,
  Or,
  SafetyN,
  Sigma13,
  Stress,
  Times,
  Var,
} from "@/components/handbooks/MathNotation";

/** [σ] = min(R_m/n_m; R_p0,2/n_0,2; R_mt/n_mt) */
export function FormulaPressure() {
  return (
    <MathSpan className="text-[0.95em] leading-relaxed">
      <AllowSigma /> ={" "}
      <MinExpr>
        <Frac num={<Var letter="R" sub="m" />} den={<SafetyN sub="m" />} />;{" "}
        <Frac num={<Var letter="R" sub="p0,2" />} den={<SafetyN sub="0,2" />} />;{" "}
        <Frac num={<Var letter="R" sub="mt" />} den={<SafetyN sub="mt" />} />
      </MinExpr>
    </MathSpan>
  );
}

export function FormulaBoltW() {
  return (
    <MathSpan>
      <AllowSigma sub="w" /> ={" "}
      <Frac num={<Var letter="R" sub="p0,2" />} den={<SafetyN sub="0,2" />} />
    </MathSpan>
  );
}

export function FormulaBoltWt() {
  return (
    <MathSpan>
      <AllowSigma sub="wt" /> = <Frac num={<Var letter="R" sub="m" />} den={<SafetyN sub="m" />} />
    </MathSpan>
  );
}

export function FormulaShell() {
  return (
    <MathSpan>
      <AllowSigma sub="c" /> ={" "}
      <MinExpr>
        <Frac num={<Var letter="R" sub="m" />} den={<SafetyN sub="m" />} />;{" "}
        <Frac num={<Var letter="R" sub="p0,2" />} den={<SafetyN sub="0,2" />} />
      </MinExpr>
    </MathSpan>
  );
}

export function FormulaStressRangeLimit({ symbol }: { symbol: "RV" | "RK" }) {
  return (
    <MathSpan className="text-[0.95em] leading-relaxed">
      <Stress sub={symbol} grouped /> ={" "}
      <span className="whitespace-nowrap">
        (<SafetyN sub="σ" /> − <Frac num={<Var letter="R" sub="p0,2" />} den={<Var letter="R" sub="m" />} />)
        <Times />
        <Var letter="R" sub="p0,2" />
      </span>{" "}
      ≤ <SafetyN sub="0,2" />
      <Times />
      <Var letter="R" sub="p0,2" />
    </MathSpan>
  );
}

/** (σ)_RV = [σ_m или σ_mL] + σ_b + σ_bL + σ_T */
export function FormulaStressRangePnae({ symbol }: { symbol: "RV" | "RK" }) {
  return (
    <MathSpan className="text-[0.95em] leading-relaxed">
      <Stress sub={symbol} grouped /> ={" "}
      <span className="whitespace-nowrap">
        [<AllowSigma sub="m" />
        <Or />
        <AllowSigma sub="mL" />]
      </span>{" "}
      + <Stress sub="b" /> + <Stress sub="bL" /> + <Stress sub="T" />
    </MathSpan>
  );
}

export function FormulaSigma2() {
  return (
    <MathSpan className="text-[0.95em] leading-relaxed">
      <Stress sub={2} grouped /> = <AllowSigma sub="m" />
      <Or />
      <AllowSigma sub="mL" /> + <Stress sub="b" />
    </MathSpan>
  );
}

export function FormulaSigma13Note() {
  return (
    <MathSpan className="text-[0.95em] leading-relaxed">
      <Sigma13 /> — для группы <Stress sub={2} grouped />
    </MathSpan>
  );
}
