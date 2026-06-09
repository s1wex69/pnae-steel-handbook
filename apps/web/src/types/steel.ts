export interface SteelPropertyMeta {
  label: string;
  unit: string;
}

export interface SteelGrade {
  name: string;
  classId: string;
  group: string | null;
  mark: string | null;
  rm: Record<string, number>;
  rp02: Record<string, number>;
  elongationA?: Record<string, number>;
  reductionZ?: Record<string, number>;
  thermalExpansionAlpha?: Record<string, number>;
  elasticModulusE?: Record<string, number>;
}

export interface SteelHandbook {
  source: string;
  standard: string;
  temperaturesC: number[];
  properties: Record<string, SteelPropertyMeta>;
  grades: SteelGrade[];
}

export type SteelPropertyKey =
  | "rm"
  | "rp02"
  | "elongationA"
  | "reductionZ"
  | "thermalExpansionAlpha"
  | "elasticModulusE";
