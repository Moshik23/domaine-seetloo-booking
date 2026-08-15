import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

declare global {
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const adapter = new PrismaBetterSqlite3({ url });
  const client = new PrismaClient({ adapter });

  // WAL + a busy timeout let a concurrent transaction queue and retry
  // instead of throwing SQLITE_BUSY when two staff sessions submit at once.
  client.$executeRawUnsafe("PRAGMA journal_mode = WAL;").catch(() => {});
  client.$executeRawUnsafe("PRAGMA busy_timeout = 5000;").catch(() => {});

  return client;
}

export const prisma = globalThis.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}
