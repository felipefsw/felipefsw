import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  Card,
  PageHeader,
  btnPrimary,
  btnSecondary,
  inputClass,
  labelClass,
} from "@/components/ui";
import { formatDateWithWeekday } from "@/lib/format";
import { ASPECTOS } from "@/lib/aspectos";
import { getSessao } from "@/lib/auth";
import { avaliarDiaristaLoja } from "../../actions";

export const dynamic = "force-dynamic";

const NOTAS = Array.from({ length: 11 }, (_, i) => i); // 0..10

export default async function LojaAvaliarPage({
  params,
}: {
  params: Promise<{ escalaId: string }>;
}) {
  const sessao = await getSessao();
  if (!sessao || sessao.tipo !== "loja") redirect("/entrar");

  const { escalaId } = await params;
  const escala = await prisma.escala.findUnique({
    where: { id: escalaId },
    include: { diarista: true, avaliacao: true },
  });
  if (!escala || escala.lojaId !== sessao.lojaId) notFound();

  const atual = escala.avaliacao as Record<string, number> | null;

  return (
    <div className="space-y-4">
      <PageHeader
        title={escala.avaliacao ? "Editar avaliação" : "Avaliar diarista"}
        subtitle={escala.diarista.nome}
      />

      <Card>
        <p className="text-sm capitalize text-gray-500">
          {formatDateWithWeekday(escala.data)}
          {escala.horaInicio && escala.horaFim ? ` · ${escala.horaInicio}–${escala.horaFim}` : ""}
        </p>
      </Card>

      <Card>
        <form action={avaliarDiaristaLoja} className="space-y-4">
          <input type="hidden" name="escalaId" value={escala.id} />
          <p className="text-sm text-gray-500">Notas de 0 a 10 em cada aspecto.</p>

          {ASPECTOS.map((a) => (
            <div key={a.key} className="flex items-center justify-between gap-3">
              <label className="text-sm font-medium text-gray-700" htmlFor={a.key}>
                {a.label}
              </label>
              <select
                id={a.key}
                name={a.key}
                required
                defaultValue={atual ? String(atual[a.key]) : ""}
                className="w-24 rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              >
                <option value="" disabled>
                  —
                </option>
                {NOTAS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          ))}

          <div>
            <label className={labelClass} htmlFor="comentario">
              Comentário (opcional)
            </label>
            <textarea
              id="comentario"
              name="comentario"
              rows={3}
              defaultValue={escala.avaliacao?.comentario ?? ""}
              className={inputClass}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button type="submit" className={btnPrimary}>
              Salvar avaliação
            </button>
            <Link href="/loja" className={btnSecondary}>
              Cancelar
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
