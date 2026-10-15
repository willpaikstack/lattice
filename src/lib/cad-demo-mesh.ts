import * as THREE from "three";
import type { CadDemoModel } from "./cad-demo";

/** Flatten a Three.js model into the serializable geometry shape used by the demo scene. */
export function toCadDemoModel(
  root: THREE.Object3D,
  options: { unitScale?: number; dimensionsUnit: "mm" | "model units"; yUp?: boolean },
): CadDemoModel {
  root.updateMatrixWorld(true);
  const axisCorrection = options.yUp ? new THREE.Matrix4().makeRotationX(Math.PI / 2) : new THREE.Matrix4();
  const meshes: CadDemoModel["meshes"] = [];

  root.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    const geometry = object.geometry.clone();
    const transform = axisCorrection.clone().multiply(object.matrixWorld);
    geometry.applyMatrix4(transform);
    if (options.unitScale && options.unitScale !== 1) geometry.scale(options.unitScale, options.unitScale, options.unitScale);

    const position = geometry.getAttribute("position");
    if (!position || position.count < 3) {
      geometry.dispose();
      return;
    }
    if (!geometry.getAttribute("normal")) geometry.computeVertexNormals();

    const indices = geometry.index?.array;
    const index = indices ? Array.from(indices, value => Number(value)) : Array.from({ length: position.count }, (_, vertex) => vertex);
    if (index.length < 3) {
      geometry.dispose();
      return;
    }
    const material = Array.isArray(object.material) ? object.material[0] : object.material;
    const color = material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshPhysicalMaterial || material instanceof THREE.MeshPhongMaterial || material instanceof THREE.MeshLambertMaterial || material instanceof THREE.MeshBasicMaterial
      ? material.color
      : undefined;
    const normal = geometry.getAttribute("normal");

    meshes.push({
      name: object.name || `Mesh ${meshes.length + 1}`,
      color: color ? [color.r, color.g, color.b] : undefined,
      attributes: {
        position: { array: Array.from(position.array) },
        ...(normal ? { normal: { array: Array.from(normal.array) } } : {}),
      },
      index: { array: index },
    });
    geometry.dispose();
  });

  if (!meshes.length) throw new Error("No viewable 3D geometry was found in this file.");
  return { meshes, dimensionsUnit: options.dimensionsUnit };
}
