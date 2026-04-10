#!/bin/bash
set -e

cd ~/Arbeitsmappe/ruwe-bid-os

python3 - <<'PY'
from pathlib import Path

p = Path("app/page.tsx")
text = p.read_text()

old = '<td><Link className="linkish" href={row.href}>{row.region}</Link></td>'
new = '<td><Link className="linkish" href={typeof row?.href === "string" && row.href ? row.href : `/source-hits?trade=${encodeURIComponent(row?.trade || "")}&region=${encodeURIComponent(row?.region || "")}`}>{row.region}</Link></td>'

if old in text:
    text = text.replace(old, new)
else:
    print("⚠️ exakte Stelle nicht gefunden, versuche robusten Ersatz...")
    text = text.replace(
        'href={row.href}',
        'href={typeof row?.href === "string" && row.href ? row.href : `/source-hits?trade=${encodeURIComponent(row?.trade || "")}&region=${encodeURIComponent(row?.region || "")}`}',
        1
    )

p.write_text(text)
print("✅ app/page.tsx regionTrade link gefixt")
PY

npm run build || true
git add app/page.tsx
git commit -m "fix: harden regionTradeRows first link fallback on dashboard" || true
git push origin main || true
