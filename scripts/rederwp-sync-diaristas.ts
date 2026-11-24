/**
 * Sync idempotente: rederwp.diaristas (+ diarias staging) → Postgres felipefsw.
 * Uso: npx tsx scripts/rederwp-sync-diaristas.ts [--dry]
 *
 * - Cria/atualiza Diarista por rederwpId (não apaga existentes sem vínculo).
 * - Guarda diárias em EscalaRederwpMap (staging); conversão p/ Escala é passo seguinte
 *   quando Loja.rederwpId estiver preenchido.
 */
import { prisma } from "../src/lib/prisma";
import { comRederwp, rederwpConfigurado } from "../src/lib/rederwp/client";
import {
  dataIso,
  funcaoDiarista,
  nomeDiarista,
  type RederwpDiaria,
  type RederwpDiarista,
} from "../src/lib/rederwp/map-diarias";

const dry = process.argv.includes("--dry");

async function main() {
  if (!rederwpConfigurado()) {
    console.error("Configure REDERWP_DB_* no .env.");
    process.exit(1);
  }

  const run = await prisma.syncRun.create({
    data: { dominio: "diaristas", tipo: "sync", status: "rodando" },
  });

  try {
    const { diaristas, diarias } = await comRederwp(async (q) => {
      // Colunas variam entre ambientes; SELECT * e normalizamos.
      const dRows = (await q("SELECT * FROM diaristas")) as RederwpDiarista[];
      let aRows: RederwpDiaria[] = [];
      try {
        aRows = (await q("SELECT * FROM diarias ORDER BY id DESC LIMIT 5000")) as RederwpDiaria[];
      } catch {
        aRows = [];
      }
      return { diaristas: dRows, diarias: aRows };
    });

    let criados = 0;
    let atualizados = 0;
    let mapas = 0;

    for (const row of diaristas) {
      const rederwpId = Number(row.id);
      if (!rederwpId) continue;
      const nome = nomeDiarista(row);
      const data = {
        nome,
        cpf: row.cpf ? String(row.cpf).replace(/\D/g, "") || null : null,
        telefone: row.telefone ? String(row.telefone) : null,
        chavePix: row.pix ? String(row.pix) : null,
        funcao: funcaoDiarista(row),
        ativo: row.status === undefined || row.status === null ? true : Boolean(Number(row.status)),
        rederwpId,
      };

      if (dry) {
        console.log("[dry] diarista", data);
        continue;
      }

      const existente = await prisma.diarista.findUnique({ where: { rederwpId } });
      if (existente) {
        await prisma.diarista.update({ where: { id: existente.id }, data });
        atualizados++;
      } else {
        await prisma.diarista.create({ data });
        criados++;
      }
    }

    for (const d of diarias) {
      const rederwpDiariaId = Number(d.id);
      if (!rederwpDiariaId) continue;
      const payload = JSON.stringify(d);
      if (dry) {
        console.log("[dry] diaria", rederwpDiariaId, dataIso(d.data));
        continue;
      }
      await prisma.escalaRederwpMap.upsert({
        where: { rederwpDiariaId },
        create: { rederwpDiariaId, payload, status: "pendente" },
        update: { payload },
      });
      mapas++;
    }

    const resumo = { criados, atualizados, mapas, dry, totalOrigem: diaristas.length };
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
