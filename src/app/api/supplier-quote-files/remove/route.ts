import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { removeSupplierQuoteFile } from "@/lib/request-repository";
import { getCurrentSession } from "@/lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
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
  const fileId = getString(formData, "fileId").trim();
  const returnTo = getString(formData, "returnTo").trim();
  const fallbackPath = requestId ? `/admin/quotes?requestId=${encodeURIComponent(requestId)}` : "/admin/quotes";
  const destination = safeReturnPath(returnTo, fallbackPath);

  if (session?.user.role !== "admin") {
    redirect(appendQueryParam(destination, "supplierQuoteError", session ? "forbidden" : "auth"));
  }

  if (!requestId || !fileId) {
    redirect(appendQueryParam(destination, "supplierQuoteError", "missing-remove"));
  }

  await removeSupplierQuoteFile(requestId, fileId);

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
