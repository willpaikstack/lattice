import * as THREE from "three";
import type { CadDemoFormat, CadDemoModel } from "./cad-demo";
import { toCadDemoModel } from "./cad-demo-mesh";

export async function importMeshModel(buffer: ArrayBuffer, fileName: string, format: CadDemoFormat): Promise<CadDemoModel> {
    if (format === "stl") {
      const { STLLoader } = await import("three/addons/loaders/STLLoader.js");
      const geometry = new STLLoader().parse(buffer);
      const root = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0x91aecb }));
      return toCadDemoModel(root, { dimensionsUnit: "model units" });
    }
    if (format === "obj") {
      const { OBJLoader } = await import("three/addons/loaders/OBJLoader.js");
      const root = new OBJLoader().parse(new TextDecoder().decode(buffer));
      return toCadDemoModel(root, { dimensionsUnit: "model units" });
    }

    const gltfDocument = format === "gltf" ? JSON.parse(new TextDecoder().decode(buffer)) as { buffers?: { uri?: string }[]; images?: { uri?: string }[] } : readGlbDocument(buffer);
    const externalResources = [...(gltfDocument.buffers ?? []), ...(gltfDocument.images ?? [])]
      .some(resource => resource.uri && !resource.uri.startsWith("data:"));
    if (externalResources) throw new Error("This glTF references separate files. Export it as a self-contained GLB, or embed its buffers and textures before opening it here.");

    const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js");
    const gltf = await new GLTFLoader().parseAsync(buffer, "");
    return toCadDemoModel(gltf.scene, {
      dimensionsUnit: "mm",
      unitScale: 1000,
      yUp: true,
    });
  }

  function readGlbDocument(buffer: ArrayBuffer): { buffers?: { uri?: string }[]; images?: { uri?: string }[] } {
    const view = new DataView(buffer);
    if (view.byteLength < 20 || view.getUint32(0, true) !== 0x46546c67 || view.getUint32(4, true) !== 2) {
      throw new Error("This is not a valid glTF binary (GLB) file.");
    }
    const jsonLength = view.getUint32(12, true);
    const jsonType = view.getUint32(16, true);
    if (jsonType !== 0x4e4f534a || 20 + jsonLength > view.byteLength) throw new Error("This GLB file is missing its model description.");
    const json = new TextDecoder().decode(new Uint8Array(buffer, 20, jsonLength)).replace(/[\u0000\u0020]+$/g, "");
    return JSON.parse(json) as { buffers?: { uri?: string }[]; images?: { uri?: string }[] };
  }

