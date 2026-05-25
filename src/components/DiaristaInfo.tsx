import Avatar from "@/components/Avatar";
import { patenteDeDiarias } from "@/lib/medalhas";

// Identificação compacta da diarista, usada em todas as áreas (RH, TI, gestor, lojista):
// foto + nome, e ao lado a nota (★) e o nº de diárias (entre parênteses), com a patente.
export default function DiaristaInfo({
  nome,
  fotoUrl,
  funcao,
  nota,
  diarias,
  avatarClassName = "h-10 w-10",
  extra,
}: {
  nome: string;
  fotoUrl?: string | null;
  funcao?: string | null;
  nota?: number | null;
  diarias: number;
  avatarClassName?: string;
  extra?: React.ReactNode;
}) {
  const patente = patenteDeDiarias(diarias);
  return (
    <span className="flex min-w-0 items-center gap-2">
      <Avatar nome={nome} fotoUrl={fotoUrl} className={avatarClassName} />
      <span className="min-w-0">
        <span className="flex items-center gap-1.5">
          <span className="truncate font-medium text-gray-900">{nome}</span>
          {patente && (
            <span title={`Patente: ${patente.nome} (${diarias} diárias)`} className="shrink-0">
              {patente.emoji}
            </span>
          )}
        </span>
        <span className="block text-xs text-gray-500">
          {nota != null && (
            <span className="font-semibold text-orange-700">★ {nota.toFixed(1)} </span>
          )}
          <span>({diarias} diária{diarias === 1 ? "" : "s"})</span>
          {funcao ? <span className="text-gray-400"> · {funcao}</span> : null}
        </span>
        {extra}
      </span>
    </span>
  );
}
