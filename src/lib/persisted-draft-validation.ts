import { draftInitialState } from "./request-form-prefill";
import { readIntakeDeclaration, readManufacturingDetails, readTargetDeliveryDate } from "./rfq-manufacturing";
import { buildDraftRequest, type LatticeRequest } from './request-model';

type RecordValue = Record<string, unknown>;
const record = (v: unknown): v is RecordValue => !!v && typeof v === 'object' && !Array.isArray(v);
function compatible(template: unknown, value: unknown): boolean {
  if (value === undefined || template === undefined) return true;
  if (template === null) return value === null || typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value));
  if (Array.isArray(template)) return Array.isArray(value);
  if (record(template)) return record(value) && Object.entries(template).every(([k,t])=>compatible(t,value[k]));
  return typeof value === typeof template;
}
function validInitialState(v: unknown): boolean {
  if (!record(v)) return false;
  return Object.entries(v).every(([key,value]) => {
    if (value === undefined) return true;
    if (key==='lineItems') return Array.isArray(value) && value.length<=100 && value.every(validInitialState);
    if (key==='fileHistory') return Array.isArray(value) && value.length<=50 && value.every(record);
    if (key==='cadPreview') return record(value) && typeof value.status==='string' && ['idle','uploading','processing','ready','failed','reference_only'].includes(value.status) && (value.urn===undefined || typeof value.urn==='string');
    if (key==='qualityDocumentation') return Array.isArray(value) && value.every(x=>typeof x==='string');
    if (/SizeBytes$/.test(key)) return typeof value==='number' && Number.isFinite(value) && value>=0;
    if (['requiresQualityApproval','partMarkings','tightLinearTolerance','threads','engineeringFits','sharpInternalCorners'].includes(key)) return typeof value==='boolean';
    if (key==='cadMetadata') return record(value) && Array.isArray(value.dimensionsMm) && value.dimensionsMm.length===3 && value.dimensionsMm.every(n=>typeof n==='number' && Number.isFinite(n)) && typeof value.sourceUnit==='string';
    return typeof value==='string' || typeof value==='boolean' || (typeof value==='number' && Number.isFinite(value));
  });
}
function normalizeInitialDates(value: RecordValue): RecordValue {
  const result = { ...value };
  if ("targetShipDate" in result) {
    result.targetDeliveryDate = readTargetDeliveryDate(result);
    delete result.targetShipDate;
  }
  if (Array.isArray(result.lineItems)) result.lineItems = result.lineItems.map(part => record(part) ? normalizeInitialDates(part) : part);
  return result;
}
export function normalizePersistedDraft(value: unknown) {
  if (!record(value) || typeof value.id!=='string' || !/^(local_draft_|demo_|fixture_)[a-z0-9_]+$/.test(value.id) || typeof (value.updatedAt ?? (record(value.request) ? value.request.updatedAt : undefined))!=='string' || !Number.isFinite(Date.parse(String(value.updatedAt ?? (record(value.request) ? value.request.updatedAt : '')))) || (value.schemaVersion!==undefined && value.schemaVersion!==1) || !record(value.request)) return null;
  const r=value.request; const updatedAt=String(value.updatedAt ?? r.updatedAt);
  if (r.status!=='DRAFT' || typeof r.id!=='string' || typeof r.title!=='string' || !Array.isArray(r.lineItems) || !r.lineItems.length || r.lineItems.length>100 || !Array.isArray(r.files) || r.files.length>200) return null;
  if (!r.lineItems.every(p=>record(p) && typeof p.material==='string' && typeof p.quantity==='number' && Number.isFinite(p.quantity) && p.quantity>=0 && (p.qualityDocumentation===undefined || (Array.isArray(p.qualityDocumentation) && p.qualityDocumentation.every(v=>typeof v==='string'))))) return null;
  if (!r.files.every(f=>record(f) && typeof f.name==='string' && typeof f.type==='string' && typeof f.sizeBytes==='number' && Number.isFinite(f.sizeBytes) && f.sizeBytes>=0 && ['storageKey','cadPreviewUrn','id'].every(k=>f[k]===undefined || typeof f[k]==='string') && (f.lineItemIndex===undefined || (Number.isInteger(f.lineItemIndex) && Number(f.lineItemIndex)>=0 && Number(f.lineItemIndex)<(r.lineItems as unknown[]).length)))) return null;
  const baseline=buildDraftRequest({title:r.title || 'Untitled RFQ',lineItems:r.lineItems.map(p=>({material:p.material||'Not selected',quantity:p.quantity||1})),files:[]});
  if (!compatible(baseline,r) || !r.lineItems.every((p,i)=>compatible(baseline.lineItems[i],p))) return null;
  for (const k of ['customerQuotes','supplierQuotes','statusEvents','supplierQuoteFiles']) if (Array.isArray(r[k]) && !(r[k] as unknown[]).every(record)) return null;
  const request={...baseline,...r,intakeDeclaration:readIntakeDeclaration(r.intakeDeclaration),customerQuotes:r.customerQuotes??[],supplierQuotes:r.supplierQuotes??[],statusEvents:r.statusEvents??[],lineItems:r.lineItems.map((p,i)=>({...baseline.lineItems[i],...p,manufacturingDetails:readManufacturingDetails(p.manufacturingDetails)})),operatorReview:{...baseline.operatorReview,...(r.operatorReview as object??{})},supplierOrder:{...baseline.supplierOrder,...(r.supplierOrder as object??{})},quote:{...baseline.quote,...(r.quote as object??{})},purchasePayment:{...baseline.purchasePayment,...(r.purchasePayment as object??{})}} as LatticeRequest;
  // Invalid UI caches cannot override a recoverable saved request. Keep their
  // original database record intact; reconstruct the form from request fields.
  return {...value,schemaVersion:1,id:value.id,updatedAt,request:{...request,id:value.id,createdAt:request.createdAt||updatedAt,updatedAt:request.updatedAt||updatedAt},initialState:validInitialState(value.initialState) && Object.keys(value.initialState as object).length ? normalizeInitialDates(value.initialState as RecordValue) : draftInitialState(request)};
}
