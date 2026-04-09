import { readStore } from "@/lib/storage";
import SiteRuleEditor from "@/components/forms/SiteRuleEditor";

export default async function SiteRulesPage() {
  const db = await readStore();
  const rules = db.siteTradeRules || [];
  const sites = db.sites || [];

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Site Rules</h1>
        <p className="sub">Mongo-first bearbeitbare Regeln je Standort und Gewerk.</p>
      </div>

      <div className="grid grid-2">
        {rules.map((rule: any) => {
          const site = sites.find((s: any) => s.id === rule.siteId);
          return (
            <div className="card" key={rule.id}>
              <div className="section-title">{site?.name || "-"} · {rule.trade}</div>
              <SiteRuleEditor rule={rule} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
