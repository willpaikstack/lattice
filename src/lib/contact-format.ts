/** Keep phone rendering identical in the editor, stored defaults and read view. */
export function formatPhoneNumber(value: string) {
  const clean = value.trim();
  if (!/^[+\d\s().-]*$/.test(clean)) return clean;
  if (clean === "+" || clean === "+1") return clean;
  const digits = clean.replace(/\D/g, "");
  if (clean.startsWith("+") && !clean.startsWith("+1")) return clean;
  const country = digits.startsWith("1") && (clean.startsWith("+1") || digits.length === 11);
  const local = country ? digits.slice(1) : digits;
  if (local.length > 10) return clean;
  if (!local.length) return "";
  const prefix = country ? "+1 " : "";
  if (local.length <= 3) return `${prefix}(${local}`;
  if (local.length <= 6) return `${prefix}(${local.slice(0, 3)}) ${local.slice(3)}`;
  return `${prefix}(${local.slice(0, 3)}) ${local.slice(3, 6)}-${local.slice(6)}`;
}

export function isValidPhoneNumber(value: string) {
  if (!value.trim()) return true;
  if (!/^[+\d\s().-]+$/.test(value) || (value.match(/\+/g)?.length ?? 0) > 1 || (value.includes("+") && !value.startsWith("+"))) return false;
  const digits = value.replace(/\D/g, "");
  return value.startsWith("+") ? digits.length >= 8 && digits.length <= 15 : digits.length === 10 || (digits.length === 11 && digits.startsWith("1"));
}

export function isValidBillingEmail(value: string) {
  if (value.length > 254) return false;
  const parts = value.split("@");
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  return local.length > 0 && local.length <= 64 && /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~.-]+$/.test(local)
    && !local.startsWith(".") && !local.endsWith(".") && !local.includes("..")
    && domain.includes(".") && domain.split(".").every((label) => label.length <= 63 && /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/.test(label));
}
