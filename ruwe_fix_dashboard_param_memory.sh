#!/bin/bash
set -e

cd ~/Arbeitsmappe/ruwe-bid-os

echo "🔧 Fix dashboardWorkbench duplicate toPlain + parameterMemory findParameter"

python3 - <<'PY'
from pathlib import Path

p = Path("lib/dashboardWorkbench.ts")
text = p.read_text()

# lokale toPlain-Funktion entfernen, wenn Import schon existiert
needle = """function toPlain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

"""
if needle in text:
    text = text.replace(needle, "")

# absichern: Import korrekt setzen
if 'import { safeHref, toPlain } from "@/lib/serializers";' not in text:
    if 'import { readStore } from "@/lib/storage";' in text:
        text = text.replace(
            'import { readStore } from "@/lib/storage";',
            'import { readStore } from "@/lib/storage";\nimport { safeHref, toPlain } from "@/lib/serializers";'
        )

p.write_text(text)
print("✅ lib/dashboardWorkbench.ts bereinigt")
PY

python3 - <<'PY'
from pathlib import Path

p = Path("lib/parameterMemory.ts")
text = p.read_text()

if "export async function findParameter(" not in text:
    append = """

export async function findParameter(input: {
  type: string;
  region?: string | null;
  trade?: string | null;
}) {
  const rows = await listParameterMemory();

  const exact = rows.find((x: any) =>
    x?.type === input.type &&
    (input.region ? x?.region === input.region : true) &&
    (input.trade ? x?.trade === input.trade : true) &&
    x?.status === "defined"
  );
  if (exact) return toPlain(exact);

  const byTradeOnly = rows.find((x: any) =>
    x?.type === input.type &&
    (input.trade ? x?.trade === input.trade : true) &&
    (!x?.region) &&
    x?.status === "defined"
  );
  if (byTradeOnly) return toPlain(byTradeOnly);

  const byRegionOnly = rows.find((x: any) =>
    x?.type === input.type &&
    (input.region ? x?.region === input.region : true) &&
    (!x?.trade) &&
    x?.status === "defined"
  );
  if (byRegionOnly) return toPlain(byRegionOnly);

  const globalDefault = rows.find((x: any) =>
    x?.type === input.type &&
    (!x?.region) &&
    (!x?.trade) &&
    x?.status === "defined"
  );
  if (globalDefault) return toPlain(globalDefault);

  return null;
}
"""
    text += append

p.write_text(text)
print("✅ lib/parameterMemory.ts erweitert")
PY

npm run build || true
git add lib/dashboardWorkbench.ts lib/parameterMemory.ts
git commit -m "fix: remove duplicate toPlain and add findParameter export" || true
git push origin main || true

echo "✅ Fix eingespielt"
