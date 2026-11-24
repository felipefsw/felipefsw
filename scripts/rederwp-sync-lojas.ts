/**
 * Sync idempotente: rederwp.lojas → Loja.rederwpId (Fase 2).
 * Casa por CNPJ ou nome; cria loja mínima se não existir.
 * Uso: npx tsx scripts/rederwp-sync-lojas.ts [--dry]
 */
import { prisma } from "../src/lib/prisma";
import { comRederwp, rederwpConfigurado } from "../src/lib/rederwp/client";

const dry = process.argv.includes("--dry");

type Row = {
  id: number;
  nome?: string | null;
  name?: string | null;
  cnpj?: string | null;
  cidade?: string | null;
  bairro?: string | null;
  endereco?: string | null;
  status?: number | boolean | null;
};

function soDigitos(s: string) {
  return s.replace(/\D/g, "");
}

async function main() {
  if (!rederwpConfigurado()) {
    console.error("Configure REDERWP_DB_*.");
    process.exit(1);
  }

  const run = await prisma.syncRun.create({
    data: { dominio: "lojas", tipo: "sync", status: "rodando" },
  });

  try {
    const rows = await comRederwp(async (q) => (await q("SELECT * FROM lojas")) as Row[]);
    let vinculados = 0;
    let criados = 0;
    let atualizados = 0;

    for (const row of rows) {
      const rederwpId = Number(row.id);
      const nome = String(row.nome || row.name || `Loja #${rederwpId}`).trim();
      const cnpj = row.cnpj ? soDigitos(String(row.cnpj)) || null : null;

      if (dry) {
        console.log("[dry]", rederwpId, nome, cnpj);
        continue;
      }

      let loja =
        (await prisma.loja.findUnique({ where: { rederwpId } })) ||
        (cnpj
          ? await prisma.loja.findFirst({ where: { cnpj } })
          : await prisma.loja.findFirst({ where: { nome: { equals: nome, mode: "insensitive" } } }));

      const data = {
        nome,
        cnpj,
        cidade: row.cidade ? String(row.cidade) : undefined,
        bairro: row.bairro ? String(row.bairro) : undefined,
        endereco: row.endereco ? String(row.endereco) : undefined,
        rederwpId,
        ativo: row.status === undefined || row.status === null ? true : Boolean(Number(row.status)),
      };

      if (loja) {
        await prisma.loja.update({ where: { id: loja.id }, data });
        if (loja.rederwpId) atualizados++;
        else vinculados++;
      } else {
        await prisma.loja.create({ data: { ...data, senha: "123456" } });
        criados++;
      }
    }

    const resumo = { vinculados, criados, atualizados, totalOrigem: rows.length, dry };
    console.log(JSON.stringify(resumo, null, 2));
    await prisma.syncRun.update({
      where: { id: run.id },
      data: { status: "ok", resumo: JSON.stringify(resumo), terminadoEm: new Date() },
    });
  } catch (e) {
    await prisma.syncRun.update({
      where: { id: run.id },
      data: { status: "erro", erro: (e as Error).message, terminadoEm: new Date() },
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
