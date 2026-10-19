import { targetDeliveryDateError } from "./target-delivery-date";
import { readTargetDeliveryDate } from "./rfq-manufacturing";
import type { DraftRequestInput } from './request-model';
import { isCadFileName, manufacturingUploadError } from './cad-upload-policy';
import { qualityDocumentationOptions, generalToleranceOptions } from './rfq-options';

export function validateSubmissionShape(value: unknown): asserts value is DraftRequestInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid RFQ package.');
  const input = value as DraftRequestInput;
  if (typeof input.title !== 'string' || !input.title.trim() || input.title.length > 500) throw new Error('Enter a quote name.');
  if (!Array.isArray(input.lineItems) || !input.lineItems.length || input.lineItems.length > 100 || !Array.isArray(input.files) || !input.files.length || input.files.length > 200) throw new Error('Choose CAD files and configure at least one part.');
  input.lineItems.forEach((part, index) => {
    if (!part || typeof part !== 'object' || typeof part.material !== 'string' || !Number.isSafeInteger(part.quantity) || part.quantity < 1 || part.quantity > 1000000) throw new Error(`Part ${index + 1}: enter a whole quantity between 1 and 1,000,000.`);
    for (const field of ['surfaceFinish', 'generalTolerance', 'notes', 'partName'] as const) if (part[field] !== undefined && (typeof part[field] !== 'string' || part[field]!.length > 20000)) throw new Error(`Part ${index + 1}: invalid specifications.`);
    const deliveryError = targetDeliveryDateError(readTargetDeliveryDate(part.manufacturingDetails));
    if (deliveryError) throw new Error(`Part ${index + 1}: ${deliveryError}`);
    if (part.generalTolerance && !generalToleranceOptions.some(o => o.value === part.generalTolerance || o.label === part.generalTolerance)) throw new Error(`Part ${index + 1}: select a supported tolerance.`);
    if (part.qualityDocumentation !== undefined && (!Array.isArray(part.qualityDocumentation) || part.qualityDocumentation.some(v => typeof v !== 'string' || !qualityDocumentationOptions.some(o => o.value === v || o.label === v)))) throw new Error(`Part ${index + 1}: select supported quality documentation.`);
  });
  input.files.forEach(file => {
    if (!file || typeof file.name !== 'string' || file.name.length > 255 || /[\x00-\x1f/\\]/.test(file.name) || typeof file.type !== 'string' || /[\r\n]/.test(file.type) || !Number.isSafeInteger(file.sizeBytes)) throw new Error('Invalid file metadata. Upload the file again.');
    if (file.sizeBytes<=0) throw new Error(`${file.name} must be uploaded again before submitting.`);
    const error = manufacturingUploadError({name:file.name,size:file.sizeBytes}); if (error) throw new Error(error);
    if (file.lineItemIndex === undefined && input.lineItems.length === 1) file.lineItemIndex = 0;
    if (!Number.isInteger(file.lineItemIndex) || file.lineItemIndex! < 0 || file.lineItemIndex! >= input.lineItems.length) throw new Error('Associate every uploaded file with a part.');
  });
  input.lineItems.forEach((part,index) => {
    const files = input.files.filter(f => f.lineItemIndex === index);
    if (files.filter(f => isCadFileName(f.name)).length !== 1) throw new Error(`Part ${index + 1}: upload exactly one CAD file.`);
    // Older clients encoded selected feature flags as exact generated note lines.
    // Never treat arbitrary prose (including "no drawing required") as a flag.
    const legacyFeature = /^(?:Drawing-specific tolerances|Part markings|Linear tolerance tighter than general tolerance|Threads|Engineering fits|Sharp internal corners) requested; drawing required\.$/im.test(part.notes ?? '');
    const requirements = part.manufacturingDetails?.drawingRequirements;
    const required = generalToleranceOptions.some(o => (o.value === part.generalTolerance || o.label === part.generalTolerance) && o.metadata?.requiresDrawing)
      || part.qualityDocumentation?.some(v => qualityDocumentationOptions.some(o => (o.value === v || o.label === v) && o.metadata?.requiresDrawing))
      || Object.values(requirements ?? {}).some(value => value === true) || (requirements === undefined && legacyFeature);
    if (required && !files.some(f => !isCadFileName(f.name))) throw new Error(`Part ${index + 1}: upload a drawing for the selected specifications.`);
  });
}
