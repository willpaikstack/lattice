export const CAD_DEMO_MAX_BYTES = 50 * 1024 * 1024;

export type CadDemoFormat = "step" | "iges" | "stl" | "obj" | "gltf" | "glb";

export function cadDemoFormat(name: string): CadDemoFormat | null {
  const extension = name.split(".").pop()?.toLowerCase();
  if (extension === "step" || extension === "stp") return "step";
  if (extension === "iges" || extension === "igs") return "iges";
  if (extension === "stl" || extension === "obj" || extension === "gltf" || extension === "glb") return extension;
  return null;
}

export function cadDemoFileError(name: string, size: number): string | null {
  if (!cadDemoFormat(name)) return "Choose a STEP, IGES, STL, OBJ, glTF, or GLB model file.";
  if (size === 0) return "This file is empty. Choose a model containing geometry.";
  if (size > CAD_DEMO_MAX_BYTES) return "Choose a file smaller than 50 MB for this demo.";
  return null;
}

export type CadDemoModel = {
  dimensionsUnit?: "mm" | "model units";
  meshes: {
    name: string;
    color?: [number, number, number];
    attributes: { position: { array: number[] }; normal?: { array: number[] } };
    index: { array: number[] };
    brep_faces?: { first: number; last: number; color?: [number, number, number] | null }[];
  }[];
};
