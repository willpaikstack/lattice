import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { saveLocalUpload } from "@/lib/local-file-storage";
import { addSupplierQuoteFile } from "@/lib/request-repository";
import { getCurrentSession } from "@/lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function isUploadFile(value: FormDataEntryValue | null): value is File {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as File).arrayBuffer === "function" &&
    typeof (value as File).name === "string" &&
    typeof (value as File).size === "number" &&
    (value as File).size > 0
  );
}

function safeReturnPath(returnTo: string, fallback: string) {
  return returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : fallback;
}

function appendQueryParam(path: string, key: string, value: string) {
  const url = new URL(path, "http://localhost");
  url.searchParams.set(key, value);
  return `${url.pathname}${url.search}${url.hash}`;
}

export async function POST(request: Request) {
  const session = await getCurrentSession();

  const formData = await request.formData();
  const requestId = getString(formData, "requestId").trim();
  const returnTo = getString(formData, "returnTo").trim();
  const fallbackPath = requestId ? `/admin/quotes?requestId=${encodeURIComponent(requestId)}` : "/admin/quotes";
  const destination = safeReturnPath(returnTo, fallbackPath);
  const fileValue = formData.get("supplierQuoteFile");

  if (session?.user.role !== "admin") {
    redirect(appendQueryParam(destination, "supplierQuoteError", session ? "forbidden" : "auth"));
  }

  if (!requestId) {
    redirect(appendQueryParam(destination, "supplierQuoteError", "missing-request"));
  }

  if (!isUploadFile(fileValue)) {
    redirect(appendQueryParam(destination, "supplierQuoteError", "missing"));
  }

  const storedFile = await saveLocalUpload(fileValue, "supplier-quotes");
  await addSupplierQuoteFile(requestId, storedFile);

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${requestId}`);
  revalidatePath("/admin/quotes");
  revalidatePath("/quotes");
  revalidatePath(`/quotes/${requestId}`);
  revalidatePath("/orders");
  revalidatePath(`/orders/${requestId}`);
  revalidatePath("/supplier/orders");
  revalidatePath(`/supplier/orders/${requestId}`);

  redirect(destination);
}
