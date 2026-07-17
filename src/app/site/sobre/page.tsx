import type { Metadata } from "next";
import { BotaoLink, Card, Secao, TituloSecao } from "@/components/site/ui";

export const metadata: Metadata = {
  title: "Nossa história",
  description:
    "A história e a essência da Rede RWP: como quatro marcas de pizza cresceram com padrão de operação, Centro de Distribuição próprio e cultura de gestão.",
};

// Textos revisados — a auditoria apontou erros no site atual ("Hiostoria",
// "Essencia", "Proxima", "Funcionarios").
const VALORES = [
  {
    titulo: "Padrão em toda a rede",
    texto:
      "Do preparo ao atendimento, cada unidade segue o mesmo padrão de qualidade, com inspeções e planos de ação acompanhados.",
  },
  {
    titulo: "Gestão com método",
    texto:
      "Decisão não é achismo: indicadores confiáveis, causa explicada e ação com dono, prazo e evidência.",
  },
  {
    titulo: "Gente no centro",
    texto:
      "Franqueados, gerentes, colaboradores e diaristas contam com trilhas de capacitação e ferramentas que facilitam o dia a dia.",
  },
];

export default function SobrePage() {
  return (
    <>
      <Secao tom="escura">
        <TituloSecao
          nivel={1}
          tom="escura"
          sobrescrito="Nossa história"
          titulo="Nascemos da pizza. Crescemos com gestão."
          descricao="A Rede RWP começou nas pizzarias de bairro e se transformou em um ecossistema de marcas, Centro de Distribuição próprio e um portal que gere a operação de ponta a ponta."
        />
      </Secao>

      <Secao tom="clara">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          <div>
            <h2 className="rwp-display text-2xl">A essência</h2>
            <p className="mt-4 text-[var(--rwp-on-light-muted)]">
              Acreditamos que uma boa pizza é resultado de uma boa operação. Por isso investimos
              tanto na cozinha quanto na gestão: compras centralizadas no Centro de Distribuição,
              controle de custo e desperdício, segurança dos alimentos e uma equipe bem treinada.
            </p>
            <p className="mt-4 text-[var(--rwp-on-light-muted)]">
              Esse cuidado é o que permite crescer sem perder o padrão — e é o que oferecemos, como
              método, a cada novo franqueado da rede.
            </p>
          </div>
          <ul className="grid gap-4">
            {VALORES.map((v) => (
              <Card as="li" key={v.titulo}>
                <h3 className="rwp-display text-lg">{v.titulo}</h3>
                <p className="mt-2 text-[var(--rwp-on-light-muted)]">{v.texto}</p>
              </Card>
            ))}
          </ul>
        </div>
      </Secao>

      <Secao tom="cinza">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TituloSecao
            titulo="Faça parte da próxima fase da rede"
            descricao="Seja como cliente, franqueado ou parceiro."
          />
          <div className="flex flex-wrap gap-3">
            <BotaoLink href="/site/franqueado" variante="primaria">
              Seja franqueado
            </BotaoLink>
            <BotaoLink href="/site/contato" variante="fantasma">
              Fale conosco
            </BotaoLink>
          </div>
        </div>
      </Secao>
    </>
  );
}
