import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  Box,
  CheckCircle2,
  FileText,
  ReceiptText,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { customerNotifications } from "@/lib/customer-notifications";
import { currentUser } from "@/lib/current-user";

const metrics = [
  {
    label: "Active RFQs",
    value: "34",
    detail: "43 unread quotes",
    icon: FileText,
    href: "/quotes",
  },
  {
    label: "Orders",
    value: "1,253",
    detail: "10 status changes",
    icon: ReceiptText,
    href: "/orders",
  },
  {
    label: "Shipped",
    value: "+912",
    detail: "4 in the past 3 days",
    icon: Box,
    href: "/shipped",
  },
  {
    label: "Alerts",
    value: "4",
    detail: "2 unread",
    icon: AlertTriangle,
    href: "/notifications",
    tone: "alert",
  },
];

const transactions = [
  {
    name: "Frank Bennett",
    email: "frank.bennett@gmail.com",
    amount: "$641.00",
    status: "Completed",
  },
  {
    name: "Jennifer Li",
    email: "jennifer.li@gmail.com",
    amount: "$370.00",
    status: "Completed",
  },
  {
    name: "Amir Sharma",
    email: "amir.sharma@gmail.com",
    amount: "$1,200.00",
    status: "Completed",
  },
  {
    name: "Simon Abiola",
    email: "simon.abiola@gmail.com",
    amount: "$400.00",
    status: "Completed",
  },
  {
    name: "Linda Williams",
    email: "linda.williams@gmail.com",
    amount: "$800.00",
    status: "Completed",
  },
];

const orders = [
  { name: "William", email: "william.paik@amogy.co", time: "3:32 pm" },
  { name: "Simon Abiola", email: "simon.abiola@gmail.com", time: "6:03 pm" },
  { name: "Gregory John", email: "gregory.john@gmail.com", time: "6:03 pm" },
  { name: "Jennifer Li", email: "jennifer.li@gmail.com", time: "6:02 pm" },
  {
    name: "Linda Williams",
    email: "linda.williams@gmail.com",
    time: "6:02 pm",
  },
];

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-xs font-semibold text-stone-600">
      {initials}
    </div>
  );
}

function MetricCard({
  detail,
  href,
  icon: Icon,
  label,
  tone,
  value,
}: {
  detail: string;
  href: string;
  icon: LucideIcon;
  label: string;
  tone?: string;
  value: string;
}) {
  const isAlert = tone === "alert";

  return (
    <Link
      aria-label={`View ${label}`}
      className={`group block rounded-2xl border p-5 transition hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950 ${
        isAlert
          ? "border-amber-200 bg-amber-50/80"
          : "border-stone-200 bg-white"
      }`}
      href={href}
    >
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-medium text-stone-700">{label}</p>
        <Icon
          aria-hidden="true"
          className={
            isAlert ? "h-4 w-4 text-amber-700" : "h-4 w-4 text-stone-500"
          }
          strokeWidth={1.8}
        />
      </div>
      <p className="mt-4 text-3xl font-semibold leading-none tracking-tight text-stone-950">
        {value}
      </p>
      <p
        className={
          isAlert
            ? "mt-2 text-sm text-amber-800"
            : "mt-2 text-sm text-stone-500"
        }
      >
        {detail}
      </p>
    </Link>
  );
}

function SectionHeader({
  action,
  detail,
  title,
}: {
  action?: React.ReactNode;
  detail: string;
  title: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h2 className="text-xl font-semibold tracking-tight text-stone-950">
          {title}
        </h2>
        <p className="mt-1 text-sm leading-5 text-stone-500">{detail}</p>
      </div>
      {action}
    </div>
  );
}

export default function Home() {
  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
            Home
          </p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-tight text-stone-950">
            Hi {currentUser.name}
          </h1>
        </div>
        <Link
          className="inline-flex h-11 w-fit items-center gap-2 rounded-xl bg-stone-950 px-4 text-sm font-semibold text-white transition hover:bg-stone-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
          href="/requests/new"
        >
          Request Quote
          <ArrowUpRight
            aria-hidden="true"
            className="h-4 w-4"
            strokeWidth={2}
          />
        </Link>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,0.92fr)]">
        <div className="space-y-6">
          <article className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm shadow-stone-200/30">
            <SectionHeader
              detail="Customer updates across RFQs, orders, and quality documentation"
              title="Inbox"
            />

            <div className="mt-5 divide-y divide-stone-100">
              {customerNotifications.map((notification) => (
                <Link
                  className="grid gap-3 rounded-xl py-4 transition hover:bg-stone-50 sm:grid-cols-[auto_1fr_auto] sm:items-start sm:px-3"
                  href={notification.href}
                  key={notification.title}
                >
                  <span
                    aria-label={
                      notification.unread
                        ? "Unread notification"
                        : "Read notification"
                    }
                    className={
                      notification.unread
                        ? "mt-1.5 h-2 w-2 rounded-full bg-stone-950"
                        : "mt-1.5 h-2 w-2 rounded-full bg-stone-300"
                    }
                  />
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-500">
                        {notification.meta}
                      </span>
                      <span className="text-xs text-stone-400">
                        {notification.time}
                      </span>
                    </span>
                    <span className="mt-1 block text-sm font-semibold text-stone-950">
                      {notification.title}
                    </span>
                    <span className="mt-1 block text-sm leading-5 text-stone-600">
                      {notification.detail}
                    </span>
                  </span>
                  <ArrowUpRight
                    aria-hidden="true"
                    className="hidden h-4 w-4 text-stone-300 sm:block"
                    strokeWidth={1.8}
                  />
                </Link>
              ))}
            </div>
          </article>

          <article className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm shadow-stone-200/30">
            <div className="border-b border-stone-200 px-6 py-5">
              <SectionHeader
                action={
                  <Link
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-stone-950 px-4 text-sm font-semibold text-white transition hover:bg-stone-800"
                    href="/quotes"
                  >
                    View All
                    <ArrowUpRight
                      aria-hidden="true"
                      className="h-4 w-4"
                      strokeWidth={2}
                    />
                  </Link>
                }
                detail="Here are your latest quotes with status changes"
                title="Transactions"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead className="bg-stone-50 text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
                  <tr>
                    <th className="px-6 py-3">User</th>
                    <th className="px-6 py-3">Amount</th>
                    <th className="px-6 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 bg-white">
                  {transactions.map((item) => (
                    <tr
                      className="transition hover:bg-stone-50"
                      key={item.email}
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-stone-950">
                          {item.name}
                        </p>
                        <p className="mt-1 text-xs text-stone-500">
                          {item.email}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-stone-950">
                        {item.amount}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                          <CheckCircle2
                            aria-hidden="true"
                            className="h-3.5 w-3.5"
                            strokeWidth={2}
                          />
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </div>

        <aside className="xl:sticky xl:top-8 xl:self-start">
          <article className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm shadow-stone-200/30">
            <SectionHeader
              detail="Recent order and quote contacts"
              title="Orders"
            />

            <div className="mt-6 divide-y divide-stone-100">
              {orders.map((item) => (
                <div
                  className="grid grid-cols-[1fr_auto] items-center gap-5 py-3.5"
                  key={`${item.email}-${item.time}`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={item.name} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-stone-950">
                        {item.name}
                      </p>
                      <p className="mt-1 truncate text-xs text-stone-500">
                        {item.email}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-stone-500">
                    {item.time}
                  </p>
                </div>
              ))}
            </div>
          </article>
        </aside>
      </section>
    </div>
  );
}
