import "dotenv/config";

// Integration tests run against TEST_DATABASE_URL only — never the dev/prod database.
if (process.env.SKIP_DB_TESTS) {
  delete process.env.TEST_DATABASE_URL;
} else if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}
process.env.LOCAL_STORAGE_DIR = "./storage-test";
process.env.STORAGE_DRIVER = "local";
