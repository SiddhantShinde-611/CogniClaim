import { PrismaClient } from '@prisma/client';

function getDatabaseUrl(): string {
  // If DB_HOST + DB_PASSWORD are provided, construct the URL with proper encoding.
  // This handles passwords containing special chars (e.g. @) that break plain URL strings.
  if (process.env.DB_HOST && process.env.DB_PASSWORD) {
    const pw   = encodeURIComponent(process.env.DB_PASSWORD);
    const host = process.env.DB_HOST;
    const ref  = process.env.DB_REF || '';
    return `postgresql://postgres${ref}:${pw}@${host}:5432/postgres?sslmode=require`;
  }
  return process.env.DATABASE_URL!;
}

export const prisma = new PrismaClient({
  datasources: { db: { url: getDatabaseUrl() } },
});
