import { readStore, replaceCollection } from "@/lib/storage";
import { toPlain } from "@/lib/serializers";

function nextId(prefix = "audit") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function appendAuditLog(input: {
  actor?: string;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  details?: Record<string, any>;
}) {
  const db = await readStore();
  const rows = Array.isArray(db.auditLogs) ? db.auditLogs : [];
  const entry = {
    id: nextId(),
    at: new Date().toISOString(),
    actor: input.actor || "system",
    action: input.action,
    entityType: input.entityType || null,
    entityId: input.entityId || null,
    details: input.details || {}
  };
  await replaceCollection("auditLogs", [entry, ...rows].slice(0, 2000));
  return toPlain(entry);
}

export async function listAuditLogs(limit = 200) {
  const db = await readStore();
  const rows = Array.isArray(db.auditLogs) ? db.auditLogs : [];
  return toPlain(rows.slice(0, Math.max(1, Math.min(2000, limit))));
}

