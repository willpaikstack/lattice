import {createHash} from 'node:crypto';
import {NextResponse} from 'next/server';
import {revalidatePath} from 'next/cache';
import type {PrismaClient} from '@prisma/client';
import {getCurrentSession} from '@/lib/session';
import {getRequestById} from '@/lib/request-repository';
import {getPrismaClient} from '@/lib/prisma';
import {completeDirectUpload,prepareDirectUpload,saveLocalUpload} from '@/lib/local-file-storage';
import {queueCustomerLifecycleEmail} from '@/lib/customer-lifecycle-email';
export const dynamic='force-dynamic';
const maxBytes=25*1024*1024;
export async function POST(request:Request,{params}:{params:Promise<{requestId:string}>}) {
  const session=await getCurrentSession();
  if(session?.user.role!=='admin')return NextResponse.json({error:'Lattice Admin access required.'},{status:session?403:401});
  const {requestId}=await params;
  const order=await getRequestById(requestId,{requireDatabase:true});
  if(!order || order.status!=='PURCHASED')return NextResponse.json({error:'Order not found.'},{status:404});
  if(['SHIPPED','DELIVERED'].includes(order.supplierOrder.status))return NextResponse.json({error:'Upload quality documents before shipment.'},{status:409});
  const folder='quality-documents/'+createHash('sha256').update(requestId+'\0'+session.user.id).digest('hex');
  try {
    const input=request.headers.get('content-type')?.includes('application/json')?await request.json():null;
    if(input?.action==='prepare'){
      const f=input.file;
      if(!f || typeof f.name!=='string' || !f.name || f.name.length>255 || /[\x00-\x1f/\\]/.test(f.name) || typeof f.type!=='string' || /[\r\n]/.test(f.type) || !Number.isSafeInteger(f.sizeBytes) || f.sizeBytes<1 || f.sizeBytes>maxBytes)return NextResponse.json({error:'Choose a quality document up to 25 MB.'},{status:400});
      return NextResponse.json({upload:await prepareDirectUpload(f,folder)},{headers:{'Cache-Control':'no-store'}});
    }
    let stored;
    if(input?.action==='complete'){
      if(typeof input.storageKey!=='string' || !input.storageKey.startsWith(folder+'/') || input.storageKey.split('/').some((p:string)=>p==='..'||p==='.'))return NextResponse.json({error:'Upload not found.'},{status:404});
      stored=await completeDirectUpload(input.storageKey);
    } else if(!input) {
      const form=await request.formData();const file=form.get('file');
      if(!(file instanceof File) || file.size<1 || file.size>maxBytes)return NextResponse.json({error:'Choose a quality document up to 25 MB.'},{status:400});
      stored=await saveLocalUpload(file,folder);
    } else return NextResponse.json({error:'Invalid upload action.'},{status:400});
    if(!stored.storageKey || stored.sizeBytes>maxBytes)return NextResponse.json({error:'The document could not be verified.'},{status:400});
    const key=stored.storageKey;const id='quality_'+createHash('sha256').update(key).digest('hex');
    const client=await getPrismaClient() as PrismaClient;
    const created=await client.$transaction(async tx=>{
      // Lock/recheck the order in the same transaction as document attachment.
      const updated=await tx.request.updateMany({where:{id:requestId,status:'PURCHASED',supplierOrderStatus:{notIn:['SHIPPED','DELIVERED']}},data:{updatedAt:new Date()}});
      if(!updated.count)throw new Error('Upload quality documents before shipment.');
      if(await tx.supplierDocument.findUnique({where:{id}}))return false;
      await tx.request.update({where:{id:requestId},data:{qualityApprovedAt:null,qualityApprovedBy:null,supplierDocuments:{create:{id,name:stored.name,sizeBytes:stored.sizeBytes,type:stored.type,storageKey:key,category:'INSPECTION_REPORT'}}}});
      return true;
    });
    if(created && order.requiresQualityApproval)await queueCustomerLifecycleEmail(order,'QUALITY_APPROVAL_REQUESTED',key);
    revalidatePath(`/admin/orders/${requestId}`);revalidatePath(`/orders/${requestId}`);
    return NextResponse.json({saved:true,file:stored},{status:created?201:200});
  }catch(error){
    if(error instanceof Error && /before shipment|upload is incomplete/i.test(error.message))return NextResponse.json({error:error.message},{status:400});
    console.error('Quality document upload failed',error instanceof Error?error.name:'unknown');
    return NextResponse.json({error:'The document could not be saved. Please retry; shipment approval has not been granted.'},{status:503});
  }
}
