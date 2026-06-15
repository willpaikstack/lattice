"use server";

import { revalidatePath } from "next/cache";

import { deleteBuyerQuote } from "@/lib/request-repository";
import { requireActionRole } from "@/lib/route-authorization";

export async function deleteBuyerQuoteAction(requestId: string) {
  await requireActionRole(["customer", "admin"]);
  const trimmedRequestId = requestId.trim();

  if (!trimmedRequestId) {
    throw new Error("Request ID is required");
  }

  const deleted = await deleteBuyerQuote(trimmedRequestId);
  revalidatePath("/quotes");
  return deleted;
}
