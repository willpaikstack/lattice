'use client';
import {useState,type FormEvent} from 'react';
import {useRouter} from 'next/navigation';
export function AdminQualityDocumentUpload({requestId}:{requestId:string}){
 const router=useRouter();const [pending,setPending]=useState(false);const [message,setMessage]=useState('');
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();const form=event.currentTarget;const file=new FormData(form).get('file');
  if(!(file instanceof File) || file.size<1 || file.size>25*1024*1024){setMessage('Choose a quality document up to 25 MB.');return;}
  setPending(true);setMessage('');const endpoint=`/api/orders/${encodeURIComponent(requestId)}/quality-documents`;
  async function result(response:Response){const data=await response.json();if(!response.ok)throw new Error(data.error||'The upload failed. Please retry.');return data;}
  try{
   const prepared=await result(await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'prepare',file:{name:file.name,type:file.type||'application/octet-stream',sizeBytes:file.size}})}));
   if(prepared.upload.mode==='local'){const data=new FormData();data.append('file',file);await result(await fetch(endpoint,{method:'POST',body:data}));}
   else if(prepared.upload.mode==='direct'){
    const put=await fetch(prepared.upload.uploadUrl,{method:'PUT',headers:prepared.upload.headers,body:file,credentials:'omit'});
    if(!put.ok)throw new Error('The file could not be uploaded. Please retry.');
    await result(await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'complete',storageKey:prepared.upload.storageKey})}));
   }else throw new Error('Document storage is unavailable. Please retry.');
   form.reset();setMessage('Inspection document saved. Any previous approval was cleared for the new package.');router.refresh();
  }catch(error){setMessage(error instanceof Error?error.message:'The upload failed. Please retry.');}finally{setPending(false);}
 }
 return <form onSubmit={submit} className="flex flex-wrap items-center gap-3"><input required disabled={pending} aria-label="Quality document" name="file" type="file"/><button disabled={pending} type="submit" className="rounded bg-stone-950 px-4 py-2 text-sm text-white">{pending?'Uploading…':'Upload inspection document'}</button><p className="w-full text-sm text-stone-600">Maximum file size: 25 MB.</p>{message&&<p className="w-full text-sm" role="status">{message}</p>}</form>;
}
