import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { cadDemoFileError, cadDemoFormat } from "./cad-demo";
import { toCadDemoModel } from "./cad-demo-mesh";

describe("CAD demo file selection", () => {
  it.each([
    ["part.STEP", "step"], ["part.stp", "step"], ["part.IGES", "iges"], ["part.igs", "iges"],
    ["part.stl", "stl"], ["part.obj", "obj"], ["part.gltf", "gltf"], ["part.glb", "glb"],
  ] as const)("detects %s as %s", (name, format) => {
    expect(cadDemoFormat(name)).toBe(format);
    expect(cadDemoFileError(name, 1)).toBeNull();
  });

  it("rejects unknown, empty, and over-limit files", () => {
    expect(cadDemoFileError("part.sldprt", 10)).toContain("Choose a STEP, IGES, STL, OBJ, glTF, or GLB");
    expect(cadDemoFileError("part.stl", 0)).toContain("empty");
    expect(cadDemoFileError("part.stl", 50 * 1024 * 1024 + 1)).toContain("smaller than 50 MB");
  });
});

describe("mesh preview normalization", () => {
  it("preserves model-unit dimensions for unitless mesh formats", () => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 4, 6), new THREE.MeshStandardMaterial());
    const model = toCadDemoModel(mesh, { dimensionsUnit: "model units" });
    expect(model.dimensionsUnit).toBe("model units");
    expect(model.meshes).toHaveLength(1);
    expect(model.meshes[0].index.array.length).toBe(36);
    expect(model.meshes[0].attributes.position.array).toHaveLength(72);
  });

  it("applies scene transforms, meter conversion, and glTF up-axis conversion", () => {
    const root = new THREE.Group();
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 3), new THREE.MeshStandardMaterial());
    mesh.position.set(1, 0, 0);
    root.add(mesh);
    const model = toCadDemoModel(root, { dimensionsUnit: "mm", unitScale: 1000, yUp: true });
    const positions = model.meshes[0].attributes.position.array;
    expect(Math.max(...positions)).toBe(1500);
  });

  it("rejects objects without triangles", () => {
    const root = new THREE.Group();
    root.add(new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshStandardMaterial()));
    expect(() => toCadDemoModel(root, { dimensionsUnit: "model units" })).toThrow("No viewable 3D geometry");
  });
});
