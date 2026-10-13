// Manufacturing part formats verified against APS GET /designdata/formats (SVF2).
export const cadFileExtensions = [".step", ".stp", ".iges", ".igs", ".sldprt", ".sat", ".x_t", ".x_b", ".ipt"] as const;
export const cadAccept = cadFileExtensions.join(",");
export const cadFileTypes = cadFileExtensions.map((extension) => extension.slice(1).toUpperCase()).join(", ");
export const maxCadUploadBytes = 200 * 1024 * 1024;
export const drawingFileExtensions = [".pdf", ".dxf", ".dwg", ".png", ".jpg", ".jpeg"] as const;
export const drawingAccept = drawingFileExtensions.join(",");

export function manufacturingUploadError(file: { name: string; size: number }): string | null {
  if (isCadFileName(file.name)) return cadUploadError(file);
  if (!drawingFileExtensions.some((extension) => file.name.toLowerCase().endsWith(extension))) return "Choose a supported CAD file or technical drawing.";
  if (file.size <= 0) return "The drawing file is empty.";
  if (file.size > maxCadUploadBytes) return "Maximum drawing file size is 200 MB per file.";
  return null;
}

export function isCadFileName(name: string) {
  return cadFileExtensions.some((extension) => name.toLowerCase().endsWith(extension));
}

export function cadUploadError(file: { name: string; size: number }): string | null {
  if (!isCadFileName(file.name)) return `Choose a supported CAD file: ${cadFileTypes}. Add PDF drawings separately.`;
  if (file.size <= 0) return "The CAD file is empty.";
  if (file.size > maxCadUploadBytes) return "Maximum CAD file size is 200 MB per file.";
  return null;
}
