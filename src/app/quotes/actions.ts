"use server";

import { revalidatePath } from "next/cache";

import { deleteBuyerQuote } from "@/lib/request-repository";

export async function deleteBuyerQuoteAction(requestId: string) {
  const trimmedRequestId = requestId.trim();

  if (!trimmedRequestId) {
    throw new Error("Request ID is required");
  }

  const deleted = await deleteBuyerQuote(trimmedRequestId);
  revalidatePath("/quotes");
  return deleted;
}
