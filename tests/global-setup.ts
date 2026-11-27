import "dotenv/config";
import { execSync } from "node:child_process";

/** Applies migrations to the TEST database before integration tests run. */
export default function setup() {
  const url = process.env.SKIP_DB_TESTS ? "" : process.env.TEST_DATABASE_URL;
  if (!url) {
    console.warn("\n[tests] TEST_DATABASE_URL not set (or SKIP_DB_TESTS=1) — database integration tests will be skipped.\n");
    return;
  }
  if (url === process.env.DATABASE_URL) {
    throw new Error("TEST_DATABASE_URL must point to a different database than DATABASE_URL (tests wipe it).");
  }
  execSync("npx prisma migrate deploy", { stdio: "inherit", env: { ...process.env, DATABASE_URL: url } });
}
