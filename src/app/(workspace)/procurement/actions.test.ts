import { beforeEach, describe, expect, it, vi } from "vitest";
const m=vi.hoisted(()=>({auth:vi.fn(), supplierCount:vi.fn(), supplierUpdate:vi.fn(), rfqUpdate:vi.fn(), rfqCreate:vi.fn()}));
vi.mock("@/lib/route-authorization",()=>({requireActionRole:m.auth}));
vi.mock("@/lib/prisma",()=>({getPrismaClient:async()=>({procurementSupplier:{count:m.supplierCount,updateMany:m.supplierUpdate},materialRfq:{updateMany:m.rfqUpdate,create:m.rfqCreate}})}));
vi.mock("next/cache",()=>({revalidatePath:vi.fn()}));
vi.mock("next/navigation",()=>({redirect:vi.fn()}));
import { saveDraft, saveSupplier } from "./actions";
import { blankDraft } from "@/lib/procurement";
beforeEach(()=>{vi.clearAllMocks();m.auth.mockResolvedValue({user:{role:"customer",companyId:"company-a"}});});
describe("procurement company boundaries",()=>{
 it("refuses a supplier from another company in a draft",async()=>{m.supplierCount.mockResolvedValue(0);const d=blankDraft();d.messages=[{supplierId:"foreign",subject:"",body:""}];const f=new FormData();f.set("draft",JSON.stringify(d));await expect(saveDraft(f)).rejects.toThrow("Invalid supplier");expect(m.supplierCount).toHaveBeenCalledWith({where:{companyId:"company-a",id:{in:["foreign"]}}});expect(m.rfqCreate).not.toHaveBeenCalled();});
 it("does not update a different company's draft",async()=>{m.supplierCount.mockResolvedValue(0);m.rfqUpdate.mockResolvedValue({count:0});const f=new FormData();f.set("id","foreign");f.set("draft",JSON.stringify(blankDraft()));await expect(saveDraft(f)).rejects.toThrow("Draft not found");expect(m.rfqUpdate.mock.calls[0][0].where).toEqual({id:"foreign",companyId:"company-a"});});
 it("scopes supplier edits to the signed-in company",async()=>{m.supplierUpdate.mockResolvedValue({count:0});const f=new FormData();f.set("id","foreign");f.set("name","Supplier");f.set("email","supplier@example.com");await expect(saveSupplier(f)).rejects.toThrow("Supplier not found");expect(m.supplierUpdate.mock.calls[0][0].where).toEqual({id:"foreign",companyId:"company-a"});});
 it("rejects support impersonation",async()=>{m.auth.mockResolvedValue({user:{companyId:"company-a",supportAdmin:{id:"admin"}}});await expect(saveDraft(new FormData())).rejects.toThrow("Customer company account required");expect(m.supplierCount).not.toHaveBeenCalled();});
});
