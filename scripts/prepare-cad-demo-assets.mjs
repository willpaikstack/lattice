import { copyFile, mkdir } from "node:fs/promises";

// Keep the unmodified LGPL runtime separate from application code and locally hosted.
const destination = new URL("../public/cad-demo/occt-0.0.23/", import.meta.url);
await mkdir(destination, { recursive: true });
for (const name of ["occt-import-js.js", "occt-import-js.wasm", "license.occt-import-js.txt", "license.occt.txt"]) {
  await copyFile(new URL(`../node_modules/occt-import-js/dist/${name}`, import.meta.url), new URL(name, destination));
}
