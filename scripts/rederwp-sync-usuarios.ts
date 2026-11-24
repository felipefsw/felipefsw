/**
 * Sync parcial acesso/roles_acess → Membro (Fase 2).
 * Só importa usuários com ass contendo RH/TI/Master (não cria gestores/lojas aqui).
 * Uso: npx tsx scripts/rederwp-sync-usuarios.ts [--dry]
 */
import { prisma } from "../src/lib/prisma";
import { comRederwp, rederwpConfigurado } from "../src/lib/rederwp/client";

const dry = process.argv.includes("--dry");

type Acesso = {
  id: number;
  login?: string | null;
  name?: string | null;
  nome?: string | null;
  ass?: string | null;
  status?: number | boolean | null;
};

function perfilDeAss(ass: string | null | undefined): "rh" | "ti" | null {
  const a = (ass || "").toLowerCase();
  if (a.includes("ti") || a.includes("tecnolog") || a.includes("master")) return "ti";
  if (a.includes("rh") || a.includes("dp") || a.includes("pessoal")) return "rh";
  return null;
}

async function main() {
  if (!rederwpConfigurado()) {
    console.error("Configure REDERWP_DB_*.");
    process.exit(1);
  }

  const run = await prisma.syncRun.create({
    data: { dominio: "usuarios", tipo: "sync", status: "rodando" },
  });

  try {
    const rows = await comRederwp(async (q) => (await q("SELECT * FROM acesso")) as Acesso[]);
    let criados = 0;
    let atualizados = 0;
    let ignorados = 0;

    for (const row of rows) {
      const perfil = perfilDeAss(row.ass);
      if (!perfil) {
        ignorados++;
        continue;
      }
      const rederwpAcessoId = Number(row.id);
      const usuario = String(row.login || `acesso_${rederwpAcessoId}`).trim();
      const nome = String(row.name || row.nome || usuario).trim();
      const ativo = row.status === undefined || row.status === null ? true : Boolean(Number(row.status));

      if (dry) {
        console.log("[dry]", rederwpAcessoId, usuario, perfil);
        continue;
      }

      const existente = await prisma.membro.findUnique({ where: { rederwpAcessoId } });
      if (existente) {
        await prisma.membro.update({
          where: { id: existente.id },
          data: { nome, usuario, perfil, papel: row.ass || null, ativo },
        });
        atualizados++;
      } else {
        const conflito = await prisma.membro.findUnique({ where: { usuario } });
        if (conflito) {
          await prisma.membro.update({
            where: { id: conflito.id },
            data: { rederwpAcessoId, nome, perfil, papel: row.ass || null, ativo },
          });
          atualizados++;
        } else {
          await prisma.membro.create({
            data: {
              nome,
              usuario,
              perfil,
              papel: row.ass || null,
              ativo,
              rederwpAcessoId,
            },
          });
          criados++;
        }
      }
    }

    const resumo = { criados, atualizados, ignorados, totalOrigem: rows.length, dry };
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
