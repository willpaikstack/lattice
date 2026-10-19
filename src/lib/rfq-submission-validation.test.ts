import {describe,it,expect} from 'vitest';
import {validateSubmissionShape} from './rfq-submission-validation';
import type { DraftRequestInput } from './request-model';
const valid=()=>({title:'QA',lineItems:[{quantity:1,material:'6061',qualityDocumentation:['Standard Inspection']}],files:[{name:'part.step',sizeBytes:10,type:'model/step',storageKey:'rfq/test/part.step',lineItemIndex:0}]});
it('requires a CAD file for each part and a correct association',()=>{
 const v=valid();v.files[0].lineItemIndex=1;expect(()=>validateSubmissionShape(v)).toThrow('Associate');
 expect(()=>validateSubmissionShape({...valid(),files:[{...valid().files[0],name:'drawing.pdf'}]})).toThrow('CAD file');
});
it('rejects required inspection without drawing and accepts an attached drawing',()=>{
 const v=valid();v.lineItems[0].qualityDocumentation=['Dimensional Inspection Report'];expect(()=>validateSubmissionShape(v)).toThrow('upload a drawing');v.files.push({...v.files[0],name:'drawing.pdf',type:'application/pdf'});expect(()=>validateSubmissionShape(v)).not.toThrow();
});
describe('malformed intake',()=>{it.each([null,{}, {...valid(),lineItems:[{quantity:1.5,material:'A'}]}, {...valid(),files:[{...valid().files[0],name:'a.exe'}]}, {...valid(),files:[{...valid().files[0],sizeBytes:0}]}])('rejects before persistence: %j',v=>expect(()=>validateSubmissionShape(v)).toThrow());});

it.each(['No drawing required.', 'Please review whether a drawing required by the supplier is necessary.', 'Customer notes: no drawing required'])('does not turn customer prose into drawing requirements: %s', notes => {
  expect(() => validateSubmissionShape({ ...valid(), lineItems: [{ ...valid().lineItems[0], notes }] })).not.toThrow();
});
it('enforces structured feature requirements even without generated notes, and preserves legacy feature flags', () => {
  const input: DraftRequestInput = valid();
  input.lineItems[0].manufacturingDetails = { process: 'cnc_milling', materialKey: '', finishKey: '', customerPartNumber: '', cadRevision: '', drawingRevision: '', fileHistory: [], drawingRequirements: { threads: true } };
  expect(() => validateSubmissionShape(input)).toThrow('upload a drawing');
  input.lineItems[0].manufacturingDetails.drawingRequirements = { threads: false };
  expect(() => validateSubmissionShape(input)).not.toThrow();
  input.lineItems[0].notes = 'Customer note\nThreads requested; drawing required.';
  expect(() => validateSubmissionShape(input)).not.toThrow();
  delete input.lineItems[0].manufacturingDetails.drawingRequirements;
  expect(() => validateSubmissionShape(input)).toThrow('upload a drawing');
});

it('requires a drawing for structured drawing-specific tolerance requirements', () => {
  const input: DraftRequestInput = valid();
  input.lineItems[0].manufacturingDetails = { process: 'cnc_milling', materialKey: '', finishKey: '', customerPartNumber: '', cadRevision: '', drawingRevision: '', fileHistory: [], drawingRequirements: { drawingSpecificTolerances: true } };
  expect(() => validateSubmissionShape(input)).toThrow('upload a drawing');
  input.files.push({ ...input.files[0], name: 'drawing.pdf', type: 'application/pdf' });
  expect(() => validateSubmissionShape(input)).not.toThrow();
});
