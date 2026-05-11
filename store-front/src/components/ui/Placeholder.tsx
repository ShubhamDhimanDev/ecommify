export function Placeholder({ title }: { title: string }) {
  return (
    <div className="mx-auto mt-10 max-w-3xl rounded-xl border border-zinc-200 bg-white p-8 text-center">
      <h1 className="text-xl font-semibold text-zinc-900">{title}</h1>
      <p className="mt-2 text-sm text-zinc-500">Coming in Phase 2</p>
    </div>
  );
}
