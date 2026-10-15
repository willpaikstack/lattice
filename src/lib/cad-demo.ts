import { maxCadUploadBytes } from "./cad-upload-policy";

export const CAD_DEMO_MAX_BYTES = maxCadUploadBytes;

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
  if (size > CAD_DEMO_MAX_BYTES) return "Maximum CAD file size is 200 MB per file.";
  return null;
}

export type CadDemoModel = {
  dimensionsUnit?: "mm" | "model units";
  meshes: {
    name: string;
    color?: [number, number, number];
    attributes: { position: { array: number[] | Float32Array }; normal?: { array: number[] | Float32Array } };
    index: { array: number[] | Uint32Array };
    brep_faces?: { first: number; last: number; color?: [number, number, number] | null }[];
  }[];
};

/** Authorized same-origin bytes for reopening a saved model; never a public object URL. */
export function localCadFileUrl(storageKey: string, name: string) {
  const key = storageKey.split("/").map(encodeURIComponent).join("/");
  return `/api/local-files/${key}?${new URLSearchParams({ name, read: "1" })}`;
}
