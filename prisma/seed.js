const { PrismaClient } = require("@prisma/client");
const { PrismaBetterSQLite3 } = require("@prisma/adapter-better-sqlite3");

const prisma = new PrismaClient({
  adapter: new PrismaBetterSQLite3({ url: "file:./prisma/dev.db" }),
});

async function main() {
  await prisma.tender.createMany({
    data: [
      { title: "Sicherheitsdienst Magdeburg", region: "Magdeburg", trade: "Sicherheit", priority: "A", status: "neu", manualReview: true, value: 300000 },
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

  console.log("🌱 Seed erfolgreich abgeschlossen");
}

main().finally(() => prisma.$disconnect());
