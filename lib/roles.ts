import { readStore, replaceCollection } from "@/lib/storage";
import { toPlain } from "@/lib/serializers";

const DEFAULT_ROLES = [
  { id: "admin", name: "Admin", permissions: ["*"] },
  { id: "coord", name: "Koordinator", permissions: ["source.read", "opportunity.write", "missing_variable.write", "override.write"] },
  { id: "assist", name: "Assistenz", permissions: ["source.read", "missing_variable.write", "opportunity.note"] },
  { id: "viewer", name: "Management Viewer", permissions: ["dashboard.read", "reporting.read"] }
];

export async function ensureRolesModel() {
  const db = await readStore();
  const cfg = db.config || {};
  if (Array.isArray(cfg.roles) && cfg.roles.length) return toPlain(cfg.roles);

  await replaceCollection("config", {
    ...cfg,
    roles: DEFAULT_ROLES,
    roleModelVersion: 1,
    updatedAt: new Date().toISOString()
  });
  return toPlain(DEFAULT_ROLES);
}

export async function listRoles() {
  const db = await readStore();
  const cfg = db.config || {};
  if (!Array.isArray(cfg.roles) || !cfg.roles.length) return ensureRolesModel();
  return toPlain(cfg.roles);
}

