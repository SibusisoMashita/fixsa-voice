import { defineConfig } from "vitest/config";
export default defineConfig({
  resolve: { alias: { "@": `${import.meta.dirname}/src` } },
  test: {
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    coverage: { reporter: ["text", "html"], include: ["src/lib/**/*.ts"] }
  }
});
