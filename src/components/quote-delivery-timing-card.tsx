"use client";

import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import { estimatedDeliveryOn, localDateKey, timingDateLabel } from "@/lib/quote-delivery-timing";

export function QuoteDeliveryTimingCard({ productionDays, shippingDays, initialViewingDate }: { productionDays: number | null; shippingDays: number | null; initialViewingDate: string }) {
  const [viewingDate, setViewingDate] = useState(initialViewingDate);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    function refreshDate() {
      const now = new Date();
      setViewingDate(localDateKey(now));
      clearTimeout(timer);
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      timer = setTimeout(refreshDate, Math.max(1000, midnight.getTime() - now.getTime() + 100));
    }
    function refreshWhenVisible() { if (document.visibilityState === "visible") refreshDate(); }
    refreshDate();
    window.addEventListener("focus", refreshDate);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => { clearTimeout(timer); window.removeEventListener("focus", refreshDate); document.removeEventListener("visibilitychange", refreshWhenVisible); };
  }, []);

  const deliveryDate = estimatedDeliveryOn(viewingDate, productionDays, shippingDays);
  return <section aria-label="Quote delivery timing" className="rounded-md border border-[#e7e7e7] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
    <div className="border-b border-[#eeeeee] px-6 py-5">
      <h2 className="text-[16px] font-semibold text-[#202020]">Delivery timeline</h2>
    </div>
    <div className="px-6 py-6">
      <div aria-live="polite" className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eef3ff] text-[#44546b]"><CalendarDays aria-hidden="true" className="h-5 w-5" strokeWidth={1.6} /></span>
        <div className="min-w-0">
          <p className="text-[12px] text-[#5f6670]">Estimated delivery by</p>
          <p className="mt-1 text-[24px] font-semibold leading-tight tracking-tight text-[#171f2c]">{deliveryDate ? timingDateLabel(deliveryDate) : "Pending"}</p>
        </div>
      </div>
      <ol className="mt-6 text-[13px]">
        <li className="relative ml-2 border-l border-dashed border-[#aab5c7] pb-6 pl-6">
          <span aria-hidden="true" className="absolute -left-[7px] top-1 h-[13px] w-[13px] rounded-full border-2 border-[#3478f6] bg-white" />
          <p className="font-semibold text-[#202938]">Production — {productionDays === null ? "Pending" : `${productionDays} business days`}</p>
        </li>
        <li className="relative ml-2 pl-6">
          <span aria-hidden="true" className="absolute -left-[6px] top-1 h-[13px] w-[13px] rounded-full border-2 border-[#3478f6] bg-white" />
          <p className="font-semibold text-[#202938]">Shipping — {shippingDays === null ? "Pending" : `${shippingDays} business days`}</p>
        </li>
      </ol>
      <p className="mt-6 border-t border-[#e5e9ee] pt-4 text-[14px] text-[#4f5c70]">Total: <strong className="font-semibold text-[#202938]">{deliveryDate ? `${productionDays! + shippingDays!} business days` : "Pending"}</strong></p>
      {!deliveryDate ? <p className="mt-4 text-[11px] leading-5 text-[#7b8799]">{productionDays === null ? "Production lead time is needed for every part." : "Shipping duration has not been specified."}</p> : null}
    </div>
  </section>;
}
