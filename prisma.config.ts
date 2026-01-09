// Prisma 7.x 配置文件
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Transaction Pooler - 用于应用查询
    url: process.env["DATABASE_URL"]!,
    // Direct Connection - 用于数据库迁移
    directUrl: process.env["DIRECT_URL"]!,
  },
});
