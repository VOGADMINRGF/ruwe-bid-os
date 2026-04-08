import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  await prisma.zone.create({
    data: { name: "Leipzig/Halle", radiusKm: 55, trades: "Facility,Sicherheit" },
  });

  await prisma.agent.create({
    data: { name: "Agent 1", focus: "Facility Ost", level: "Koordinator", winRate: 0.41 },
  });

  await prisma.buyer.create({
    data: { name: "Stadt Leipzig", type: "Öffentlich", strategic: true },
  });

  await prisma.tender.create({
    data: {
      title: "Verwaltungsreinigung Leipzig",
      region: "Leipzig/Halle",
      trade: "Facility",
      priority: "A",
    },
  });

  await prisma.reference.create({
    data: {
      title: "Referenz Berlin",
      description: "Großprojekt Reinigung",
      trade: "Reinigung",
      region: "Berlin",
    },
  });

  await prisma.pipelineEntry.create({
    data: {
      title: "Pipeline Projekt 1",
      stage: "Angebot",
      value: 250000,
    },
  });
}

main().finally(() => prisma.$disconnect());
