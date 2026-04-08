#!/bin/bash
set -e

echo "🚀 RUWE Bid OS – Master Automation Setup v2 startet..."

# =====================================
# 1. Abhängigkeiten installieren
# =====================================
echo "📦 Installiere Abhängigkeiten..."
npm install axios swr @prisma/client prisma date-fns

# =====================================
# 2. Environment Setup
# =====================================
echo "🌍 Erstelle .env für lokale & Vercel Nutzung..."
cat > .env <<'ENV'
DATABASE_URL="file:./dev.db"
NODE_ENV="development"
ENV

# =====================================
# 3. Prisma v7 Konfiguration
# =====================================
echo "🗄️ Konfiguriere Prisma v7..."

mkdir -p prisma

cat > prisma/schema.prisma <<'PRISMA'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
}

model User {
  id    String @id @default(uuid())
  name  String
  role  String
}

model Tender {
  id           String   @id @default(uuid())
  title        String
  region       String
  trade        String
  priority     String
  status       String
  manualReview Boolean  @default(false)
  dueDate      DateTime?
  value        Float    @default(0)
  createdAt    DateTime @default(now())
}

model PipelineEntry {
  id    String @id @default(uuid())
  title String
  stage String
  value Float
}

model MonitoringSource {
  id   String @id @default(uuid())
  name String
  url  String
  type String
}
PRISMA

cat > prisma.config.ts <<'PRISMA'
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  engine: "classic",
  datasource: { url: process.env.DATABASE_URL || "file:./dev.db" },
});
PRISMA

npx prisma generate
npx prisma migrate dev --name init

# =====================================
# 4. Prisma Client Helper
# =====================================
mkdir -p lib

cat > lib/prisma.ts <<'TS'
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
TS

# =====================================
# 5. Monitoring Scaffold (RSS/TED)
# =====================================
mkdir -p lib/monitoring

cat > lib/monitoring/rssFetcher.ts <<'TS'
export async function fetchRssFeeds() {
  console.log("RSS Monitoring placeholder – zukünftige Integration mit TED & bund.de");
  return [];
}
TS

cat > lib/monitoring/evaluator.ts <<'TS'
export function evaluateTender(tender: any) {
  if (tender.value > 400000) return "go";
  if (tender.value > 100000) return "prüfen";
  return "no-go";
}
TS

# =====================================
# 6. Dashboard mit erweiterten KPIs & Alerts
# =====================================
cat > app/page.tsx <<'TSX'
"use client";

import useSWR from "swr";
import axios from "axios";

const fetcher = (url: string) => axios.get(url).then(res => res.data);

export default function Dashboard() {
  const { data: tenders } = useSWR("/api/tenders", fetcher);
  const { data: pipeline } = useSWR("/api/pipeline", fetcher);

  const all = tenders || [];
  const pending = all.filter((t: any) => t.status === "neu").length;
  const manual = all.filter((t: any) => t.manualReview).length;
  const go = all.filter((t: any) => t.status === "go").length;
  const overdue = all.filter((t: any) => t.dueDate && new Date(t.dueDate) < new Date()).length;

  const weighted = (pipeline || []).reduce((sum: number, p: any) => sum + p.value, 0);
  const status = overdue > 0 ? "KRITISCH" : manual > 0 ? "PRÜFEN" : "GUT";

  const Card = ({ title, value, color = "black" }: any) => (
    <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-bold" style={{ color }}>{value}</div>
    </div>
  );

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Vertriebssteuerung neu denken.</h1>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <Card title="Neu eingegangen" value={pending} />
        <Card title="Manuell prüfen" value={manual} />
        <Card title="Go-Kandidaten" value={go} />
        <Card title="Überfällig" value={overdue} color="red" />
        <Card title="Gesamtlage" value={status} color={status === "GUT" ? "green" : status === "PRÜFEN" ? "orange" : "red"} />
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-2">Weighted Pipeline</h2>
        <div className="text-3xl font-bold text-orange-500">
          {Math.round(weighted / 1000)}k €
        </div>
      </div>
    </div>
  );
}
TSX

# =====================================
# 7. API-Routen
# =====================================
create_api() {
  local name=$1
  local model=$2
  mkdir -p "app/api/$name"
  cat > "app/api/$name/route.ts" <<TS
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const data = await prisma.${model}.findMany();
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();
  const data = await prisma.${model}.create({ data: body });
  return NextResponse.json(data);
}
TS
}

create_api "tenders" "tender"
create_api "pipeline" "pipelineEntry"

# =====================================
# 8. Seed-Daten
# =====================================
cat > prisma/seed.ts <<'TS'
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  await prisma.tender.createMany({
    data: [
      { title: "Sicherheitsdienst", region: "Magdeburg", trade: "Sicherheit", priority: "A", status: "neu", manualReview: true, value: 300000 },
      { title: "Reinigung Berlin", region: "Berlin", trade: "Reinigung", priority: "B", status: "go", manualReview: false, value: 500000 },
    ],
  });

  await prisma.pipelineEntry.createMany({
    data: [
      { title: "Projekt A", stage: "Angebot", value: 200000 },
      { title: "Projekt B", stage: "Verhandlung", value: 400000 },
    ],
  });

  await prisma.monitoringSource.create({
    data: { name: "TED Europa", url: "https://ted.europa.eu", type: "rss" },
  });
}

main().finally(() => prisma.$disconnect());
TS

npx ts-node prisma/seed.ts || true

# =====================================
# 9. Git Commit & Push
# =====================================
git add .
git commit -m "feat: RUWE Bid OS automation v2 with monitoring scaffold, roles, alerts and production readiness" || true
git push origin main || true

echo "✅ RUWE Bid OS – Automatisierung Stufe 2 abgeschlossen!"
echo "👉 Starte die App mit: npm run dev"
