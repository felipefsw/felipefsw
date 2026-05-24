import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { addDias, hojeISO } from "@/lib/dates";
import PertoDeMim, { type ItemPerto } from "@/components/PertoDeMim";

export const dynamic = "force-dynamic";

function enderecoCompleto(l: {
  endereco: string | null;
  bairro: string | null;
  cidade: string | null;
}): string {
  return [l.endereco, l.bairro, l.cidade].filter(Boolean).join(", ");
}

export default async function PertoPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
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

  if (!diarista) {
    return (
      <div className="mx-auto max-w-md p-6 text-center">
        <h1 className="mt-10 text-xl font-bold text-gray-900">Link inválido</h1>
      </div>
    );
  }

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
    <div className="mx-auto max-w-md">
      <header className="bg-neutral-900 px-5 py-6 text-white">
        <Link href={`/d/${token}`} className="text-sm font-medium text-orange-100 underline">
          ← Voltar
        </Link>
        <h1 className="mt-2 text-xl font-bold">Encontrar diárias perto de mim</h1>
        <p className="mt-1 text-sm text-orange-100">
          As diárias mais próximas de onde você está, da mais perto para a mais longe.
        </p>
      </header>

      <main className="p-5">
        <PertoDeMim token={token} itens={itens} />
      </main>
    </div>
  );
}
