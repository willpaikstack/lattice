import Link from "next/link";

const metrics = [
  { label: "Active RFQs", value: "34", detail: "43 unread quotes", icon: "document" },
  { label: "Orders", value: "1,253", detail: "10 status changes", icon: "receipt" },
  { label: "Shipped", value: "+912", detail: "4 in the past 3 days", icon: "box" },
  { label: "Alerts", value: "4", detail: "2 unread", icon: "alert", tone: "alert" },
];

const transactions = [
  { name: "Frank Bennett", email: "frank.bennett@gmail.com", amount: "$641.00" },
  { name: "Jennifer Li", email: "jennifer.li@gmail.com", amount: "$370.00" },
  { name: "Amir Sharma", email: "amir.sharma@gmail.com", amount: "$1,200.00" },
  { name: "Simon Abiola", email: "simon.abiola@gmail.com", amount: "$400.00" },
  { name: "Linda Williams", email: "linda.williams@gmail.com", amount: "$800.00" },
  { name: "Jasmine Jones", email: "jasmine.jones@gmail.com", amount: "$50.00" },
];

const orders = [
  { name: "William", email: "william.paik@amogy.co", time: "3:32 pm" },
  { name: "Simon Abiola", email: "simon.abiola@gmail.com", time: "6:03 pm" },
  { name: "Gregory John", email: "gregory.john@gmail.com", time: "6:03 pm" },
  { name: "Jennifer Li", email: "jennifer.li@gmail.com", time: "6:02 pm" },
  { name: "Linda Williams", email: "linda.williams@gmail.com", time: "6:02 pm" },
  { name: "Frank Bennett", email: "frank.bennett@gmail.com", time: "6:02 pm" },
  { name: "Amir Sharma", email: "amir.sharma@gmail.com", time: "6:01 pm" },
  { name: "Jasmine Jones", email: "jasmine.jones@gmail.com", time: "6:01 pm" },
];

