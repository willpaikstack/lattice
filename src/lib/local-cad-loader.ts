import { cadDemoFileError, cadDemoFormat, type CadDemoModel } from "./cad-demo";

let pendingImport: Promise<void> = Promise.resolve();

/** Serialize conversions so multiple selected parts do not allocate several large parsers at once. */
export async function loadLocalCadFile(file: File, signal: AbortSignal): Promise<CadDemoModel> {
  signal.throwIfAborted();
  const previous = pendingImport;
  let release!: () => void;
  pendingImport = new Promise<void>(resolve => { release = resolve; });
  await previous;
  try { return await parseLocalCadFile(file, signal); } finally { release(); }
}

/** Run parsing off the UI thread. Aborting or timing out releases the worker's memory. */
async function parseLocalCadFile(file: File, signal: AbortSignal): Promise<CadDemoModel> {
  const problem = cadDemoFileError(file.name, file.size);
  if (problem) throw new Error(problem);
  signal.throwIfAborted();
  const buffer = await file.arrayBuffer();
  signal.throwIfAborted();
  const format = cadDemoFormat(file.name)!;
  return new Promise((resolve, reject) => {
    const worker = format === "step" || format === "iges"
      ? new Worker("/cad-demo/import-worker.js")
      : new Worker(new URL("./local-cad-mesh-worker.ts", import.meta.url), { type: "module" });
    const finish = () => { clearTimeout(timeout); signal.removeEventListener("abort", abort); worker.terminate(); };
    const abort = () => { finish(); reject(new DOMException("Model opening cancelled.", "AbortError")); };
    const timeout = setTimeout(() => { finish(); reject(new Error("This model took too long to open. The original file is still available.")); }, 120000);
    signal.addEventListener("abort", abort, { once: true });
    worker.onmessage = ({ data }: MessageEvent<{ result?: CadDemoModel; error?: string }>) => {
      finish();
      if (data.error || !data.result?.meshes?.length) reject(new Error(data.error || "No viewable geometry was found."));
      else resolve({ ...data.result, dimensionsUnit: data.result.dimensionsUnit ?? "mm" });
    };
    worker.onerror = () => { finish(); reject(new Error("The model reader stopped. Try another export or use the original file.")); };
    worker.postMessage({ buffer, name: file.name, format }, [buffer]);
  });
}
