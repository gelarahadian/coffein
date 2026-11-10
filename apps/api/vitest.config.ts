import { defineConfig } from "vitest/config";
import swc from "unplugin-swc";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.e2e-spec.ts"],
    testTimeout: 30000,
    hookTimeout: 60000,
    globalSetup: ["test/global-setup.ts"],
    env: {
      DATABASE_URL: "postgresql://coffein:coffein@localhost:5433/coffein_test",
      JWT_SECRET: "test-secret-e2e",
      JWT_EXPIRES_IN: "1h",
      PAYMENT_PROVIDER: "mock",
      APP_URL: "http://localhost:3000",
      NODE_ENV: "test",
    },
  },
  plugins: [
    // SWC diperlukan agar decorator metadata NestJS bekerja di vitest
    // (esbuild tidak mendukung emitDecoratorMetadata).
    swc.vite({
      module: { type: "es6" },
      swcrc: true,
    }),
  ],
});
