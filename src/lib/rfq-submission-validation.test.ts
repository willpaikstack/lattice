import {describe,it,expect} from 'vitest';
import {validateSubmissionShape} from './rfq-submission-validation';
const valid=()=>({title:'QA',lineItems:[{quantity:1,material:'6061',qualityDocumentation:['Standard Inspection']}],files:[{name:'part.step',sizeBytes:10,type:'model/step',storageKey:'rfq/test/part.step',lineItemIndex:0}]});
it('requires a CAD file for each part and a correct association',()=>{
 const v=valid();v.files[0].lineItemIndex=1;expect(()=>validateSubmissionShape(v)).toThrow('Associate');
 expect(()=>validateSubmissionShape({...valid(),files:[{...valid().files[0],name:'drawing.pdf'}]})).toThrow('CAD file');
});
it('rejects required inspection without drawing and accepts an attached drawing',()=>{
 const v=valid();v.lineItems[0].qualityDocumentation=['Dimensional Inspection Report'];expect(()=>validateSubmissionShape(v)).toThrow('upload a drawing');v.files.push({...v.files[0],name:'drawing.pdf',type:'application/pdf'});expect(()=>validateSubmissionShape(v)).not.toThrow();
});
describe('malformed intake',()=>{it.each([null,{}, {...valid(),lineItems:[{quantity:1.5,material:'A'}]}, {...valid(),files:[{...valid().files[0],name:'a.exe'}]}, {...valid(),files:[{...valid().files[0],sizeBytes:0}]}])('rejects before persistence: %j',v=>expect(()=>validateSubmissionShape(v)).toThrow());});
