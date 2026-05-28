"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { sendWaitingListAlreadyRepresentedEmail, sendWaitingListThankYouEmail } from "../../lib/waiting-list-email";
import { requestWaitingListAccess } from "../../lib/waiting-list";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function joinWaitingListAction(formData: FormData) {
  const result = await requestWaitingListAccess({
    name: getString(formData, "name"),
    email: getString(formData, "email"),
    company: getString(formData, "company"),
    procurementNeeds: getString(formData, "procurementNeeds"),
  });

  if (result.status === "already-requested") {
    redirect("/waiting-list?status=already-requested");
  }

  if (result.status === "domain-already-requested") {
    await sendWaitingListAlreadyRepresentedEmail(result.requestedEntry, result.existingEntry);
    redirect("/waiting-list?status=domain-already-requested");
  }

  await sendWaitingListThankYouEmail(result.entry);
  revalidatePath("/admin/customers");
  revalidatePath("/waiting-list");
  redirect("/waiting-list?status=joined");
}
