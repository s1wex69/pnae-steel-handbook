/** Расчёт болтов, шпилек и гаек — ПНАЭ Г-7-002-86, разд. 3.9; ГОСТ 24705-2004 */

import { in1ThresholdT } from "@/lib/steelHandbook";

/** Высота профиля H = (√3/2)·P — как на stresscalc.ru */
export const THREAD_PROFILE_H_FACTOR = 0.866025404;
export const D3_COEFF = (17 / 12) * THREAD_PROFILE_H_FACTOR;
export const K1_BOLT_METRIC = 0.75;
/** K1 = 1 − 1/8 для гайки (stresscalc.ru) */
export const K1_NUT_METRIC = 0.875;
export const ZETA_LUBRICATED = 0.13;
export const ZETA_DRY = 0.18;
export const ZETA1_LUBRICATED = 0.26;
export const ZETA1_DRY = 0.37;
export const TAU_SIGMA_FACTOR = 0.5;
export const SIGMA_EQ_FACTOR = 1.3;
export const PNAE_BOLT_N = 1.5;

/** Km по табл. П5.9 — логика stresscalc.ru: tw/ts < 1,3 → 0,6, иначе 0,7 */
export function lookupKm(tauBoltAllow: number, tauNutAllow: number): number {
  if (!(tauNutAllow > 0)) return 0.7;
  return tauBoltAllow / tauNutAllow < 1.3 ? 0.6 : 0.7;
}

export interface BoltsStudsNutsInputs {
  D: number;
  P: number;
  dHole: number;
  hNut: number;
  z: number;
  F0w: number;
  Qw: number;
  sigma: number;
  sigmaNut: number;
  rmBolt: number;
  rmNut: number;
  lubricated: boolean;
  zeroTighteningTorque: boolean;
  flange1: number;
  flange2: number;
  gasket: number;
}

export interface BoltsStudsNutsResults {
  h: number;
  d3: number;
  Aw: number;
  AD: number;
  Ww: number;
  K1Bolt: number;
  K1Nut: number;
  Km: number;
  rmRatio: number;
  F1w: number;
  Mk: number;
  MklSimple: number;
  MklRefined: number;
  sigmaW: number;
  tauSw: number;
  tauBody: number;
  tauThreadQw: number;
  tauThreadBolt: number;
  tauThreadNut: number;
  sigmaEq: number;
  tauAllow: number;
  tauNutAllow: number;
  sigmaEqAllow: number;
  AwRequired: number;
  studLength: number;
  l1: number;
  l2: number;
  checks: {
    tension: boolean;
    torsion: boolean;
    equivalent: boolean;
    threadBolt: boolean;
    threadNut: boolean;
    threadQw: boolean;
    bodyShear: boolean;
    area: boolean;
  };
  error: string | null;
}

export function calcThreadProfileH(P: number) {
  return THREAD_PROFILE_H_FACTOR * P;
}

export function calcD3(D: number, P: number) {
  return D - D3_COEFF * P;
}

export function calcAw(d3: number, dHole: number) {
  return (Math.PI / 4) * (d3 * d3 - dHole * dHole);
}

export function calcAD(D: number, dHole: number) {
  return (Math.PI / 4) * (D * D - dHole * dHole);
}

export function calcWw(d3: number, dHole: number) {
  if (!(d3 > 0)) return 0;
  const ratio = dHole > 0 ? Math.pow(dHole / d3, 4) : 0;
  return ((Math.PI * Math.pow(d3, 3)) / 16) * (1 - ratio);
}

export function calcPnaeBoltAllowable(
  rp02: number,
  rmt: number | null,
  temperature: number,
  tt: number
): { sigma: number; tau: number; sigmaT: number; sigmaMt: number | null } | null {
  if (!(rp02 > 0)) return null;
  const sigmaT = rp02 / PNAE_BOLT_N;
  if (temperature <= tt) {
    return { sigma: sigmaT, tau: TAU_SIGMA_FACTOR * sigmaT, sigmaT, sigmaMt: null };
  }
  if (rmt == null || !(rmt > 0)) return null;
  const sigmaMt = rmt / PNAE_BOLT_N;
  const sigma = Math.min(sigmaT, sigmaMt);
  return { sigma, tau: TAU_SIGMA_FACTOR * sigma, sigmaT, sigmaMt };
}

export function calcStudLength(
  flange1: number,
  flange2: number,
  gasket: number,
  hNut: number,
  P: number
) {
  const l2 = hNut + 2 * P;
  const L = flange1 + gasket + flange2 + l2;
  return { l1: 0, l2, L };
}

