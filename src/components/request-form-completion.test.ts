import { describe, expect, it } from "vitest";
import { restrictionPolicyVersion } from "@/lib/rfq-manufacturing";
import { buildDraftRequest } from "@/lib/request-model";
import { draftCompletionPercent, type RequestFormInitialState } from "./request-form";

const request = buildDraftRequest({buyerCompany:"Test",requesterName:"Test",title:"Part",process:"CNC Milling",dueDate:"2026-12-01",files:[],lineItems:[{partName:"Part",material:"Stainless",quantity:1}]});
const part = {fileName:"part.step",fileStorageKey:"rfq-drafts/part.step",material:"ss_304",generalTolerance:"iso_2768_medium_m",surfaceFinish:"as_machined_ra_3_2",quantity:"1",qualityDocumentation:["standard_inspection"]};
const state: RequestFormInitialState = {projectName:"Part",restrictionStatus:"unrestricted",restrictionPolicyVersion,endUse:"commercial",lineItems:[part]};
describe("saved RFQ completion",()=>{
 it("shows 100 only for ready-to-submit details",()=>expect(draftCompletionPercent(request,state)).toBe(100));
 it("does not count a filename as an uploaded CAD file",()=>expect(draftCompletionPercent(request,{...state,lineItems:[{...part,fileStorageKey:undefined}]})).toBeLessThan(100));
 it("changes when required fields are cleared",()=>{
  const materialMissing=draftCompletionPercent(request,{...state,lineItems:[{...part,material:""}]});
  const moreMissing=draftCompletionPercent(request,{...state,lineItems:[{...part,material:"",quantity:"0",generalTolerance:""}]});
  expect(moreMissing).toBeLessThan(materialMissing);expect(materialMissing).toBeLessThan(100);
 });
 it("checks every part and conditional drawing requirements",()=>{
  const needsDrawing={...part,threads:true};
  expect(draftCompletionPercent(request,{...state,lineItems:[part,needsDrawing]})).toBeLessThan(100);
  expect(draftCompletionPercent(request,{...state,lineItems:[part,{...needsDrawing,technicalDrawingName:"drawing.pdf",technicalDrawingStorageKey:"rfq-drafts/drawing.pdf"}]})).toBe(100);
 });
 it("shows zero when no part file is started",()=>expect(draftCompletionPercent(request,{...state,lineItems:[{...part,fileName:"",fileStorageKey:undefined}]})).toBe(0));
});
