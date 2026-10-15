"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { CadDemoModel } from "@/lib/cad-demo";

export default function CadDemoScene({ model, onThumbnail, onError }: { model: CadDemoModel; onThumbnail?: (image: Blob) => void; onError?: () => void }) {
  const errorCallback = useRef(onError);
  useEffect(() => { errorCallback.current = onError; }, [onError]);
  const thumbnailCallback = useRef(onThumbnail);
  useEffect(() => { thumbnailCallback.current = onThumbnail; }, [onThumbnail]);
  const host = useRef<HTMLDivElement>(null);
  const actions = useRef<{ fit: (direction?: THREE.Vector3) => void; wire: () => void } | null>(null);
  const [error, setError] = useState("");
  const [dimensions, setDimensions] = useState("");
  const [wireframe, setWireframe] = useState(false);

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
    renderer.setClearColor(0xf0f4f8, 1);
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
      group.add(new THREE.Mesh(geometry, materials));
      if (mesh.index.array.length > 600000) continue; // Avoid a second large geometry allocation for optional edge outlines.
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 25), new THREE.LineBasicMaterial({ color: 0x334a63, transparent: true, opacity: 0.45 }));
      group.add(edges);
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
    const render = () => renderer.render(scene, camera);
    const fit = (direction = camera.position.clone().normalize()) => {
      if (!direction.lengthSq()) direction.set(1, -1, 0.8).normalize();
      const distance = (span * 0.5 * Math.sqrt(3)) / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2)) / Math.min(camera.aspect, 1) * 1.15;
      camera.near = Math.max(span / 10000, 0.00001);
      camera.far = distance + span * 100;
      camera.position.copy(direction.normalize().multiplyScalar(distance));
      camera.updateProjectionMatrix();
      controls.target.set(0, 0, 0); controls.update(); render();
    };
    actions.current = { fit, wire: () => {
      group.traverse(object => {
        if (object instanceof THREE.Mesh) for (const material of object.material as THREE.MeshStandardMaterial[]) material.wireframe = !material.wireframe;
      });
      render();
    } };
    const resize = new ResizeObserver(() => {
      const width = element.clientWidth, height = element.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix(); render();
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
      renderer.setSize(width, height);
      camera.aspect = width / height;
      fit(new THREE.Vector3(1, -1, 0.8));
    }
    controls.addEventListener("change", render);
    return () => {
      disposed = true;
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

  return <div>
    <style>{`.cad-demo-button{border:1px solid #dbe2ec;border-radius:6px;padding:8px 12px;font-size:12px;font-weight:600;color:#24354e;background:white;cursor:pointer}.cad-demo-button:hover,.cad-demo-button[aria-pressed=true]{background:#edf2ff;border-color:#8eaaff}.cad-demo-button:focus-visible{outline:2px solid #2455f5;outline-offset:2px;outline-color:#2563eb}`}</style>
    <div className="flex flex-wrap gap-2 border-b border-slate-200 bg-white p-3">
      <button type="button" className="cad-demo-button" onClick={() => actions.current?.fit()}>Fit model</button>
      <button type="button" className="cad-demo-button" onClick={() => actions.current?.fit(new THREE.Vector3(1, -1, 0.8))}>Isometric</button>
      <button type="button" className="cad-demo-button" onClick={() => actions.current?.fit(new THREE.Vector3(0, -1, 0))}>Front</button>
      <button type="button" className="cad-demo-button" onClick={() => actions.current?.fit(new THREE.Vector3(0.001, 0, 1))}>Top</button>
      <button type="button" className="cad-demo-button" aria-pressed={wireframe} onClick={() => { actions.current?.wire(); setWireframe(value => !value); }}>Wireframe {wireframe ? "on" : "off"}</button>
    </div>
    {error ? <p role="alert" className="p-8 text-red-700">{error}</p> : <div ref={host} className="h-[440px] w-full overflow-hidden sm:h-[560px]" />}
    <div className="flex flex-wrap justify-between gap-2 border-t border-slate-200 bg-white px-4 py-3 text-xs text-slate-500"><span>Drag to rotate · Scroll to zoom · Right-drag to pan</span><span aria-label="Model dimensions">{dimensions}</span></div>
  </div>;
}
