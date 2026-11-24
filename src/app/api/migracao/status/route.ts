import { NextResponse } from "next/server";
import { listarModulos } from "@/lib/modulos-server";
import { prisma } from "@/lib/prisma";

/** Status da migração (gestão / ops). Sem dados sensíveis. */
export async function GET() {
  const modulos = await listarModulos();
  let syncs: { dominio: string; tipo: string; status: string; iniciadoEm: Date }[] = [];
  try {
    syncs = await prisma.syncRun.findMany({
      orderBy: { iniciadoEm: "desc" },
      take: 10,
      select: { dominio: true, tipo: true, status: true, iniciadoEm: true },
    });
  } catch {
    /* migration pendente */
  }

  return NextResponse.json({
    destino: "felipefsw",
    origem: "rederwp",
    modulos: modulos.map((m) => ({
      slug: m.slug,
      titulo: m.titulo,
      fase: m.fase,
      ativo: m.ativo,
    })),
    ultimosSyncs: syncs,
  });
}
