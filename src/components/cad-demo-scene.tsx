"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Expand, House, Ruler, Scissors, X } from "lucide-react";
import type { CadDemoModel } from "@/lib/cad-demo";
import styles from "./cad-demo-scene.module.css";

type Tool = "measure" | "explode" | "section" | null;
type Axis = "x" | "y" | "z";
type SceneActions = {
  fit: (direction?: THREE.Vector3) => void;
  tool: (tool: Tool) => void;
  explode: (amount: number) => void;
  section: (axis: Axis, offset: number, flipped: boolean) => void;
  clearMeasurement: () => void;
};

export default function CadDemoScene({ model, onThumbnail, onError }: { model: CadDemoModel; onThumbnail?: (image: Blob) => void; onError?: () => void }) {
  const errorCallback = useRef(onError);
  useEffect(() => { errorCallback.current = onError; }, [onError]);
  const thumbnailCallback = useRef(onThumbnail);
  useEffect(() => { thumbnailCallback.current = onThumbnail; }, [onThumbnail]);
  const host = useRef<HTMLDivElement>(null);
  const viewCube = useRef<HTMLDivElement>(null);
  const actions = useRef<SceneActions | null>(null);
  const [error, setError] = useState("");
  const [dimensions, setDimensions] = useState("");
  const [tool, setTool] = useState<Tool>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [unit, setUnit] = useState("mm");
  const [explosion, setExplosion] = useState(25);
  const [axis, setAxis] = useState<Axis>("x");
  const [sectionOffset, setSectionOffset] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [viewsOpen, setViewsOpen] = useState(false);

  function selectTool(next: Tool) {
    actions.current?.tool(next);
    setTool(next); setDistance(null); setExplosion(25); setAxis("x"); setSectionOffset(0); setFlipped(false);
  }

  function reportSceneError(message: string) {
    // WebGL setup happens in an effect; defer React state updates until after it commits.
    queueMicrotask(() => { setError(message); errorCallback.current?.(); });
  }

  useEffect(() => {
    if (!host.current) return;
    const element = host.current;
    let disposed = false;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); }
    catch { reportSceneError("3D viewing needs WebGL. Try a browser with hardware acceleration enabled."); return; }
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.01, 10000);
    camera.up.set(0, 0, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0xf0f4f8, 0);
    renderer.localClippingEnabled = true;
    renderer.domElement.setAttribute("aria-label", "Interactive CAD model. Drag to rotate, scroll to zoom, right-drag to pan. Use the view buttons for keyboard navigation.");
    renderer.domElement.setAttribute("role", "img");
    element.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = false;
    scene.add(new THREE.HemisphereLight(0xffffff, 0x6c7d96, 2.5));
    const light = new THREE.DirectionalLight(0xffffff, 3);
    light.position.set(1, -2, 3);
    scene.add(light);
    const group = new THREE.Group();
    const parts: THREE.Group[] = [];
    for (const mesh of model.meshes) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(mesh.attributes.position.array instanceof Float32Array ? mesh.attributes.position.array : Float32Array.from(mesh.attributes.position.array), 3));
      geometry.setIndex(new THREE.BufferAttribute(mesh.index.array instanceof Uint32Array ? mesh.index.array : Uint32Array.from(mesh.index.array), 1));
      if (mesh.attributes.normal) geometry.setAttribute("normal", new THREE.BufferAttribute(mesh.attributes.normal.array instanceof Float32Array ? mesh.attributes.normal.array : Float32Array.from(mesh.attributes.normal.array), 3));
      else geometry.computeVertexNormals();
      // Preserve per-face colors where present, with the mesh color as fallback.
      const colors = [mesh.color ?? [0.57, 0.68, 0.82], ...(mesh.brep_faces ?? []).map(face => face.color ?? mesh.color ?? [0.57, 0.68, 0.82])];
      const materials = colors.map(color => new THREE.MeshStandardMaterial({ color: new THREE.Color(...color as [number, number, number]), metalness: 0.22, roughness: 0.43, side: THREE.DoubleSide }));
      geometry.addGroup(0, mesh.index.array.length, 0);
      // Face ranges are triangle indices in the OCCT importer result.
      if (mesh.brep_faces?.length) {
        geometry.clearGroups();
        let cursor = 0;
        mesh.brep_faces.forEach((face, index) => {
          const start = face.first * 3;
          if (start > cursor) geometry.addGroup(cursor, start - cursor, 0);
          geometry.addGroup(start, (face.last - face.first + 1) * 3, index + 1);
          cursor = (face.last + 1) * 3;
        });
        if (cursor < mesh.index.array.length) geometry.addGroup(cursor, mesh.index.array.length - cursor, 0);
      }
      const part = new THREE.Group();
      part.add(new THREE.Mesh(geometry, materials));
      parts.push(part); group.add(part);
      if (mesh.index.array.length > 600000) continue; // Avoid a second large geometry allocation for optional edge outlines.
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 25), new THREE.LineBasicMaterial({ color: 0x334a63, transparent: true, opacity: 0.45 }));
      part.add(edges);
    }
    const bounds = new THREE.Box3().setFromObject(group);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const span = Math.max(size.x, size.y, size.z);
    if (!Number.isFinite(span) || span <= 0) {
      group.traverse(object => {
        if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments) {
          object.geometry.dispose();
          for (const material of Array.isArray(object.material) ? object.material : [object.material]) material.dispose();
        }
      });
      controls.dispose(); renderer.dispose(); renderer.domElement.remove();
      reportSceneError("The file contains no usable 3D geometry."); return;
    }
    group.position.sub(center);
    scene.add(group);
    const unit = model.dimensionsUnit ?? "mm";
    queueMicrotask(() => setDimensions(`${size.x.toFixed(2)} × ${size.y.toFixed(2)} × ${size.z.toFixed(2)} ${unit}`));
    const worldFromCube = new THREE.Matrix4().set(1, 0, 0, 0, 0, 0, -1, 0, 0, -1, 0, 0, 0, 0, 0, 1);
    const cssFromCamera = new THREE.Matrix4().makeScale(1, -1, 1);
    const cubeRotation = new THREE.Matrix4();
    const cameraRotation = new THREE.Matrix4();
    const render = () => {
      renderer.render(scene, camera);
      if (viewCube.current) {
        cameraRotation.extractRotation(camera.matrixWorldInverse);
        cubeRotation.copy(cssFromCamera).multiply(cameraRotation).multiply(worldFromCube);
        viewCube.current.style.transform = `matrix3d(${cubeRotation.elements.join(",")})`;
      }
    };
    const fit = (direction = camera.position.clone().sub(controls.target).normalize()) => {
      if (!direction.lengthSq()) direction.set(1, -1, 0.8).normalize();
      const currentBounds = new THREE.Box3().setFromObject(group);
      const currentSize = currentBounds.getSize(new THREE.Vector3());
      const target = currentBounds.getCenter(new THREE.Vector3());
      const currentSpan = Math.max(currentSize.x, currentSize.y, currentSize.z);
      const distance = (currentSpan * 0.5 * Math.sqrt(3)) / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2)) / Math.min(camera.aspect, 1) * 1.15;
      camera.near = Math.max(span / 10000, 0.00001);
      camera.far = distance + span * 100;
      camera.position.copy(direction.normalize().multiplyScalar(distance).add(target));
      camera.updateProjectionMatrix();
      controls.target.copy(target); controls.update(); render();
    };
    const partDirections = parts.map((part, index) => {
      const mesh = part.children.find(object => object instanceof THREE.Mesh) as THREE.Mesh;
      mesh.geometry.computeBoundingBox();
      const direction = mesh.geometry.boundingBox!.getCenter(new THREE.Vector3()).sub(center);
      if (direction.lengthSq() < span * span * 1e-12) direction.set(Math.cos(index * 2 * Math.PI / parts.length), Math.sin(index * 2 * Math.PI / parts.length), .35);
      return direction.normalize();
    });
    const measurements = new THREE.Group();
    scene.add(measurements);
    let currentTool: Tool = null;
    let firstPoint: THREE.Vector3 | null = null;
    let clippingPlanes: THREE.Plane[] = [];
    function clearMeasurement(notify = true) {
      measurements.traverse(object => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
          object.geometry.dispose();
          for (const material of Array.isArray(object.material) ? object.material : [object.material]) material.dispose();
        }
      });
      measurements.clear(); firstPoint = null;
      if (notify) { setDistance(null); render(); }
    }
    function section(sectionAxis: Axis, offset: number, reverse: boolean) {
      const normal = new THREE.Vector3(sectionAxis === "x" ? 1 : 0, sectionAxis === "y" ? 1 : 0, sectionAxis === "z" ? 1 : 0).multiplyScalar(reverse ? -1 : 1);
      clippingPlanes = [new THREE.Plane(normal, -offset / 100 * size[sectionAxis] / 2 * (reverse ? -1 : 1))];
      group.traverse(object => {
        if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments) {
          for (const material of Array.isArray(object.material) ? object.material : [object.material]) material.clippingPlanes = clippingPlanes;
        }
      });
      render();
    }
    function explode(amount: number) {
      parts.forEach((part, index) => part.position.copy(partDirections[index]).multiplyScalar(span * amount / 100));
      fit();
    }
    actions.current = { fit, clearMeasurement, section, explode, tool: next => {
      currentTool = next; clearMeasurement();
      parts.forEach(part => part.position.set(0, 0, 0));
      clippingPlanes = [];
      group.traverse(object => {
        if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments) {
          for (const material of Array.isArray(object.material) ? object.material : [object.material]) material.clippingPlanes = [];
        }
      });
      if (next === "section") section("x", 0, false);
      if (next === "explode") explode(25);
      else fit();
    } };
    const raycaster = new THREE.Raycaster();
    let pointerStart = { x: 0, y: 0 };
    const pointerDown = (event: PointerEvent) => { pointerStart = { x: event.clientX, y: event.clientY }; };
    const pointerUp = (event: PointerEvent) => {
      if (currentTool !== "measure" || event.button !== 0 || Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 5) return;
      const rect = renderer.domElement.getBoundingClientRect();
      raycaster.setFromCamera(new THREE.Vector2((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1), camera);
      const hit = raycaster.intersectObject(group, true).find(intersection => intersection.object instanceof THREE.Mesh);
      if (!hit) return;
      if (measurements.children.length >= 3) clearMeasurement();
      const point = hit.point.clone();
      const marker = new THREE.Mesh(new THREE.SphereGeometry(span * .012, 12, 8), new THREE.MeshBasicMaterial({ color: 0x1676d2, depthTest: false }));
      marker.position.copy(point); marker.renderOrder = 100; measurements.add(marker);
      if (firstPoint) {
        const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([firstPoint, point]), new THREE.LineBasicMaterial({ color: 0x1676d2, depthTest: false }));
        line.renderOrder = 100; measurements.add(line); setDistance(firstPoint.distanceTo(point));
      } else firstPoint = point;
      render();
    };
    renderer.domElement.addEventListener("pointerdown", pointerDown);
    renderer.domElement.addEventListener("pointerup", pointerUp);
    const resize = new ResizeObserver(() => {
      const width = element.clientWidth, height = element.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      fit();
    });
    renderer.setSize(element.clientWidth, element.clientHeight);
    camera.aspect = element.clientWidth / element.clientHeight;
    resize.observe(element);
    fit(new THREE.Vector3(1, -1, 0.8));
    // Copy a square isometric frame synchronously after rendering. This avoids
    // retaining WebGL drawing buffers or capturing the viewer controls.
    if (thumbnailCallback.current) {
      const width = Math.max(element.clientWidth, 1), height = Math.max(element.clientHeight, 1);
      renderer.setPixelRatio(1);
      renderer.setClearColor(0xf0f4f8, 1);
      renderer.setSize(384, 384, false);
      camera.aspect = 1;
      fit(new THREE.Vector3(1, -1, 0.8));
      const snapshot = document.createElement("canvas");
      snapshot.width = snapshot.height = 384;
      const context = snapshot.getContext("2d");
      if (context) {
        context.drawImage(renderer.domElement, 0, 0);
        snapshot.toBlob(blob => { if (!disposed) { if (blob) thumbnailCallback.current?.(blob); else errorCallback.current?.(); } }, "image/png");
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setClearColor(0xf0f4f8, 0);
      renderer.setSize(width, height);
      camera.aspect = width / height;
      fit(new THREE.Vector3(1, -1, 0.8));
    }
    controls.addEventListener("change", render);
    return () => {
      disposed = true;
      renderer.domElement.removeEventListener("pointerdown", pointerDown);
      renderer.domElement.removeEventListener("pointerup", pointerUp);
      clearMeasurement(false);
      actions.current = null; resize.disconnect(); controls.dispose();
      group.traverse(object => {
        if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments) {
          object.geometry.dispose();
          for (const material of Array.isArray(object.material) ? object.material : [object.material]) material.dispose();
        }
      });
      renderer.dispose(); renderer.domElement.remove();
    };
  }, [model]);

  const unitless = model.dimensionsUnit === "model units";
  const measuredDistance = distance === null ? null : (unitless || unit === "mm" ? distance : distance / 25.4);
  const view = (direction: THREE.Vector3) => { actions.current?.fit(direction); setViewsOpen(false); };
  return <div className={`lattice-cad-viewer ${styles.viewer}`} role="region" aria-label="CAD model viewer" data-cad-viewer-state={error ? "failed" : "ready"}>
    <style>{`.cad-demo-button{border:1px solid #dbe2ec;border-radius:6px;padding:8px 12px;font-size:12px;font-weight:600;color:#24354e;background:white;cursor:pointer}.cad-demo-button:hover{background:#edf2ff}.cad-demo-button:focus-visible{outline:2px solid #2563eb;outline-offset:2px}`}</style>
    {error ? <p role="alert" className="p-8 text-sm text-red-700">{error}</p> : <div ref={host} className={styles.canvas} />}
    {!error ? <>
      <div className={styles.cube} aria-label="Model orientation" onKeyDown={event => { if (event.key === "Escape") setViewsOpen(false); }}
        onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setViewsOpen(false); }}>
        <button type="button" className={styles.home} title="Fit model" aria-label="Fit model" onClick={() => { selectTool(null); view(new THREE.Vector3(1, -1, .8)); }}><House size={16} aria-hidden="true" /></button>
        <div className={styles.faces} ref={viewCube}>
          <button type="button" className={`${styles.face} ${styles.front}`} title="Front view" aria-label="Front view" onClick={() => view(new THREE.Vector3(0, -1, 0))}>FRONT</button>
          <button type="button" className={`${styles.face} ${styles.right}`} title="Right view" aria-label="Right view" onClick={() => view(new THREE.Vector3(1, 0, 0))}>RIGHT</button>
          <button type="button" className={`${styles.face} ${styles.top}`} title="Top view" aria-label="Top view" onClick={() => view(new THREE.Vector3(.001, 0, 1))}>TOP</button>
          <button type="button" className={`${styles.face} ${styles.back}`} title="Back view" aria-label="Back view" onClick={() => view(new THREE.Vector3(0, 1, 0))}>BACK</button>
          <button type="button" className={`${styles.face} ${styles.left}`} title="Left view" aria-label="Left view" onClick={() => view(new THREE.Vector3(-1, 0, 0))}>LEFT</button>
          <button type="button" className={`${styles.face} ${styles.bottom}`} title="Bottom view" aria-label="Bottom view" onClick={() => view(new THREE.Vector3(.001, 0, -1))}>BOTTOM</button>
        </div>
        <button type="button" className={styles.views} aria-expanded={viewsOpen} aria-label="Standard views" onClick={() => setViewsOpen(value => !value)}>Views ▾</button>
        {viewsOpen ? <div className={styles.viewMenu}>
          <button type="button" onClick={() => view(new THREE.Vector3(1, -1, .8))}>Isometric</button>
          <button type="button" onClick={() => view(new THREE.Vector3(0, 1, 0))}>Back</button>
          <button type="button" onClick={() => view(new THREE.Vector3(-1, 0, 0))}>Left</button>
          <button type="button" onClick={() => view(new THREE.Vector3(.001, 0, -1))}>Bottom</button>
        </div> : null}
      </div>
      {tool ? <div className={styles.panel} aria-label={`${tool === "measure" ? "Measure" : tool === "explode" ? "Explode" : "Section"} controls`}>
        <div className={styles.panelHeader}><span>{tool === "measure" ? "Measure distance" : tool === "explode" ? "Explode model" : "Section analysis"}</span><button type="button" aria-label="Close model tool" onClick={() => selectTool(null)}><X size={14} aria-hidden="true" /></button></div>
        {tool === "measure" ? <>
          <p aria-live="polite">{measuredDistance === null ? "Select two points on the model." : `Distance: ${measuredDistance.toFixed(3)} ${unitless ? "model units" : unit}`}</p>
          {distance !== null ? <><div className="mt-2 flex items-center gap-2"><span>Units</span>{unitless ? <span>Model units</span> : <select aria-label="Measurement units" value={unit} onChange={event => setUnit(event.target.value)}><option value="mm">mm</option><option value="in">in</option></select>}</div>
          <p className="mt-2 text-[10px] leading-4 text-slate-500">Approximate point-to-point distance on rendered surfaces.</p>
          <button type="button" className={styles.reset} onClick={() => actions.current?.clearMeasurement()}>Clear measurement</button></> : null}
        </> : tool === "explode" ? <>
          <label>Separation: {explosion}%<input aria-label="Explode amount" className={styles.range} type="range" min="0" max="100" value={explosion} onChange={event => { const value = Number(event.target.value); setExplosion(value); actions.current?.explode(value); }} /></label>
        </> : <>
          <div className="flex items-center justify-between gap-3"><label>Axis <select aria-label="Section axis" value={axis} onChange={event => { const value = event.target.value as Axis; setAxis(value); actions.current?.section(value, sectionOffset, flipped); }}><option value="x">X</option><option value="y">Y</option><option value="z">Z</option></select></label><button type="button" className={styles.reset} onClick={() => { setFlipped(value => !value); actions.current?.section(axis, sectionOffset, !flipped); }}>Flip section</button></div>
          <input type="range" aria-label="Section position" className={styles.range} min="-99" max="99" value={sectionOffset} onChange={event => { const value = Number(event.target.value); setSectionOffset(value); actions.current?.section(axis, value, flipped); }} />
        </>}
      </div> : null}
      <div className={styles.toolbar} role="toolbar" aria-label="CAD inspection tools">
        <button type="button" className={styles.tool} title="Measure" aria-label="Measure" aria-pressed={tool === "measure"} onClick={() => selectTool(tool === "measure" ? null : "measure")}><Ruler size={21} aria-hidden="true" /></button>
        <button type="button" className={styles.tool} title={model.meshes.length < 2 ? "Explode model — available for multi-body models" : "Explode model"} aria-label="Explode model" aria-pressed={tool === "explode"} disabled={model.meshes.length < 2} onClick={() => selectTool(tool === "explode" ? null : "explode")}><Expand size={21} aria-hidden="true" /></button>
        <button type="button" className={styles.tool} title="Section analysis" aria-label="Section analysis" aria-pressed={tool === "section"} onClick={() => selectTool(tool === "section" ? null : "section")}><Scissors size={21} aria-hidden="true" /></button>
      </div>
    </> : null}
    <span className="sr-only" aria-label="Model dimensions">{dimensions}</span>
  </div>;
}
