import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Carrega o .env local (o Prisma precisa da POSTGRES_PRISMA_URL).
try {
  for (const linha of readFileSync(new URL("./.env", import.meta.url), "utf8").split("\n")) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(linha);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {
  // Sem .env: usa as variáveis já exportadas no ambiente.
}

// Testes de aceite do /docs/BUILD_BOOK.md (seção 11).
// Rodam contra o Postgres apontado por POSTGRES_PRISMA_URL (banco de dev).
export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    // Os testes de banco compartilham as mesmas linhas: sem paralelismo.
    fileParallelism: false,
    testTimeout: 20_000,
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
