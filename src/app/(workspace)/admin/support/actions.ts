"use server";
import { revalidatePath } from "next/cache";
import { getCurrentSession } from "@/lib/session";
import { deliverCustomerEmailEvent } from "@/lib/customer-lifecycle-email";

export async function retryCustomerEmail(formData: FormData) {
  if ((await getCurrentSession())?.user.role !== "admin") throw new Error("Lattice Admin access required.");
  const key = formData.get("key");
  if (typeof key !== "string" || !key || key.length > 1000) throw new Error("Invalid email event.");
  try { await deliverCustomerEmailEvent(key); }
  finally { revalidatePath("/admin/support"); }
}
