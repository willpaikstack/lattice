/* global importScripts, occtimportjs */
importScripts("/cad-demo/occt-0.0.23/occt-import-js.js");

self.onmessage = async ({ data }) => {
  try {
    const occt = await occtimportjs({ locateFile: name => `/cad-demo/occt-0.0.23/${name}` });
    const content = new Uint8Array(data.buffer);
    const options = { linearUnit: "millimeter", linearDeflectionType: "bounding_box_ratio", linearDeflection: 0.001, angularDeflection: 0.5 };
    const result = data.format === "iges" ? occt.ReadIgesFile(content, options) : occt.ReadStepFile(content, options);
    if (!result.success || !result.meshes?.length) throw new Error("No viewable geometry was found. Check that this is a complete STEP or IGES model.");
    self.postMessage({ result });
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : "The model could not be converted." });
  }
};
