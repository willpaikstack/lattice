"use server";

import { revalidatePath } from "next/cache";
import { saveCallRequest, type CallRequestState } from "@/lib/call-request";

export async function requestCallAction(
  _previous: CallRequestState,
  formData: FormData,
): Promise<CallRequestState> {
  const result = await saveCallRequest(formData);
  if (result.status === "received") revalidatePath("/admin/customers");
  return result;
}
