import "server-only";
import { createWaitingListEntry } from "./waiting-list";

export type CallRequestState = {
  status: "idle" | "error" | "received";
  message: string;
};

function field(data: FormData, key: string) {
  const value = data.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/** Use the existing durable admin lead queue without creating an app account. */
export async function saveCallRequest(
  data: FormData,
): Promise<CallRequestState> {
  if (field(data, "website"))
    return {
      status: "error",
      message: "Unable to send this request. Please try again.",
    };
  const name = field(data, "name"),
    email = field(data, "email").toLowerCase(),
    company = field(data, "company");
  const phone = field(data, "phone"),
    needs = field(data, "needs"),
    availability = field(data, "availability");
  if (
    !name ||
    !company ||
    !needs ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return {
      status: "error",
      message:
        "Please enter your name, a valid email, company, and a little about the work you need help with.",
    };
  }
  if (
    name.length > 120 ||
    email.length > 254 ||
    company.length > 180 ||
    phone.length > 50 ||
    needs.length > 3000 ||
    availability.length > 300
  ) {
    return {
      status: "error",
      message:
        "Please shorten your details and try again. Manufacturing needs can be up to 3,000 characters.",
    };
  }
  try {
    // Call requests must be saved even if this email/domain already requested access.
    await createWaitingListEntry({
      name,
      email,
      company,
      procurementNeeds: [
        "CALL REQUEST",
        `Phone: ${phone || "Not provided"}`,
        `Preferred times / time zone: ${availability || "Arrange by email"}`,
        "",
        needs,
      ].join("\n"),
    });
    return {
      status: "received",
      message:
        "We’ll email you to arrange a time. Your call is not scheduled yet.",
    };
  } catch {
    return {
      status: "error",
      message:
        "We couldn’t save your request. Your details are still here—please try again, or email support@latticeos.co.",
    };
  }
}
