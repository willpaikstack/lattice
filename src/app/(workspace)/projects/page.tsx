import Link from "next/link";

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Admin</p>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight text-slate-950">Project Management</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
          Bubble currently exposes this route as a shell-only page. Locally, it should become the project-level view that groups RFQs, quotes, orders, suppliers, and documents.
        </p>
      </section>

      <section className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-950">Project workspaces are pending.</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          For the first local slice, RFQ intake and operator review are the source of truth. Project rollups can be added once multiple requests need to be grouped under the same buyer program.
        </p>
        <Link className="mt-6 inline-flex rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700" href="/requests/new">
          Create RFQ
        </Link>
      </section>
    </div>
  );
}
