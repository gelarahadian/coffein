import { execSync } from "node:child_process";

const TEST_DB_URL = "postgresql://coffein:coffein@localhost:5433/coffein_test";

export default function setup(): void {
  // Buat database test jika belum ada (postgres dev container harus jalan).
  try {
    execSync(
      'docker exec coffein-postgres psql -U coffein -d coffein -c "CREATE DATABASE coffein_test"',
      { stdio: "ignore" },
    );
  } catch {
    // Database sudah ada — abaikan.
  }

  // Sinkronkan schema Prisma ke database test.
  execSync("pnpm exec prisma db push --skip-generate", {
    env: { ...process.env, DATABASE_URL: TEST_DB_URL },
    stdio: "inherit",
    cwd: __dirname + "/..",
  });
}
