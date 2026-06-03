import type { CustomerProfileIcon as CustomerProfileIconData } from "@/lib/customer-profiles";

export function CustomerProfileIcon({
  icon,
  size = "md",
}: {
  icon: CustomerProfileIconData;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass = {
    sm: "h-9 w-9 text-[13px]",
    md: "h-11 w-11 text-[15px]",
    lg: "h-14 w-14 text-[18px]",
  }[size];

  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-md border border-black/5 font-semibold shadow-sm ${sizeClass}`}
      style={{ backgroundColor: icon.background, color: icon.foreground }}
    >
      {icon.label}
    </span>
  );
}
