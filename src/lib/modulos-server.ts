import { prisma } from "@/lib/prisma";
import { MODULOS, modulosViaEnv, type ModuloDef, type ModuloSlug } from "@/lib/modulos";

export type ModuloComEstado = ModuloDef & { ativo: boolean };

/** Une catálogo + ModuloFlag + MODULES_ENABLED. */
export async function listarModulos(): Promise<ModuloComEstado[]> {
  const envOn = modulosViaEnv();
  let flags: { slug: string; ativo: boolean }[] = [];
  try {
    flags = await prisma.moduloFlag.findMany({ select: { slug: true, ativo: true } });
  } catch {
    // migration ainda não aplicada
  }
  const bySlug = new Map(flags.map((f) => [f.slug, f.ativo]));

  return MODULOS.map((m) => {
    if (m.sempreAtivo) return { ...m, ativo: true };
    const db = bySlug.get(m.slug);
    const ativo = db === true || envOn.has(m.slug);
    return { ...m, ativo };
  });
}

export async function moduloAtivo(slug: ModuloSlug): Promise<boolean> {
  const lista = await listarModulos();
  return lista.find((m) => m.slug === slug)?.ativo ?? false;
}
