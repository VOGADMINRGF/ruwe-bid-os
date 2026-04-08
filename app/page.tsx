"use client";
import useSWR from "swr";
import axios from "axios";

const fetcher = (url: string) => axios.get(url).then(res => res.data);

export default function Dashboard() {
  const { data: tenders = [] } = useSWR("/api/tenders", fetcher);
  const { data: pipeline = [] } = useSWR("/api/pipeline", fetcher);

  const pending = tenders.filter((t: any) => t.status === "neu").length;
  const manual = tenders.filter((t: any) => t.manualReview).length;
  const go = tenders.filter((t: any) => t.status === "go").length;
  const overdue = 0;

  const weighted = pipeline.reduce((sum: number, p: any) => sum + p.value, 0);
  const status = overdue > 0 ? "KRITISCH" : manual > 0 ? "PRÜFEN" : "GUT";

  const Card = ({ title, value, color = "text-black" }: any) => (
    <div className="bg-white rounded-xl shadow p-6 border-l-4 border-orange-500">
      <div className="text-sm text-gray-500">{title}</div>
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
    </div>
  );

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Vertriebssteuerung neu denken.</h1>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <Card title="Neu eingegangen" value={pending} />
        <Card title="Manuell prüfen" value={manual} />
        <Card title="Go-Kandidaten" value={go} />
        <Card title="Überfällig" value={overdue} color="text-red-500" />
        <Card title="Gesamtlage" value={status} color={status === "GUT" ? "text-green-600" : "text-orange-500"} />
      </div>
      <div className="bg-white rounded-xl shadow p-6 border-l-4 border-orange-500">
        <div className="text-sm text-gray-500">Weighted Pipeline</div>
        <div className="text-3xl font-bold text-orange-500">{Math.round(weighted / 1000)}k €</div>
      </div>
    </div>
  );
}
