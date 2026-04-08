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
