export default function BuyerOrderDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="h-5 w-28 rounded-full bg-slate-200" />
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="h-4 w-44 rounded-full bg-slate-200" />
        <div className="mt-4 h-10 w-full max-w-xl rounded-full bg-slate-200" />
        <div className="mt-4 h-5 w-full max-w-2xl rounded-full bg-slate-100" />
      </section>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-64 rounded-[2rem] border border-slate-200 bg-white shadow-sm" />
        <div className="h-64 rounded-[2rem] border border-slate-200 bg-white shadow-sm" />
      </div>
    </div>
  );
}
