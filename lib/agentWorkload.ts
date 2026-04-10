import { readStore, replaceCollection } from "@/lib/storage";

const DEFAULT_AGENTS = [
  { id: "coord_berlin", name: "Koordinator Berlin", role: "koordinator", regionFocus: "Berlin", active: true },
  { id: "coord_ost", name: "Koordinator Ost", role: "koordinator", regionFocus: "Brandenburg", active: true },
  { id: "coord_sachsen", name: "Koordinator Sachsen", role: "koordinator", regionFocus: "Sachsen", active: true },
  { id: "coord_security", name: "Koordinator Sicherheit", role: "koordinator", regionFocus: "Magdeburg", active: true },
  { id: "assist_a", name: "Assistenz A", role: "assistenz", regionFocus: "Berlin", active: true },
  { id: "assist_b", name: "Assistenz B", role: "assistenz", regionFocus: "Leipzig", active: true }
];

export async function ensureAgents() {
  const db = await readStore();
  const rows = Array.isArray(db.agents) ? db.agents : [];
  if (rows.length) return rows;
  await replaceCollection("agents", DEFAULT_AGENTS as any);
  return DEFAULT_AGENTS;
}

export async function computeAgentWorkload() {
  await ensureAgents();
  const db = await readStore();
  const agents = Array.isArray(db.agents) ? db.agents : [];
  const opportunities = Array.isArray(db.opportunities) ? db.opportunities : [];

  return agents.map((agent: any) => {
    const rows = opportunities.filter((x: any) => x.ownerId === agent.id);
    const open = rows.filter((x: any) => ["open", "active"].includes(x.status));
    const overdue = rows.filter((x: any) => {
      if (!x.dueDate) return false;
      return new Date(x.dueDate).getTime() < Date.now();
    });
    const highPriority = rows.filter((x: any) => x.priority === "A");
    return {
      ...agent,
      assigned: rows.length,
      open: open.length,
      overdue: overdue.length,
      highPriority: highPriority.length
    };
  });
}
