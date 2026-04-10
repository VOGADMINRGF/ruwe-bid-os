import Link from "next/link";
import { sanitizeInternalHref } from "@/lib/dashboardRoutes";

export type WorkbenchAttentionItem = {
  label: string;
  value: string;
  href?: string;
};

export type WorkbenchPriorityItem = {
  title: string;
  detail: string;
  href?: string;
  tone?: "default" | "warning";
};

export default function WorkbenchSidebarRight({
  highlights,
  attention,
  priorities
}: {
  highlights: WorkbenchAttentionItem[];
  attention: WorkbenchAttentionItem[];
  priorities: WorkbenchPriorityItem[];
}) {
  return (
    <aside className="wb-sidebar wb-sidebar-right">
      <div className="card wb-panel">
        <div className="section-title">Highlights</div>
        <div className="stack wb-highlight-stack">
          {(highlights.length > 0 ? highlights : [{ label: "Highlights", value: "Keine Highlights im aktuellen Filter", href: "/source-hits" }]).map((item, i) => (
            <Link
              key={`${item.label}_${i}`}
              href={sanitizeInternalHref(item.href, "/source-hits")}
              className="wb-highlight-link"
            >
              <div className="label">{item.label}</div>
              <div>{item.value}</div>
            </Link>
          ))}
        </div>
      </div>

      <div className="card wb-panel">
        <div className="section-title">Handlungsdruck</div>
        <div className="stack wb-highlight-stack">
          {(attention.length > 0 ? attention : [{ label: "Handlungsdruck", value: "Aktuell keine offenen Punkte", href: "/" }]).map((item, i) => (
            <Link
              key={`${item.label}_${i}`}
              href={sanitizeInternalHref(item.href, "/")}
              className="wb-highlight-link"
            >
              <div className="label">{item.label}</div>
              <div>{item.value}</div>
            </Link>
          ))}
        </div>
      </div>

      <div className="card wb-panel">
        <div className="section-title">Prioritäten</div>
        <div className="stack wb-priority-list">
          {(priorities.length > 0 ? priorities : [{ title: "Prioritäten", detail: "Keine Prioritäten gesetzt", href: "/source-hits" }]).map((item, i) => (
            <Link
              key={`${item.title}_${i}`}
              href={sanitizeInternalHref(item.href, "/source-hits")}
              className={`wb-priority-item${item.tone === "warning" ? " is-warning" : ""}`}
            >
              <div className="label">{item.title}</div>
              <div>{item.detail}</div>
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
