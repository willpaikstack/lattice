export const CAD_DEMO_MAX_BYTES = 50 * 1024 * 1024;

export function cadDemoFormat(name: string): "step" | "iges" | null {
  const extension = name.split(".").pop()?.toLowerCase();
  if (extension === "step" || extension === "stp") return "step";
  if (extension === "iges" || extension === "igs") return "iges";
  return null;
}

export function cadDemoFileError(name: string, size: number): string | null {
  if (!cadDemoFormat(name)) return "Choose a STEP (.step, .stp) or IGES (.iges, .igs) file.";
  if (size === 0) return "This file is empty. Choose a model containing geometry.";
  if (size > CAD_DEMO_MAX_BYTES) return "Choose a file smaller than 50 MB for this demo.";
  return null;
}

export type CadDemoModel = {
  meshes: {
    name: string;
    color?: [number, number, number];
    attributes: { position: { array: number[] }; normal?: { array: number[] } };
    index: { array: number[] };
    brep_faces?: { first: number; last: number; color?: [number, number, number] | null }[];
  }[];
};
