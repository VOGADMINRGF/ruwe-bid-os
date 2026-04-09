import { emptyStateFor } from "@/lib/showcase";

export default function EmptyModuleCard({ module }: { module: string }) {
  const state = emptyStateFor(module);

  return (
    <div className="card">
      <div className="section-title">{state.title}</div>
      <p className="meta" style={{ marginTop: 12 }}>{state.text}</p>
    </div>
  );
}
