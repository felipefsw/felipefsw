import type { Metadata } from "next";
import { Card, Secao, TituloSecao } from "@/components/site/ui";
import FormFranqueado from "@/components/site/FormFranqueado";

export const metadata: Metadata = {
  title: "Seja franqueado",
  description:
    "Abra uma pizzaria da Rede RWP: modelo validado, Centro de Distribuição próprio, consultoria de gestão e suporte de ponta a ponta.",
};

const MOTIVOS = [
  {
    titulo: "Marca validada",
    texto: "Quatro marcas testadas em mercado, cada uma para um público e um formato de loja.",
  },
  {
    titulo: "Compras centralizadas",
    texto: "Centro de Distribuição próprio: melhor custo, padrão de insumo e reposição inteligente.",
  },
  {
    titulo: "Consultoria de gestão",
    texto: "Você não fica sozinho: cockpit diário, indicadores explicáveis e planos de ação acompanhados.",
  },
  {
    titulo: "Operação digital",
    texto: "Portal com financeiro, estoque, pessoas, ponto, iFood e segurança dos alimentos integrados.",
  },
];

const PASSOS = [
  { n: 1, titulo: "Você demonstra interesse", texto: "Preenche o formulário e a equipe de expansão entra em contato." },
  { n: 2, titulo: "Conversa e viabilidade", texto: "Avaliamos juntos a cidade, o ponto, a marca ideal e o investimento." },
  { n: 3, titulo: "Formalização", texto: "Contrato, projeto da loja e plano de implantação com cronograma claro." },
  { n: 4, titulo: "Abertura assistida", texto: "Treinamento da equipe, ativação dos sistemas e acompanhamento nos primeiros meses." },
];

export default function FranqueadoPage() {
  return (
    <>
      <Secao tom="escura">
        <TituloSecao
          tom="escura"
          sobrescrito="Seja franqueado"
          titulo="Abra uma pizzaria com uma rede que já sabe gerir"
          descricao="Você entra com a energia do dono. A Rede RWP entra com marca, compras, tecnologia e um método de gestão que acompanha a sua loja de perto."
        />
      </Secao>

      <Secao tom="clara">
        <TituloSecao titulo="Por que franquear com a RWP" />
        <ul className="mt-8 grid gap-5 sm:grid-cols-2">
          {MOTIVOS.map((m) => (
            <Card as="li" key={m.titulo}>
              <h3 className="rwp-display text-lg">{m.titulo}</h3>
              <p className="mt-2 text-[var(--rwp-on-light-muted)]">{m.texto}</p>
            </Card>
          ))}
        </ul>
      </Secao>

      <Secao tom="cinza">
        <TituloSecao titulo="Como funciona, do interesse à inauguração" />
        <ol className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PASSOS.map((p) => (
            <li key={p.n} className="rounded-2xl border border-[var(--rwp-line)] bg-white p-6 shadow-sm">
              <span className="rwp-display text-3xl text-[var(--rwp-orange)]">{p.n}</span>
              <h3 className="rwp-display mt-2 text-lg">{p.titulo}</h3>
              <p className="mt-2 text-sm text-[var(--rwp-on-light-muted)]">{p.texto}</p>
            </li>
          ))}
        </ol>
      </Secao>

      <Secao tom="clara" id="interesse">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <TituloSecao
            titulo="Quero receber uma proposta"
            descricao="Preencha e a equipe de expansão fala com você. Leva menos de 1 minuto."
          />
          <div className="rounded-2xl border border-[var(--rwp-line)] bg-white p-6 shadow-sm">
            <FormFranqueado />
          </div>
        </div>
      </Secao>
    </>
  );
}