export function calculateBoltsStudsNuts(input: BoltsStudsNutsInputs): BoltsStudsNutsResults {
  const base: BoltsStudsNutsResults = {
    h: 0,
    d3: 0,
    Aw: 0,
    AD: 0,
    Ww: 0,
    K1Bolt: K1_BOLT_METRIC,
    K1Nut: K1_NUT_METRIC,
    Km: 0,
    rmRatio: 0,
    F1w: 0,
    Mk: 0,
    MklSimple: 0,
    MklRefined: 0,
    sigmaW: 0,
    tauSw: 0,
    tauBody: 0,
    tauThreadQw: 0,
    tauThreadBolt: 0,
    tauThreadNut: 0,
    sigmaEq: 0,
    tauAllow: 0,
    tauNutAllow: 0,
    sigmaEqAllow: 0,
    AwRequired: 0,
    studLength: 0,
    l1: 0,
    l2: 0,
    checks: {
      tension: false,
      torsion: false,
      equivalent: false,
      threadBolt: false,
      threadNut: false,
      threadQw: false,
      bodyShear: false,
      area: false,
    },
    error: null,
  };

  if (!(input.D > 0) || !(input.P > 0) || !(input.z > 0) || !(input.sigma > 0)) {
    return { ...base, error: "Проверьте D, P, z и [σ]" };
  }

  const h = calcThreadProfileH(input.P);
  const d3 = calcD3(input.D, input.P);
  const Aw = calcAw(d3, input.dHole);
  const AD = calcAD(input.D, input.dHole);
  const Ww = calcWw(d3, input.dHole);

  if (!(Aw > 0) || !(Ww > 0)) {
    return { ...base, h, d3, error: "Некорректная геометрия резьбы" };
  }

  const sigmaNut = input.sigmaNut > 0 ? input.sigmaNut : input.sigma;
  const tauAllow = TAU_SIGMA_FACTOR * input.sigma;
  const tauNutAllow = TAU_SIGMA_FACTOR * sigmaNut;
  const Km = lookupKm(tauAllow, tauNutAllow);
  const F1w = input.F0w / input.z;
  const zeta = input.lubricated ? ZETA_LUBRICATED : ZETA_DRY;
  const zeta1 = input.lubricated ? ZETA1_LUBRICATED : ZETA1_DRY;

  const Mk = input.zeroTighteningTorque ? 0 : zeta * F1w * input.D;
  const MklSimple = input.zeroTighteningTorque ? 0 : zeta1 * F1w * input.D;
  const MklRefined = MklSimple;

  const sigmaW = F1w / Aw;
  const tauSw = Mk / Ww;
  const tauThreadQw = input.Qw > 0 && Aw > 0 ? input.Qw / (Aw * input.z) : 0;
  const tauBody = input.Qw > 0 && AD > 0 ? input.Qw / (AD * input.z) : 0;

  const hEng = input.hNut > 0 ? input.hNut : input.D;
  const threadDenomBolt = Math.PI * d3 * hEng * K1_BOLT_METRIC * Km;
  const threadDenomNut = Math.PI * input.D * hEng * K1_NUT_METRIC * Km;
  const tauThreadBolt = threadDenomBolt > 0 ? F1w / threadDenomBolt : 0;
  const tauThreadNut = threadDenomNut > 0 ? F1w / threadDenomNut : 0;

  const sigmaEq = Math.sqrt(sigmaW * sigmaW + 3 * tauSw * tauSw);
  const sigmaEqAllow = SIGMA_EQ_FACTOR * input.sigma;
  const AwRequired = F1w / input.sigma;

  const { l1, l2, L } = calcStudLength(input.flange1, input.flange2, input.gasket, hEng, input.P);

  return {
    h,
    d3,
    Aw,
    AD,
    Ww,
    K1Bolt: K1_BOLT_METRIC,
    K1Nut: K1_NUT_METRIC,
    Km,
    rmRatio: input.rmNut > 0 ? input.rmBolt / input.rmNut : 1,
    F1w,
    Mk,
    MklSimple,
    MklRefined,
    sigmaW,
    tauSw,
    tauBody,
    tauThreadQw,
    tauThreadBolt,
    tauThreadNut,
    sigmaEq,
    tauAllow,
    tauNutAllow,
    sigmaEqAllow,
    AwRequired,
    studLength: L,
    l1: input.D > 0 ? 1.5 * input.D : l1,
    l2,
    checks: {
      tension: sigmaW <= input.sigma,
      torsion: tauSw <= tauAllow,
      equivalent: sigmaEq <= sigmaEqAllow,
      threadBolt: tauThreadBolt <= tauAllow,
      threadNut: tauThreadNut <= tauNutAllow,
      threadQw: tauThreadQw <= tauAllow,
      bodyShear: tauBody <= tauAllow,
      area: Aw >= AwRequired,
    },
    error: null,
  };
}

export function boltThresholdT(categoryId: string | null, materialGroup: string | null) {
  return in1ThresholdT({ categoryId, materialGroup });
}
