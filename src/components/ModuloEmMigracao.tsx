import Link from "next/link";

export default function ModuloEmMigracao({
  titulo,
  fase,
  origem,
}: {
  titulo: string;
  fase: number;
  origem: string;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-amber-800">
        Fase {fase} · em migração
      </p>
      <h1 className="text-xl font-bold text-gray-900">{titulo}</h1>
      <p className="text-sm text-gray-700">
        Este módulo está sendo portado do rederwp (<code className="text-xs">{origem}</code>
        ). Enquanto isso, use o rederwp em produção. Ative a flag do módulo só depois do cutover.
      </p>
      <Link href="/modulos" className="inline-block text-sm font-semibold text-orange-700 underline">
        ← Ver todos os módulos
      </Link>
    </div>
  );
}
