import { importMeshModel } from "./local-cad-mesh-import";
import type { CadDemoFormat } from "./cad-demo";

self.onmessage = async ({ data }: MessageEvent<{ buffer: ArrayBuffer; name: string; format: CadDemoFormat }>) => {
  try {
    const result = await importMeshModel(data.buffer, data.name, data.format);
    const transfers: Transferable[] = [];
    for (const mesh of result.meshes) {
      transfers.push((mesh.attributes.position.array as Float32Array).buffer, (mesh.index.array as Uint32Array).buffer);
      if (mesh.attributes.normal) transfers.push((mesh.attributes.normal.array as Float32Array).buffer);
    }
    self.postMessage({ result }, { transfer: transfers });
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : "The model could not be opened." });
  }
};
