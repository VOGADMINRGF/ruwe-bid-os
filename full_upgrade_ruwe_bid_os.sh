#!/bin/bash
set -e

echo "🚀 Starte vollständiges Upgrade des RUWE Bid OS..."

cd ~/Arbeitsmappe/ruwe-bid-os

# ================================
# 1. Abhängigkeiten installieren
# ================================
npm install @prisma/client prisma swr axios uuid
npx prisma init --datasource-provider sqlite

# ================================
# 2. Prisma Datenbankmodell
# ================================
cat > prisma/schema.prisma <<'PRISMA'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

model Zone {
  id            String   @id @default(uuid())
  name          String
  radiusKm      Int
  priorityTrades String
  tenders       Tender[]
}

model Buyer {
  id        String   @id @default(uuid())
  name      String
  type      String
  strategic Boolean  @default(false)
  tenders   Tender[]
}

model Agent {
  id            String   @id @default(uuid())
  name          String
  focus         String
  level         String
  winRate       Float
  pipelineValue Float
  tenders       Tender[]
}

model Tender {
  id            String   @id @default(uuid())
  title         String
  region        String
  trade         String
  estimatedValue Float
  priority      String
  decision      String
  status        String
  manualReview  String
  riskLevel     String
  fitSummary    String
  dueDate       DateTime?
  zoneId        String?
  buyerId       String?
  agentId       String?

  zone   Zone?  @relation(fields: [zoneId], references: [id])
  buyer  Buyer? @relation(fields: [buyerId], references: [id])
  agent  Agent? @relation(fields: [agentId], references: [id])
}

model Reference {
  id          String   @id @default(uuid())
  title       String
  description String
  trade       String
  region      String
  value       Float
  createdAt   DateTime @default(now())
}
PRISMA

npx prisma migrate dev --name init

# ================================
# 3. Prisma Client Helper
# ================================
mkdir -p lib
cat > lib/prisma.ts <<'TS'
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
TS

# ================================
# 4. API Routes (CRUD)
# ================================
mkdir -p app/api/{tenders,agents,zones,buyers,references}

create_api() {
  local NAME=$1
  local MODEL=$2

  cat > app/api/$NAME/route.ts <<TS
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const data = await prisma.$MODEL.findMany();
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();
  const data = await prisma.$MODEL.create({ data: body });
  return NextResponse.json(data);
}
TS
}

create_api "tenders" "tender"
create_api "agents" "agent"
create_api "zones" "zone"
create_api "buyers" "buyer"
create_api "references" "reference"

# ================================
# 5. Detail-API (GET, PUT, DELETE)
# ================================
create_detail_api() {
  local NAME=$1
  local MODEL=$2

  mkdir -p app/api/$NAME/[id]
  cat > app/api/$NAME/[id]/route.ts <<TS
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const data = await prisma.$MODEL.findUnique({ where: { id: params.id } });
  return NextResponse.json(data);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const data = await prisma.$MODEL.update({
    where: { id: params.id },
    data: body,
  });
  return NextResponse.json(data);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await prisma.$MODEL.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
TS
}

create_detail_api "tenders" "tender"
create_detail_api "agents" "agent"
create_detail_api "zones" "zone"
create_detail_api "buyers" "buyer"
create_detail_api "references" "reference"

# ================================
# 6. Klickbare Navigation
# ================================
mkdir -p components
cat > components/Nav.tsx <<'TSX'
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/tenders", label: "Tenders" },
  { href: "/pipeline", label: "Pipeline" },
  { href: "/agents", label: "Agents" },
  { href: "/zones", label: "Zones" },
  { href: "/buyers", label: "Buyers" },
  { href: "/references", label: "References" },
  { href: "/config", label: "Config" },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <nav className="bg-black text-white px-6 py-4 flex gap-6">
      <div className="font-bold text-orange-500 text-xl">RUWE Bid OS</div>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={pathname === link.href ? "text-orange-500" : "hover:text-orange-300"}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
TSX

# ================================
# 7. Beispielseite: Tenders (Live-Daten)
# ================================
mkdir -p app/tenders
cat > app/tenders/page.tsx <<'TSX'
"use client";
import useSWR from "swr";
import axios from "axios";
import Link from "next/link";

const fetcher = (url: string) => axios.get(url).then(res => res.data);

export default function TendersPage() {
  const { data: tenders, mutate } = useSWR("/api/tenders", fetcher);

  async function deleteTender(id: string) {
    await axios.delete(`/api/tenders/${id}`);
    mutate();
  }

  if (!tenders) return <div className="p-6">Lade Daten...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Ausschreibungen</h1>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">Titel</th>
            <th className="p-2">Region</th>
            <th className="p-2">Priorität</th>
            <th className="p-2">Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {tenders.map((t: any) => (
            <tr key={t.id} className="border-t">
              <td className="p-2">
                <Link href={`/tenders/${t.id}`} className="text-blue-600 underline">
                  {t.title}
                </Link>
              </td>
              <td className="p-2">{t.region}</td>
              <td className="p-2">{t.priority}</td>
              <td className="p-2 flex gap-2">
                <Link href={`/tenders/${t.id}`} className="text-orange-500">Bearbeiten</Link>
                <button onClick={() => deleteTender(t.id)} className="text-red-500">Löschen</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
TSX

# ================================
# 8. Layout aktualisieren
# ================================
cat > app/layout.tsx <<'TSX'
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata = {
  title: "RUWE Bid OS",
  description: "Strategisches Bid Management System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>
        <Nav />
        <main className="p-6">{children}</main>
      </body>
    </html>
  );
}
TSX

# ================================
# 9. Seed-Daten
# ================================
cat > prisma/seed.ts <<'TS'
import { prisma } from '../lib/prisma';

async function main() {
  await prisma.zone.create({
    data: { name: "Leipzig/Halle", radiusKm: 55, priorityTrades: "Facility,Sicherheit" }
  });

  await prisma.agent.create({
    data: { name: "Agent 1", focus: "Facility Ost", level: "Koordinator", winRate: 0.41, pipelineValue: 4200000 }
  });

  await prisma.buyer.create({
    data: { name: "Stadt Leipzig", type: "Öffentlich", strategic: true }
  });

  await prisma.tender.create({
    data: {
      title: "Verwaltungsreinigung Leipzig",
      region: "Leipzig/Halle",
      trade: "Facility",
      estimatedValue: 1800000,
      priority: "A",
      decision: "Go",
      status: "go",
      manualReview: "nein",
      riskLevel: "niedrig",
      fitSummary: "stark"
    }
  });
}

main().finally(() => prisma.$disconnect());
TS

npx ts-node prisma/seed.ts || true

# ================================
# 10. Git Commit & Push
# ================================
git add .
git commit -m "feat: full interactive RUWE Bid OS with CRUD, API, Prisma and navigation" || true
git push origin main

echo "✅ Upgrade abgeschlossen!"
echo "🌐 Lokal starten: npm run dev"
echo "🚀 Deployment erfolgt automatisch über Vercel."
