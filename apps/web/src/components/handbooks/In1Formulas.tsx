import {
  AllowSigma,
  Frac,
  MathSpan,
  MinExpr,
  Or,
  Sigma13,
  Stress,
  Times,
  Var,
} from "@/components/handbooks/MathNotation";

/** [σ] = min(R_m/n_m; R_p0,2/n_0,2; R_mt/n_mt) */
export function FormulaPressure({ external = false }: { external?: boolean }) {
  const n02 = external ? "2" : "1,5";
  const nmt = external ? "2" : "1,5";
  return (
    <MathSpan className="text-[0.95em] leading-relaxed">
      <AllowSigma /> ={" "}
      <MinExpr>
        <Frac num={<Var letter="R" sub="m" />} den="2,6" />;{" "}
        <Frac num={<Var letter="R" sub="p0,2" />} den={n02} />;{" "}
        <Frac num={<Var letter="R" sub="mt" />} den={nmt} />
      </MinExpr>
    </MathSpan>
  );
}

export function FormulaBoltW() {
  return (
    <MathSpan>
      <AllowSigma sub="w" /> = <Frac num={<Var letter="R" sub="p0,2" />} den="2" />
    </MathSpan>
  );
}

export function FormulaBoltWt() {
  return (
    <MathSpan>
      <AllowSigma sub="wt" /> = <Frac num={<Var letter="R" sub="m" />} den="3" />
    </MathSpan>
  );
}

export function FormulaShell() {
  return (
    <MathSpan>
      <AllowSigma sub="c" /> ={" "}
      <MinExpr>
        <Frac num={<Var letter="R" sub="m" />} den="1,85" />;{" "}
        <Frac num={<Var letter="R" sub="p0,2" />} den="1,07" />
      </MinExpr>
    </MathSpan>
  );
}

export function FormulaStressRangeLimit({ symbol }: { symbol: "RV" | "RK" }) {
  return (
    <MathSpan className="text-[0.95em] leading-relaxed">
      <Stress sub={symbol} grouped /> ={" "}
      <span className="whitespace-nowrap">
        (2,5 − <Frac num={<Var letter="R" sub="p0,2" />} den={<Var letter="R" sub="m" />} />)
        <Times />
        <Var letter="R" sub="p0,2" />
      </span>{" "}
      ≤ 2<Var letter="R" sub="p0,2" />
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
