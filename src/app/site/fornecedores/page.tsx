import type { Metadata } from "next";
import { BotaoLink, Card, Secao, TituloSecao } from "@/components/site/ui";
import { CONTATO } from "@/lib/site/dados";

export const metadata: Metadata = {
  title: "Fornecedores e parceiros",
  description:
    "Seja fornecedor da Rede RWP: compras centralizadas no Centro de Distribuição, escala nas quatro marcas e processo de homologação transparente.",
};

const VANTAGENS = [
  { titulo: "Escala real", texto: "Um único relacionamento atende as quatro marcas e todas as unidades da rede." },
  { titulo: "Compras centralizadas", texto: "Negociação e logística pelo Centro de Distribuição próprio da RWP." },
  { titulo: "Processo claro", texto: "Homologação, pedidos e pagamentos com regras e prazos definidos." },
];

export default function FornecedoresPage() {
  return (
    <>
      <Secao tom="escura">
        <TituloSecao
          nivel={1}
          tom="escura"
          sobrescrito="Fornecedores e parceiros"
          titulo="Cresça junto com a rede"
          descricao="Buscamos fornecedores de insumos, embalagens, equipamentos e serviços que queiram atender uma rede de pizzarias em expansão, com padrão e volume."
        />
      </Secao>

      <Secao tom="clara">
        <ul className="grid gap-5 sm:grid-cols-3">
          {VANTAGENS.map((v) => (
            <Card as="li" key={v.titulo}>
              <h3 className="rwp-display text-lg">{v.titulo}</h3>
              <p className="mt-2 text-[var(--rwp-on-light-muted)]">{v.texto}</p>
            </Card>
          ))}
        </ul>
      </Secao>

      <Secao tom="cinza">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <TituloSecao
            titulo="Quer fornecer para a Rede RWP?"
            descricao="Envie sua apresentação e portfólio. A equipe de compras retorna com os próximos passos da homologação."
          />
          <Card>
            <p className="text-sm font-semibold">Contato de compras</p>
            <ul className="mt-3 space-y-2 text-[var(--rwp-on-light-muted)]">
              <li>
                <a className="underline hover:text-[var(--rwp-orange-strong)]" href={`mailto:${CONTATO.email}?subject=Proposta de fornecedor`}>
                  {CONTATO.email}
                </a>
              </li>
              <li>
                <a className="underline hover:text-[var(--rwp-orange-strong)]" href={`tel:${CONTATO.telefoneLink}`}>
                  {CONTATO.telefone}
                </a>
              </li>
            </ul>
            <div className="mt-5">
              <BotaoLink href={`mailto:${CONTATO.email}?subject=Proposta de fornecedor`} variante="primaria">
                Enviar proposta
              </BotaoLink>
            </div>
          </Card>
        </div>
      </Secao>
    </>
  );
}
