import type { Metadata } from "next";
import Link from "next/link";
import { Card, Secao, TituloSecao } from "@/components/site/ui";
import { CONTATO } from "@/lib/site/dados";

export const metadata: Metadata = {
  title: "Fale conosco",
  description: "Canais de contato da Rede RWP para clientes, futuros franqueados, colaboradores e fornecedores.",
};

const CANAIS = [
  {
    titulo: "Quero pedir uma pizza",
    texto: "Encontre a unidade mais perto e peça pelo canal preferido.",
    href: "/site/encontrar",
    cta: "Encontrar pizzaria",
    interno: true,
  },
  {
    titulo: "Quero ser franqueado",
    texto: "Fale com a equipe de expansão e receba uma proposta.",
    href: "/site/franqueado",
    cta: "Quero ser franqueado",
    interno: true,
  },
  {
    titulo: "Sou franqueado ou colaborador",
    texto: "Acesse o portal de gestão da rede.",
    href: "/entrar",
    cta: "Entrar no portal",
    interno: true,
  },
  {
    titulo: "Sou fornecedor",
    texto: "Envie sua proposta para a equipe de compras.",
    href: `mailto:${CONTATO.email}?subject=Proposta de fornecedor`,
    cta: "Enviar proposta",
    interno: false,
  },
];

export default function ContatoPage() {
  return (
    <>
      <Secao tom="escura">
        <TituloSecao
          nivel={1}
          tom="escura"
          sobrescrito="Fale conosco"
          titulo="Escolha o canal certo e a gente responde"
          descricao="Para cada objetivo há um caminho direto — sem formulário genérico que não chega a lugar nenhum."
        />
      </Secao>

      <Secao tom="clara">
        <ul className="grid gap-5 sm:grid-cols-2">
          {CANAIS.map((c) => (
            <Card as="li" key={c.titulo} className="flex flex-col">
              <h2 className="rwp-display text-lg">{c.titulo}</h2>
              <p className="mt-2 flex-1 text-[var(--rwp-on-light-muted)]">{c.texto}</p>
              <div className="mt-4">
                {c.interno ? (
                  <Link
                    href={c.href}
                    className="rwp-tap inline-flex items-center rounded-full bg-[var(--rwp-orange)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--rwp-orange-strong)]"
                  >
                    {c.cta}
                  </Link>
                ) : (
                  <a
                    href={c.href}
                    className="rwp-tap inline-flex items-center rounded-full bg-[var(--rwp-orange)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--rwp-orange-strong)]"
                  >
                    {c.cta}
                  </a>
                )}
              </div>
            </Card>
          ))}
        </ul>
      </Secao>

      <Secao tom="cinza">
        <TituloSecao titulo="Contatos gerais" />
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Card>
            <p className="text-sm font-semibold">Telefone / WhatsApp</p>
            <a className="mt-1 block text-[var(--rwp-orange-strong)] underline" href={`tel:${CONTATO.telefoneLink}`}>
              {CONTATO.telefone}
            </a>
          </Card>
          <Card>
            <p className="text-sm font-semibold">E-mail</p>
            <a className="mt-1 block text-[var(--rwp-orange-strong)] underline" href={`mailto:${CONTATO.email}`}>
              {CONTATO.email}
            </a>
          </Card>
          <Card>
            <p className="text-sm font-semibold">Sede</p>
            <p className="mt-1 text-[var(--rwp-on-light-muted)]">{CONTATO.cidadeSede}</p>
            <p className="text-xs text-[var(--rwp-on-light-muted)]">{CONTATO.razaoSocial}</p>
          </Card>
        </div>
      </Secao>
    </>
  );
}
