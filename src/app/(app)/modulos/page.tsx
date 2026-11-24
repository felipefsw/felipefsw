import Link from "next/link";
import { listarModulos } from "@/lib/modulos-server";

export const dynamic = "force-dynamic";

export default async function ModulosPage() {
  const modulos = await listarModulos();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Módulos (migração rederwp)</h1>
        <p className="text-sm text-gray-500">
          Domínios portados do rederwp. Os inativos ficam ocultos na operação até o cutover da
          fase. Diaristas continua o núcleo deste app.
        </p>
      </div>
      <ul className="space-y-2">
        {modulos.map((m) => (
          <li key={m.slug}>
            <Link
              href={m.ativo ? m.href : "#"}
              className={`block rounded-xl border px-4 py-3 ${
                m.ativo
                  ? "border-orange-200 bg-white hover:border-orange-400"
                  : "border-gray-100 bg-gray-50 opacity-70"
              }`}
              aria-disabled={!m.ativo}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-gray-900">{m.titulo}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    m.ativo ? "bg-emerald-100 text-emerald-800" : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {m.ativo ? "ativo" : `fase ${m.fase}`}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-gray-500">{m.descricao}</p>
            </Link>
          </li>
        ))}
      </ul>
      <p className="text-xs text-gray-400">
        Docs: <code>docs/migracao-rederwp.md</code> · flags: tabela{" "}
        <code>ModuloFlag</code> ou env <code>MODULES_ENABLED</code>
      </p>
    </div>
  );
}
