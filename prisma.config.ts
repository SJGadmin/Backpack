// Prisma configuration for Next.js
// Note: dotenv import removed - Vercel automatically injects environment variables
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["POSTGRES_URL"],
  },
});
