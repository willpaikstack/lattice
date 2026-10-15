import { describe, expect, it } from "vitest";
import { cadAccept, cadFileExtensions, cadFileTypes, cadUploadError, isCadFileName, manufacturingUploadError } from "./cad-upload-policy";

describe("customer CAD upload formats", () => {
  it.each([".stl", ".obj", ".gltf", ".glb"])("accepts %s for CAD uploads", (extension) => {
    const name = `part${extension}`;
    expect(isCadFileName(name)).toBe(true);
    expect(cadUploadError({ name, size: 1 })).toBeNull();
    expect(manufacturingUploadError({ name, size: 1 })).toBeNull();
    expect(cadAccept.split(",")).toContain(extension);
  });

  it("advertises the new formats alongside the existing native CAD formats", () => {
    expect(cadFileExtensions).toEqual([
      ".step", ".stp", ".iges", ".igs", ".stl", ".obj", ".gltf", ".glb",
      ".sldprt", ".sat", ".x_t", ".x_b", ".ipt",
    ]);
    expect(cadFileTypes).toContain("STL");
    expect(cadFileTypes).toContain("OBJ");
    expect(cadFileTypes).toContain("GLTF");
    expect(cadFileTypes).toContain("GLB");
  });

  it("continues to reject unrelated formats and preserves the separate drawing rules", () => {
    expect(cadUploadError({ name: "part.3mf", size: 1 })).toContain("Choose a supported CAD file");
    expect(manufacturingUploadError({ name: "drawing.pdf", size: 1 })).toBeNull();
  });
});