function MetricIcon({ name }: { name: string }) {
  const common = {
    className: "h-5 w-5 stroke-[1.8] text-[#1f2937]",
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    viewBox: "0 0 24 24",
  };

  if (name === "box") {
    return (
      <svg aria-hidden="true" {...common}>
        <path d="m3.5 7.5 8.5-4.7 8.5 4.7v9L12 21.2 3.5 16.5Z" />
        <path d="M3.5 7.5 12 12.2l8.5-4.7" />
        <path d="M12 12.2v9" />
      </svg>
    );
  }

  if (name === "alert") {
    return (
      <svg aria-hidden="true" {...common}>
        <path d="M12 4.5 21 20H3Z" />
        <path d="M12 9v4.5" />
        <path d="M12 17h.01" />
      </svg>
    );
  }

  if (name === "receipt") {
    return (
      <svg aria-hidden="true" {...common}>
        <path d="M6 3.8h12v16.4l-2-1.2-2 1.2-2-1.2-2 1.2-2-1.2-2 1.2Z" />
        <path d="M9 8h6" />
        <path d="M9 12h6" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" {...common}>
      <path d="M7 3.8h7l3 3V20H7Z" />
      <path d="M14 3.8V7h3" />
      <path d="M9.5 11h5" />
      <path d="M9.5 15h5" />
    </svg>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-200 to-slate-100 text-xs font-semibold text-slate-600">
      {initials}
    </div>
  );
}

export default function Home() {
  return (
    <div className="mx-auto max-w-[960px] space-y-5">
      <h1 className="text-[32px] font-semibold leading-tight tracking-[-0.03em] text-[#171717]">Hi</h1>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const isAlert = metric.tone === "alert";

          return (
            <article
              className={isAlert ? "rounded-[18px] border border-[#f4b8ad] bg-[#f0b1a7] p-4" : "rounded-[18px] border border-[#e8e8e8] bg-white p-4"}
              key={metric.label}
            >
              <div className="flex items-start justify-between gap-4">
                <p className="text-[15px] font-medium text-[#272727]">{metric.label}</p>
                <button aria-label={`${metric.label} details`} className="flex h-5 w-5 items-center justify-center" type="button">
                  <MetricIcon name={metric.icon} />
                </button>
              </div>
              <div className={isAlert ? "mt-4 rounded-[14px] bg-white px-4 py-3" : "mt-3"}>
                <p className="text-[30px] font-semibold leading-none tracking-[-0.04em] text-[#202020]">{metric.value}</p>
                <p className="mt-2 text-[13px] text-[#676767]">{metric.detail}</p>
              </div>
            </article>
          );
        })}
      </section>

      <section className="min-h-[285px] rounded-[18px] border border-[#e6e6e6] bg-white p-6">
        <div className="flex items-start justify-between">
          <h2 className="text-[20px] font-semibold tracking-[-0.03em] text-[#202020]">Inbox</h2>
          <button aria-label="Star inbox" className="flex h-[30px] w-[30px] items-center justify-center rounded-md hover:bg-slate-50" type="button">
            <svg aria-hidden="true" className="h-5 w-5 text-[#1f2937]" fill="none" viewBox="0 0 24 24">
              <path d="m12 3.8 2.5 5.1 5.6.8-4 3.9.9 5.5-5-2.6-5 2.6.9-5.5-4-3.9 5.6-.8Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" />
            </svg>
          </button>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.03fr_0.97fr]">
        <article className="rounded-[18px] border border-[#e6e6e6] bg-white p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[22px] font-semibold tracking-[-0.04em] text-[#202020]">Transactions</h2>
              <p className="mt-1 text-[14px] text-[#a2a2a2]">Here are your latest quotes with status changes</p>
            </div>
            <Link className="inline-flex h-10 items-center gap-2 rounded-[11px] bg-[#171717] px-4 text-sm font-semibold" href="/quotes" style={{ color: "#ffffff" }}>
              View All
              <span aria-hidden="true">↗</span>
            </Link>
          </div>

          <div className="mt-7">
            <div className="grid grid-cols-[1fr_auto] border-b border-[#eeeeee] pb-3 text-[14px] font-medium text-[#4b4b4b]">
              <span>User</span>
              <span>Amount</span>
            </div>
            <div className="divide-y divide-[#eeeeee]">
              {transactions.map((item) => (
                <div className="grid grid-cols-[1fr_auto] items-center gap-6 py-3.5" key={item.email}>
                  <div>
                    <p className="text-[14px] font-medium text-[#222222]">{item.name}</p>
                    <p className="mt-1 text-[12px] text-[#b8b8b8]">{item.email}</p>
                  </div>
                  <p className="text-[14px] font-medium text-[#222222]">{item.amount}</p>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="rounded-[18px] border border-[#e6e6e6] bg-white p-6">
          <div>
            <h2 className="text-[22px] font-semibold tracking-[-0.04em] text-[#202020]">Orders</h2>
            <p className="mt-1 text-[14px] text-[#a2a2a2]">Here are the latest signed up users</p>
          </div>

          <div className="mt-7">
            <div className="grid grid-cols-[1fr_auto] border-b border-[#eeeeee] pb-3 text-[14px] font-medium text-[#4b4b4b]">
              <span>User</span>
              <span>Time</span>
            </div>
            <div className="divide-y divide-[#eeeeee]">
              {orders.map((item) => (
                <div className="grid grid-cols-[1fr_auto] items-center gap-5 py-3" key={`${item.email}-${item.time}`}>
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={item.name} />
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-medium text-[#222222]">{item.name}</p>
                      <p className="mt-1 truncate text-[12px] text-[#b8b8b8]">{item.email}</p>
                    </div>
                  </div>
                  <p className="text-[14px] font-medium text-[#222222]">{item.time}</p>
                </div>
              ))}
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
