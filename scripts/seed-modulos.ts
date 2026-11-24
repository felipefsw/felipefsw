/** Garante linhas ModuloFlag para todos os módulos do catálogo. */
import { prisma } from "../src/lib/prisma";
import { MODULOS } from "../src/lib/modulos";

async function main() {
  for (const m of MODULOS) {
    await prisma.moduloFlag.upsert({
      where: { slug: m.slug },
      create: {
        slug: m.slug,
        titulo: m.titulo,
        descricao: m.descricao,
        fase: m.fase,
        ativo: Boolean(m.sempreAtivo),
      },
      update: {
        titulo: m.titulo,
        descricao: m.descricao,
        fase: m.fase,
        ...(m.sempreAtivo ? { ativo: true } : {}),
      },
    });
  }
  console.log(`ModuloFlag: ${MODULOS.length} módulos`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
