/**
 * Inventário read-only do MySQL rederwp (contagens por tabela-chave).
 * Uso: npx tsx scripts/rederwp-inventario.ts
 */
import { prisma } from "../src/lib/prisma";
import { comRederwp, rederwpConfigurado } from "../src/lib/rederwp/client";

const TABELAS = [
  "diaristas",
  "diarias",
  "diaria_avaliacoes",
  "lojas",
  "acesso",
  "roles_acess",
  "funcionarios",
  "ponto_registros",
  "chamados",
  "os_ti",
  "workspaces",
  "saipos_vendas",
];

async function main() {
  if (!rederwpConfigurado()) {
    console.error("Configure REDERWP_DB_* no .env antes de rodar o inventário.");
    process.exit(1);
  }

  const run = await prisma.syncRun.create({
    data: { dominio: "inventario", tipo: "inventario", status: "rodando" },
  });

  try {
    const contagens = await comRederwp(async (q) => {
      const out: Record<string, number | string> = {};
      for (const t of TABELAS) {
        try {
          const rows = await q(`SELECT COUNT(*) AS n FROM \`${t}\``);
          out[t] = Number((rows[0] as { n: number }).n ?? 0);
        } catch (e) {
          out[t] = `erro: ${(e as Error).message}`;
        }
      }
      return out;
    });

    console.log(JSON.stringify(contagens, null, 2));

    await prisma.syncRun.update({
      where: { id: run.id },
      data: {
        status: "ok",
        resumo: JSON.stringify(contagens),
        terminadoEm: new Date(),
      },
    });
  } catch (e) {
    await prisma.syncRun.update({
      where: { id: run.id },
      data: {
        status: "erro",
        erro: (e as Error).message,
        terminadoEm: new Date(),
      },
    });
    throw e;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
