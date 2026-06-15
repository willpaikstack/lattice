"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { archiveOrder } from "@/lib/request-repository";
import { requireActionRole } from "@/lib/route-authorization";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function archiveOrderAction(formData: FormData) {
  await requireActionRole(["admin"]);
  const requestId = getString(formData, "requestId").trim();

  if (!requestId) {
    throw new Error("Order ID is required");
  }

  await archiveOrder(requestId);

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${requestId}`);
  redirect("/admin/orders");
}
