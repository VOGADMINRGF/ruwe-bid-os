#!/bin/bash
set -e

cd ~/Arbeitsmappe/ruwe-bid-os

python3 - <<'PY'
from pathlib import Path

p = Path("lib/parameterMemory.ts")
text = p.read_text()

start = text.find("export async function findParameter(")
if start == -1:
    raise SystemExit("findParameter nicht gefunden")

# bis zum nächsten export oder Dateiende ersetzen
rest = text[start:]
next_export = rest.find("\nexport ", 1)
if next_export == -1:
    end = len(text)
else:
    end = start + next_export + 1

replacement = """
export async function findParameter(
  arg1: any,
  arg2?: any,
  arg3?: any,
  arg4?: any
) {
  const rows = await listParameterMemory();

  let input: {
    region?: string | null;
    trade?: string | null;
    type: string;
    key?: string | null;
  };

  if (typeof arg1 === "object" && arg1 !== null && !Array.isArray(arg1)) {
    input = {
      type: arg1.type,
      region: arg1.region ?? null,
      trade: arg1.trade ?? null,
      key: arg1.key ?? arg1.parameterKey ?? null
    };
  } else {
    input = {
      region: arg1 ?? null,
      trade: arg2 ?? null,
      type: arg3,
      key: arg4 ?? null
    };
  }

  const exact = rows.find((x: any) =>
    x?.type === input.type &&
    (input.region ? x?.region === input.region : true) &&
    (input.trade ? x?.trade === input.trade : true) &&
    (input.key ? (x?.key === input.key || x?.parameterKey === input.key) : true) &&
    x?.status === "defined"
  );
  if (exact) return toPlain(exact);

  const byTradeOnly = rows.find((x: any) =>
    x?.type === input.type &&
    (input.trade ? x?.trade === input.trade : true) &&
    (input.key ? (x?.key === input.key || x?.parameterKey === input.key) : true) &&
    (!x?.region) &&
    x?.status === "defined"
  );
  if (byTradeOnly) return toPlain(byTradeOnly);

  const byRegionOnly = rows.find((x: any) =>
    x?.type === input.type &&
    (input.region ? x?.region === input.region : true) &&
    (input.key ? (x?.key === input.key || x?.parameterKey === input.key) : true) &&
    (!x?.trade) &&
    x?.status === "defined"
  );
  if (byRegionOnly) return toPlain(byRegionOnly);

  const globalDefault = rows.find((x: any) =>
    x?.type === input.type &&
    (input.key ? (x?.key === input.key || x?.parameterKey === input.key) : true) &&
    (!x?.region) &&
    (!x?.trade) &&
    x?.status === "defined"
  );
  if (globalDefault) return toPlain(globalDefault);

  return null;
}
"""

text = text[:start] + replacement + text[end:]
p.write_text(text)
print("findParameter rückwärtskompatibel gemacht.")
PY

npm run build || true
git add lib/parameterMemory.ts
git commit -m "fix: make findParameter backward compatible with legacy signature" || true
git push origin main || true
