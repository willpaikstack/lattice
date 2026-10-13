import type { LatticeRequest, UploadedFile } from "./request-model";

export function rfqFileKind(file: Pick<UploadedFile, "name" | "type">) {
  if (/\.(pdf|dwg|dxf|png|jpg|jpeg|webp)$/i.test(file.name) || /pdf|image|drawing|dwg|dxf/i.test(file.type)) return "drawing";
  if (/\.(step|stp|iges|igs|sldprt|sldasm|x_t|x_b|sat|ipt|iam|3mf|stl|obj)$/i.test(file.name) || /step|cad|iges|solidworks|parasolid/i.test(file.type)) return "cad";
  return "other";
}

/** Saved lineItemIndex is the submission contract. Never infer ownership from file order. */
export function groupAdminRfqFiles(request: Pick<LatticeRequest, "lineItems" | "files">) {
  const parts = request.lineItems.map((lineItem, index) => ({
    lineItem,
    files: request.files.filter(file => file.lineItemIndex === index),
  }));
  const unassignedFiles = request.files.filter(file =>
    !Number.isInteger(file.lineItemIndex) || (file.lineItemIndex as number) < 0 || (file.lineItemIndex as number) >= parts.length,
  );
  return { parts, unassignedFiles };
}

export function rfqFileHref(file: UploadedFile, preview = false) {
  if (!file.storageKey) return null;
  const key = file.storageKey.split("/").map(encodeURIComponent).join("/");
  const query = new URLSearchParams({ name: file.name });
  if (preview) query.set("preview", "1");
  return `/api/local-files/${key}?${query}`;
}
