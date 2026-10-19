"use client";

import dynamic from "next/dynamic";
import { Box, FileUp, ShieldCheck, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cadDemoFileError, type CadDemoModel } from "@/lib/cad-demo";
import { loadLocalCadFile } from "@/lib/local-cad-loader";

const Scene = dynamic(() => import("./cad-demo-scene"), { ssr: false, loading: () => <p className="p-10 text-slate-500">Starting 3D viewer…</p> });

export function CadDemo() {
  const input = useRef<HTMLInputElement>(null);
  const controller = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const [model, setModel] = useState<CadDemoModel | null>(null);
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [duration, setDuration] = useState(0);

  useEffect(() => () => { generation.current++; controller.current?.abort(); }, []);

  function cancel() {
    generation.current++; controller.current?.abort(); controller.current = null; setBusy(false);
  }

  function removeModel() {
    cancel();
    setModel(null); setFileName(""); setError(""); setDuration(0);
    if (input.current) input.current.value = "";
  }

  async function load(file?: File) {
    cancel();
    const current = generation.current;
    setError(""); setModel(null); setFileName(""); setBusy(true);
    const abort = new AbortController();
    controller.current = abort;
    const start = performance.now();
    try {
      if (!file) {
        const response = await fetch("/cad-demo/lattice-demo-cube.step", { signal: abort.signal });
        if (!response.ok) throw new Error("The sample model could not be loaded.");
        file = new File([await response.arrayBuffer()], "Lattice demo cube.step");
      }
      if (current !== generation.current) return;
      const problem = cadDemoFileError(file.name, file.size);
      if (problem) throw new Error(problem);
      setFileName(file.name);
      const result = await loadLocalCadFile(file, abort.signal);
      if (current !== generation.current) return;
      setModel(result);
      setDuration((performance.now() - start) / 1000);
      setBusy(false);
    } catch (caught) {
      if (current === generation.current) { setError(caught instanceof Error ? caught.message : "The file could not be opened."); setBusy(false); }
    }
  }


  return <div className="mx-auto max-w-[1500px] space-y-6">
    <style>{`.cad-demo-button{border:1px solid #dbe2ec;border-radius:6px;padding:8px 12px;font-size:12px;font-weight:600;color:#24354e;background:white;cursor:pointer}.cad-demo-button:hover,.cad-demo-button[aria-pressed=true]{background:#edf2ff;border-color:#8eaaff}.cad-demo-button:focus-visible{outline:2px solid #2455f5;outline-offset:2px}`}</style>
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Admin tools · Experimental</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">CAD viewer demo</h1><p className="mt-2 text-sm text-slate-500">Explore a model with OpenCascade. No Autodesk credits required.</p></div>
      <span className="flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700"><ShieldCheck size={15} /> Files stay in your browser</span>
    </header>
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
      <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" aria-label="CAD preview">
        <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4"><div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-800"><Box className="shrink-0 text-blue-600" size={19} /><span className="break-all">{fileName || "Model preview"}</span></div><div className="flex flex-wrap gap-2">{model && <button className="cad-demo-button" onClick={removeModel} aria-label="Remove current model"><X className="mr-2 inline" size={14} />Remove model</button>}<button className="cad-demo-button" onClick={() => void load()}>Load sample</button><button className="cad-demo-button" onClick={() => input.current?.click()}><FileUp className="mr-2 inline" size={14} />Open CAD file</button></div></div>
        <p className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs leading-5 text-slate-600"><span className="font-semibold text-slate-700">Accepted file types:</span> STEP (.step, .stp), IGES (.iges, .igs), STL (.stl), OBJ (.obj), glTF (.gltf), and GLB (.glb). Maximum file size: 200 MB.</p>
        <input ref={input} type="file" accept=".step,.stp,.iges,.igs,.stl,.obj,.gltf,.glb" className="sr-only" aria-label="Choose a supported 3D model" onChange={event => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void load(file); }} />
        {busy ? <div className="flex min-h-[500px] flex-col items-center justify-center gap-4 bg-slate-50" role="status"><span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600 motion-reduce:animate-none" /><p className="text-sm text-slate-600">Opening model in your browser…</p><button className="cad-demo-button" onClick={cancel}>Cancel</button></div> : model ? <Scene model={model} /> : <div className="flex min-h-[500px] flex-col items-center justify-center px-6 text-center"><div className="mb-5 rounded-2xl bg-blue-50 p-5 text-blue-600"><Box size={36} strokeWidth={1.4} /></div><h2 className="text-xl font-semibold text-slate-900">Bring a part into view</h2><p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">Open STEP, IGES, STL, OBJ, glTF or GLB files, or start with the synthetic 20 mm cube. Rotate, zoom and inspect the preview.</p><button className="mt-5 rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600" onClick={() => void load()}>Try sample model</button>{error && <p role="alert" className="mt-5 max-w-lg text-sm text-red-700">{error}</p>}</div>}
      </section>
      <aside className="space-y-4">
        <section className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="text-sm font-semibold text-slate-900">About this demo</h2><dl className="mt-5 space-y-4 text-sm"><div><dt className="text-xs text-slate-500">Supported files</dt><dd className="mt-1 font-medium text-slate-800">STEP / STP · IGES / IGS · STL · OBJ · glTF / GLB</dd></div><div><dt className="text-xs text-slate-500">File limit</dt><dd className="mt-1 text-slate-800">200 MB per model</dd></div><div><dt className="text-xs text-slate-500">Output dimensions</dt><dd className="mt-1 text-slate-800">{model?.dimensionsUnit === "model units" ? "Model units (STL and OBJ do not define a unit)" : "Millimeters (converted from source units)"}</dd></div>{model && <><div><dt className="text-xs text-slate-500">Geometry</dt><dd className="mt-1 text-slate-800">{model.meshes.length.toLocaleString()} meshes · {model.meshes.reduce((sum, mesh) => sum + mesh.index.array.length / 3, 0).toLocaleString()} triangles</dd></div><div><dt className="text-xs text-slate-500">Conversion time</dt><dd className="mt-1 text-slate-800">{duration.toFixed(1)} seconds</dd></div></>}</dl></section>
        <section className="rounded-xl border border-blue-100 bg-blue-50 p-5 text-sm leading-6 text-slate-600"><h2 className="mb-2 font-semibold text-slate-900">A separate testing space</h2><p>Models opened here are temporary. They are not saved or attached to an RFQ.</p><p className="mt-3">The RFQ workflow uses this same local viewer for supported formats. Native SolidWorks, Inventor and Parasolid files use Autodesk in the RFQ workflow.</p><p className="mt-3 text-xs">Previews are tessellated. Dimensions show a bounding box, not a manufacturing inspection measurement. STL and OBJ files do not include units, so their sizes are shown in model units. glTF/GLB dimensions are converted from meters to millimeters. A .gltf file must have embedded assets; use .glb when its buffers or textures are separate files.</p></section>
        <p className="px-1 text-xs leading-5 text-slate-400">Powered by <a className="underline" href="https://github.com/kovacsv/occt-import-js/tree/0.0.23" target="_blank" rel="noreferrer">occt-import-js / OpenCascade</a> and Three.js. <a className="underline" href="/cad-demo/occt-0.0.23/license.occt-import-js.txt" target="_blank" rel="noreferrer">Importer license</a> · <a className="underline" href="/cad-demo/occt-0.0.23/license.occt.txt" target="_blank" rel="noreferrer">OCCT license</a>.</p>
      </aside>
    </div>
  </div>;
}
