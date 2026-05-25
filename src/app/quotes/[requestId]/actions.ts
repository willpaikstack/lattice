"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { purchaseQuote } from "@/lib/request-repository";

export async function purchaseQuoteAction(requestId: string) {
  await purchaseQuote(requestId);

  revalidatePath("/quotes");
  revalidatePath(`/quotes/${requestId}`);
  revalidatePath("/orders");
  redirect("/orders");
}
