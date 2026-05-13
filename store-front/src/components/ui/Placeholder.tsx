export function Placeholder({ title }: { title: string }) {
  return (
    <div className="mx-auto mt-10 max-w-3xl rounded-xl border border-outline-variant bg-surface p-8 text-center">
      <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      <p className="mt-2 text-sm text-secondary">Coming in Phase 2</p>
    </div>
  );
}
