import { AllowSigma, Frac, MathSpan, Times, Var } from "@/components/handbooks/MathNotation";

function SpFromP() {
  return (
    <MathSpan className="text-base">
      <Var letter="s" sub="p" /> ={" "}
      <Frac
        num={
          <>
            p<Times />D
          </>
        }
        den={
          <>
            2<Times />
            <AllowSigma />
            <Times />
            <Var letter="φ" sub="p" /> − p
          </>
        }
      />
    </MathSpan>
  );
}

function PFromSp() {
  return (
    <MathSpan className="text-base">
      p ={" "}
      <Frac
        num={
          <>
            2<Times />
            <AllowSigma />
            <Times />
            <Var letter="φ" sub="p" />
            <Times />
            <Var letter="s" sub="p" />
          </>
        }
        den={
          <>
            D + <Var letter="s" sub="p" />
          </>
        }
      />
    </MathSpan>
  );
}

function PpFormula() {
  return (
    <MathSpan className="text-base">
      <Var letter="p" sub="p" /> ={" "}
      <Frac
        num={
          <>
            2<Times />
            <AllowSigma />
            <Times />
            <Var letter="φ" sub="p" />
            <Times />
            (<Var letter="s" sub="s" /> − <Var letter="c" sub="c" />)
          </>
        }
        den={
          <>
            D + <Var letter="s" sub="s" /> − <Var letter="c" sub="c" />
          </>
        }
      />
    </MathSpan>
  );
}

export function ShellInternalFormulas() {
  return (
    <div className="flex flex-col gap-3 text-base">
      <SpFromP />
      <PFromSp />
      <PpFormula />
    </div>
  );
}

export function ShellApplicabilityLimit({ dMm }: { dMm: number }) {
  const limit = dMm >= 200 ? "0,1" : "0,3";
  return (
    <MathSpan className="text-base text-[var(--color-muted-foreground)]">
      <Frac num={<>s − c</>} den="D" /> ≤ {limit} —{" "}
      {dMm >= 200 ? "обечайки и трубы при D ≥ 200 мм" : "трубы при D < 200 мм"}
    </MathSpan>
  );
}
