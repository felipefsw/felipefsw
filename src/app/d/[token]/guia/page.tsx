import Link from "next/link";
import { exigirDiarista } from "@/lib/diaristaSessao";

export const dynamic = "force-dynamic";

const ORIENTACOES = [
  "Chegue uns 10 minutos antes e faça o check-in pelo app assim que chegar na loja.",
  "Use roupa limpa e adequada (avental/touca se a loja pedir). Cabelo preso e unhas curtas.",
  "Higiene sempre: lave bem as mãos antes de manusear alimentos.",
  "Siga as orientações do gerente e da equipe da loja.",
  "Vai atrasar ou teve um imprevisto? Avise pelo chat \"Falar com o RH\" — avisar não tira sua nota.",
  "Faltar sem avisar prejudica sua nota e pode gerar bloqueio na loja.",
  "No fim do turno, confirme a saída. O pagamento é feito por Pix.",
  "Solicitou uma vaga e mudou de ideia? Dá para desfazer a solicitação até 12h antes do início da diária. Depois disso o botão fica cinza e não dá mais para desfazer.",
  "Mantenha sua chave Pix correta em 'Editar dados'. O pagamento vai para a chave que você informar — a loja não se responsabiliza por chave errada.",
  "Sua nota (e a nota das lojas) só aparece depois de 10 avaliações, para ser justa.",
  "Trate todos com respeito e trabalhe em equipe — isso conta muito na sua avaliação.",
];

const SABORES = [
  "Mussarela",
  "Calabresa",
  "Portuguesa",
  "Frango com catupiry",
  "Margherita",
  "Quatro queijos",
  "Bacon",
  "Pepperoni",
  "Marguerita",
  "Chocolate (doce)",
  "Banana com canela (doce)",
];

export default async function GuiaPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  await exigirDiarista(token);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Sabores e orientações</h1>
        <p className="text-sm text-gray-500">Guia rápido do diarista</p>
      </div>

      <section>
          <h2 className="mb-2 font-semibold text-gray-900">Orientações importantes</h2>
          <ul className="space-y-2">
            {ORIENTACOES.map((o, i) => (
              <li
                key={i}
                className="flex gap-2 rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-700"
              >
                <span className="font-bold text-orange-600">{i + 1}.</span>
                <span>{o}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-1 font-semibold text-gray-900">Sabores (cardápio)</h2>
          <p className="mb-2 text-xs text-gray-400">
            Lista de referência. A loja confirma os sabores e a montagem no local.
          </p>
          <div className="flex flex-wrap gap-2">
            {SABORES.map((s) => (
              <span
                key={s}
                className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-sm font-medium text-orange-800"
              >
                🍕 {s}
              </span>
            ))}
          </div>
        </section>

        <Link
          href={`/d/${token}`}
          className="block rounded-xl bg-orange-600 px-4 py-3 text-center font-semibold text-white hover:bg-orange-700"
        >
          Voltar para minha agenda
        </Link>
    </div>
  );
}
