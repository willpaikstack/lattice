import type { CadMetadata } from "./rfq-manufacturing";

export type CadModelGeometry = {
  getBoundingBox?: () => { min: { x: number; y: number; z: number }; max: { x: number; y: number; z: number } };
  getUnitString?: () => string | null;
  getUnitScale?: () => number;
};

/** Viewer SDK unit scale is meters per model unit; unknown units are not inferred. */
export function cadMetadataFromModel(model: CadModelGeometry): CadMetadata | undefined {
  const sourceUnit = model.getUnitString?.();
  const scale = model.getUnitScale?.();
  const bounds = model.getBoundingBox?.();
  if (!sourceUnit || !bounds || !scale || !Number.isFinite(scale) || scale <= 0) return undefined;
  const dimensionsMm = ["x", "y", "z"].map(axis =>
    (bounds.max[axis as "x" | "y" | "z"] - bounds.min[axis as "x" | "y" | "z"]) * scale * 1000,
  ) as [number, number, number];
  return dimensionsMm.every(value => Number.isFinite(value) && value >= 0) && dimensionsMm.some(value => value > 0)
    ? { dimensionsMm, sourceUnit } : undefined;
}
