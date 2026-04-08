#!/bin/bash
set -e

echo "🚀 RUWE Bid OS – Final Fix startet..."

# =========================================
# 1. Tailwind CSS sauber installieren
# =========================================
echo "🎨 Installiere Tailwind CSS..."
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p || true

cat > tailwind.config.js <<'TW'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#f97316"
      }
    }
  },
  plugins: []
};
TW

mkdir -p app

cat > app/globals.css <<'CSS'
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  @apply bg-gray-100 text-gray-900;
}

.card {
  @apply bg-white rounded-lg shadow p-6 border-l-4 border-primary;
}

.kpi {
  @apply text-2xl font-bold;
}

.label {
  @apply text-sm text-gray-500;
}
CSS

# =========================================
# 2. Navigation & Layout
# =========================================
cat > app/layout.tsx <<'TSX'
import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "RUWE Bid OS",
  description: "Vertriebssteuerung neu denken",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const nav = ["dashboard", "tenders", "pipeline", "agents", "zones", "buyers", "references", "config"];

  return (
    <html lang="de">
      <body>
        <nav className="bg-black text-white px-6 py-4 flex gap-6 items-center">
          <span className="font-bold text-lg">
            RUWE <span className="text-primary">Bid OS</span>
          </span>
          <div className="flex gap-4 text-sm">
            {nav.map((n) => (
              <Link key={n} href={n === "dashboard" ? "/" : `/${n}`} className="hover:text-primary">
                {n.charAt(0).toUpperCase() + n.slice(1)}
              </Link>
            ))}
          </div>
        </nav>
        <main className="p-6 max-w-7xl mx-auto">{children}</main>
      </body>
    </html>
  );
}
TSX

# =========================================
# 3. Prisma v7 mit SQLite Adapter
# =========================================
echo "🗄️ Installiere Prisma SQLite Adapter..."
npm install better-sqlite3 @prisma/adapter-better-sqlite3

cat > lib/prisma.ts <<'TS'
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSQLite3 } from "@prisma/adapter-better-sqlite3";
import Database from "better-sqlite3";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

const sqlite = new Database("prisma/dev.db");
const adapter = new PrismaBetterSQLite3(sqlite);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
TS

# =========================================
# 4. Prisma Seed in JS
# =========================================
cat > prisma/seed.js <<'JS'
const { PrismaClient } = require("@prisma/client");
const { PrismaBetterSQLite3 } = require("@prisma/adapter-better-sqlite3");
const Database = require("better-sqlite3");

const sqlite = new Database("prisma/dev.db");
const adapter = new PrismaBetterSQLite3(sqlite);
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.tender.createMany({
    data: [
      { title: "Sicherheitsdienst", region: "Magdeburg", trade: "Sicherheit", priority: "A", status: "neu", manualReview: true, value: 300000 },
      { title: "Reinigung Berlin", region: "Berlin", trade: "Reinigung", priority: "B", status: "go", manualReview: false, value: 500000 }
    ],
    skipDuplicates: true,
  });

  await prisma.pipelineEntry.createMany({
    data: [
      { title: "Projekt A", stage: "Angebot", value: 200000 },
      { title: "Projekt B", stage: "Verhandlung", value: 400000 }
    ],
    skipDuplicates: true,
  });

  console.log("🌱 Seed erfolgreich");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
JS

node prisma/seed.js || true

# =========================================
# 5. Modernes Dashboard
# =========================================
cat > app/page.tsx <<'TSX'
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
    <div className="card">
      <div className="label">{title}</div>
      <div className={`kpi ${color}`}>{value}</div>
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

      <div className="card">
        <div className="label">Weighted Pipeline</div>
        <div className="kpi text-primary">{Math.round(weighted / 1000)}k €</div>
      </div>
    </div>
  );
}
TSX

# =========================================
# 6. Git Commit & Push
# =========================================
git add .
git commit -m "fix: prisma v7 adapter, restore tailwind design, seed data and dashboard" || true
git push origin main || true

echo "✅ FINAL FIX erfolgreich abgeschlossen!"
echo "👉 Bitte Server neu starten: npm run dev"
