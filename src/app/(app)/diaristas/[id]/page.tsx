import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui";
import CopyLink from "@/components/CopyLink";
import CopyButton from "@/components/CopyButton";
import Avatar from "@/components/Avatar";
import { formatBRL, formatDate } from "@/lib/format";
import { medalhasDoDiarista } from "@/lib/medalhas";
import DiaristaForm from "../DiaristaForm";
import { bloquearPermanente, removerBloqueio, updateDiarista } from "../actions";

export default async function EditarDiaristaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [diarista, lojas] = await Promise.all([
    prisma.diarista.findUnique({
      where: { id },
      include: { lojasPreferidas: { select: { id: true } } },
    }),
    prisma.loja.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true },
    }),
  ]);
  if (!diarista) notFound();

  const [avaliacoes, bloqueios, historico] = await Promise.all([
    prisma.avaliacao.findMany({
      where: { diaristaId: id },
      include: { escala: { include: { loja: true } } },
      orderBy: { criadoEm: "desc" },
    }),
    prisma.bloqueio.findMany({
      where: { diaristaId: id },
      include: { loja: { select: { nome: true } } },
      orderBy: { criadoEm: "desc" },
    }),
    prisma.escala.findMany({
      where: { diaristaId: id },
      include: { loja: { select: { nome: true } }, avaliacao: true },
      orderBy: { data: "desc" },
      take: 50,
    }),
  ]);
  const totalDiarias = historico.filter((e) => e.presenca === "PRESENTE").length;

  // A nota só aparece após 5 diárias avaliadas; usa a média das 5 mais recentes.
  const MIN_AVALIACOES = 5;
  const total = avaliacoes.length;
  const notaLiberada = total >= MIN_AVALIACOES;
  const usadas = avaliacoes.slice(0, MIN_AVALIACOES);
  const mediaGeral = usadas.length
    ? usadas.reduce((s, a) => s + a.estrelas, 0) / usadas.length
    : 0;
  const agora = new Date();
  const medalhas = await medalhasDoDiarista(id);

  return (
    <div className="space-y-4">
      <div className="mb-4 flex items-center gap-3">
        <Avatar nome={diarista.nome} fotoUrl={diarista.fotoUrl} className="h-12 w-12" />
        <div>
          <h1 className="text-xl font-bold text-gray-900">{diarista.nome}</h1>
          <p className="text-sm text-gray-500">Editar diarista</p>
        </div>
      </div>
      <DiaristaForm
        action={updateDiarista}
        diarista={diarista}
        lojas={lojas}
        submitLabel="Salvar alterações"
      />

      <Card>
        <h2 className="font-semibold text-gray-900">Link pessoal</h2>
        <p className="mb-3 mt-1 text-sm text-gray-500">
          Envie este link para a diarista (por WhatsApp, por exemplo). Com ele, ela vê a
          própria escala e confirma presença — sem precisar de senha.
        </p>
        <CopyLink path={`/d/${diarista.token}`} />
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-2">
          <span className="min-w-0 text-sm text-gray-700">
            {diarista.chavePix ? (
              <>
                Pix: <span className="font-medium">{diarista.chavePix}</span>
              </>
            ) : (
              <span className="text-gray-400">Sem Pix cadastrado</span>
            )}
          </span>
          {diarista.chavePix && (
            <CopyButton
              text={diarista.chavePix}
              className="shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700"
            />
          )}
        </div>
      </Card>

      {medalhas.length > 0 && (
        <Card>
          <h2 className="font-semibold text-gray-900">Medalhas</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {medalhas.map((m) => (
              <span
                key={m.nome}
                className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-medium text-amber-800"
              >
                {m.emoji} {m.nome}
              </span>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Avaliações</h2>
          {notaLiberada && (
            <span className="text-sm text-gray-500">
              nota <strong className="text-orange-700">★ {mediaGeral.toFixed(1)}</strong> de 5
              (últimas 5)
            </span>
          )}
        </div>

        {!notaLiberada ? (
          <p className="mt-2 text-sm text-gray-500">
            Nota disponível após <strong>5 diárias</strong> avaliadas ({total}/5).
          </p>
        ) : (
          <>
            <h3 className="mb-2 mt-3 text-sm font-semibold text-gray-700">Últimas diárias</h3>
            <ul className="divide-y divide-gray-100">
              {avaliacoes.slice(0, 5).map((a) => (
                <li key={a.id} className="py-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-gray-600">
                      {formatDate(a.escala.data)} · {a.escala.loja.nome}
                    </span>
                    <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700">
                      ★ {a.estrelas}
                    </span>
                  </div>
                  {a.comentario && <p className="mt-1 text-sm text-gray-500">{a.comentario}</p>}
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Histórico de diárias</h2>
          <span className="text-sm text-gray-500">{totalDiarias} concluída(s)</span>
        </div>
        {historico.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">Sem diárias registradas ainda.</p>
        ) : (
          <ul className="mt-3 divide-y divide-gray-100">
            {historico.map((e) => {
              const notaDia = e.avaliacao ? e.avaliacao.estrelas : null;
              return (
                <li key={e.id} className="flex items-start justify-between gap-3 py-2 text-sm">
                  <span className="min-w-0">
                    <span className="text-gray-700">{formatDate(e.data)}</span>{" "}
                    <span className="text-gray-500">· {e.loja.nome}</span>
                    <span className="block text-xs text-gray-400">
                      {e.horaInicio && e.horaFim ? `${e.horaInicio}–${e.horaFim} · ` : ""}
                      {formatBRL(e.valorPago ?? e.valor)}
                      {notaDia !== null ? ` · ★ ${notaDia}` : ""}
                    </span>
                  </span>
                  <span className="shrink-0">
                    {e.presenca === "PRESENTE" ? (
                      <span className="text-green-600">presente</span>
                    ) : e.presenca === "FALTOU" ? (
                      <span className="text-red-500">faltou</span>
                    ) : (
                      <span className="text-gray-400">pendente</span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="font-semibold text-gray-900">Bloqueios</h2>
        <p className="mt-1 text-xs text-gray-400">
          Diarista bloqueada não pode ser escalada nem se inscrever naquela loja.
        </p>

        {bloqueios.length > 0 && (
          <ul className="mt-3 divide-y divide-gray-100">
            {bloqueios.map((b) => {
              const ativo = b.ate === null || b.ate > agora;
              return (
                <li key={b.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span>
                    <span className="font-medium text-gray-900">{b.loja.nome}</span>{" "}
                    <span className={ativo ? "text-red-600" : "text-gray-400"}>
                      {b.origem === "RH"
                        ? "· permanente (RH)"
                        : b.ate
                          ? `· até ${formatDate(b.ate.toISOString().slice(0, 10))}`
                          : ""}
                      {!ativo ? " (expirado)" : ""}
                    </span>
                  </span>
                  <form action={removerBloqueio}>
                    <input type="hidden" name="id" value={b.id} />
                    <input type="hidden" name="diaristaId" value={diarista.id} />
                    <button type="submit" className="text-xs text-orange-700 underline">
                      remover
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}

        <form action={bloquearPermanente} className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3">
          <input type="hidden" name="diaristaId" value={diarista.id} />
          <select
            name="lojaId"
            required
            defaultValue=""
            className="flex-1 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm"
          >
            <option value="" disabled>
              Escolha a loja
            </option>
            {lojas.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nome}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Bloquear (permanente)
          </button>
        </form>
      </Card>
    </div>
  );
}
