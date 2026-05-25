import { prisma } from "@/lib/prisma";
import { addDias, hojeISO } from "@/lib/dates";
import { enderecoCompleto } from "@/lib/loja";
import { exigirDiarista } from "@/lib/diaristaSessao";
import PertoDeMim, { type ItemPerto } from "@/components/PertoDeMim";

export const dynamic = "force-dynamic";

export default async function PertoPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  await exigirDiarista(token);
  const hoje = hojeISO();
  const limite = addDias(hoje, 2);

  const diarista = await prisma.diarista.findUnique({
    where: { token },
    include: {
      inscricoes: { select: { requisicaoId: true } },
      bloqueios: {
        where: { OR: [{ ate: null }, { ate: { gt: new Date() } }] },
        select: { lojaId: true },
      },
    },
  });

  if (!diarista) return null;

  const bloqueadas = new Set(diarista.bloqueios.map((b) => b.lojaId));
  const inscritoEm = new Set(diarista.inscricoes.map((i) => i.requisicaoId));

  const requisicoes = await prisma.requisicao.findMany({
    where: { status: "ABERTA", data: { gte: hoje, lte: limite } },
    include: { loja: true },
    orderBy: { data: "asc" },
  });

  const itens: ItemPerto[] = requisicoes
    .filter((r) => !bloqueadas.has(r.lojaId))
    .map((r) => ({
      id: r.id,
      lojaId: r.lojaId,
      lojaNome: r.loja.nome,
      endereco: enderecoCompleto(r.loja),
      lat: r.loja.latitude,
      lng: r.loja.longitude,
      data: r.data,
      horaInicio: r.horaInicio,
      horaFim: r.horaFim,
      valorDiaria: r.valorDiaria,
      funcao: r.funcao,
      inscrito: inscritoEm.has(r.id),
    }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Perto de mim</h1>
        <p className="text-sm text-gray-500">
          As diárias mais próximas de onde você está, da mais perto para a mais longe.
        </p>
      </div>
      <PertoDeMim token={token} itens={itens} />
    </div>
  );
}
