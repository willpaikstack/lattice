/* global importScripts, occtimportjs */
importScripts("/cad-demo/occt-0.0.23/occt-import-js.js");

self.onmessage = async ({ data }) => {
  try {
    const occt = await occtimportjs({ locateFile: name => `/cad-demo/occt-0.0.23/${name}` });
    const content = new Uint8Array(data.buffer);
    const options = { linearUnit: "millimeter", linearDeflectionType: "bounding_box_ratio", linearDeflection: 0.001, angularDeflection: 0.5 };
    const result = data.format === "iges" ? occt.ReadIgesFile(content, options) : occt.ReadStepFile(content, options);
    if (!result.success || !result.meshes?.length) throw new Error("No viewable geometry was found. Check that this is a complete STEP or IGES model.");
    const transfers = [];
    for (const mesh of result.meshes) {
      mesh.attributes.position.array = Float32Array.from(mesh.attributes.position.array);
      transfers.push(mesh.attributes.position.array.buffer);
      if (mesh.attributes.normal) {
        mesh.attributes.normal.array = Float32Array.from(mesh.attributes.normal.array);
        transfers.push(mesh.attributes.normal.array.buffer);
      }
      mesh.index.array = Uint32Array.from(mesh.index.array);
      transfers.push(mesh.index.array.buffer);
    }
    self.postMessage({ result: { meshes: result.meshes, dimensionsUnit: "mm" } }, transfers);
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : "The model could not be converted." });
  }
};
