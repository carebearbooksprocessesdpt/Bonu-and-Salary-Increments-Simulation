export default function SettingsPage() {
  return (
    <div className="min-h-screen p-5 lg:p-8">
      <section className="rounded-xl border border-line bg-white p-6 shadow-sm">
        <div className="mb-1 flex items-center gap-2">
          <span className="rounded bg-accent/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-accent">Settings</span>
          <span className="text-xs text-slate-500">Financial Ops</span>
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-ink">Settings</h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
          Configuration controls can live here as the simulation workflow grows. Current incentive rules and scenario controls remain on their dedicated pages.
        </p>
      </section>
    </div>
  );
}
