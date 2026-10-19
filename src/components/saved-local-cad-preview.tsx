import type { UploadedFile } from "@/lib/request-model";
import { localCadFileUrl } from "@/lib/cad-demo";
import { LocalCadPreview } from "./local-cad-preview";

type SavedModel = Pick<UploadedFile, "name" | "sizeBytes" | "storageKey">;

export function SavedLocalCadPreview({ file }: { file: SavedModel }) {
  if (!file.storageKey) return <p className="p-5 text-sm text-slate-600">The original file is unavailable for preview.</p>;
  return <LocalCadPreview name={file.name} sizeBytes={file.sizeBytes} storageKey={file.storageKey} url={localCadFileUrl(file.storageKey, file.name)} />;
}
