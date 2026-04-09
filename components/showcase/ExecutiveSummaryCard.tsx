import { executiveAssessment } from "@/lib/showcase";

export default function ExecutiveSummaryCard({ db }: { db: any }) {
  const result = executiveAssessment(db);
  const cls =
    result.tone === "gut"
      ? "badge badge-gut"
      : result.tone === "gemischt"
        ? "badge badge-gemischt"
        : "badge badge-kritisch";

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <div className="section-title">Executive Summary</div>
        <span className={cls}>{result.title}</span>
      </div>
      <p className="meta" style={{ marginTop: 12 }}>{result.text}</p>
    </div>
  );
}
