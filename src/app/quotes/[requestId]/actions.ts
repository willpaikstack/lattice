"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { purchaseQuote } from "@/lib/request-repository";

function formText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function purchaseQuoteAction(requestId: string, formData: FormData) {
  await purchaseQuote(requestId, {
    shipToAddress1: formText(formData, "shipToAddress1"),
    shipToAddress2: formText(formData, "shipToAddress2"),
    shipToCity: formText(formData, "shipToCity"),
    shipToCompany: formText(formData, "shipToCompany"),
    shipToName: formText(formData, "shipToName"),
    shipToPhone: formText(formData, "shipToPhone"),
    shipToState: formText(formData, "shipToState"),
    shipToZipCode: formText(formData, "shipToZipCode"),
  });

  revalidatePath("/quotes");
  revalidatePath(`/quotes/${requestId}`);
  revalidatePath("/orders");
  redirect("/orders");
}
