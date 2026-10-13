export function RequestFormHeading() {
  return (
    <div>
      <h1 className="text-[34px] font-semibold leading-tight tracking-tight text-[#171717] sm:text-[40px]">
        Request a quote
      </h1>
      <p className="mt-2 max-w-3xl text-[15px] leading-6 text-[#656b74]">
        Upload your CAD files to start a saved RFQ draft. Configure the part details and submit when the package is ready.
      </p>
    </div>
  );
}

export function RequestFormLoading() {
  return (
    <div aria-busy="true" className="space-y-6">
      <header className="px-1 pt-1">
        <RequestFormHeading />
      </header>
      <p className="sr-only" role="status">Loading quote form…</p>
      <div aria-hidden="true" className="space-y-6">
        <div className="grid grid-cols-3 gap-4 px-1">
          {[0, 1, 2].map((step) => <div className="workspace-skeleton h-3 max-w-40 rounded bg-[#eeeeee]" key={step} />)}
        </div>
        <div className="space-y-6 rounded-md border border-[#e1e3e6] bg-white p-4 sm:p-5">
          <div className="workspace-skeleton flex min-h-60 items-center justify-center rounded-md bg-[#f3f3f3]">
            <div className="space-y-3">
              <div className="mx-auto h-10 w-10 rounded-lg bg-[#e5e5e5]" />
              <div className="h-4 w-48 rounded bg-[#e5e5e5]" />
              <div className="mx-auto h-3 w-32 rounded bg-[#e5e5e5]" />
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {["Part details", "Material", "Quantity"].map((field) => (
              <div className="space-y-3" key={field}>
                <div className="workspace-skeleton h-3 w-24 rounded bg-[#eeeeee]" />
                <div className="workspace-skeleton h-11 rounded-md bg-[#eeeeee]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
