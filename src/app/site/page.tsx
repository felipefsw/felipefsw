import Link from "next/link";
import { BotaoLink, Secao, TituloSecao } from "@/components/site/ui";
import { CICLO } from "@/lib/site/consultoria";
import { MARCAS } from "@/lib/site/dados";

// A home é um ROTEADOR simples: proposta objetiva + uma ação primária, e quatro
// caminhos por público. Conteúdo institucional profundo mora nas páginas certas.
const CAMINHOS = [
  {
    href: "/site/encontrar",
    emoji: "📍",
    titulo: "Quero pedir uma pizza",
    texto: "Encontre a pizzaria da rede mais perto de você e peça pelo seu canal preferido.",
    cta: "Encontrar pizzaria",
  },
  {
    href: "/site/franqueado",
    emoji: "🚀",
    titulo: "Quero ser franqueado",
    texto: "Conheça o modelo de negócio, o suporte da rede e como abrir a sua unidade.",
    cta: "Ver como funciona",
  },
  {
    href: "/entrar",
    emoji: "🔑",
    titulo: "Sou franqueado ou colaborador",
    texto: "Acesse o portal de gestão: operação, financeiro, pessoas, iFood e consultoria.",
    cta: "Entrar no portal",
  },
  {
    href: "/site/fornecedores",
    emoji: "🤝",
    titulo: "Sou fornecedor ou parceiro",
    texto: "Saiba como fornecer para o Centro de Distribuição e as marcas da rede.",
    cta: "Falar com a rede",
  },
];

export default function HomeSite() {
  return (
    <>
      {/* HERO — proposta objetiva + uma ação primária. */}
      <section className="bg-[var(--rwp-ink)] text-[var(--rwp-on-dark)]">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-16 sm:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="rwp-display text-sm tracking-[0.25em] text-[var(--rwp-orange)]">
              Rede RWP · Franchising
            </p>
            <h1 className="rwp-display mt-3 text-4xl sm:text-6xl">
              Quatro marcas de pizza. Uma rede que sabe gerir.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-[var(--rwp-on-dark-muted)]">
              Do balcão ao delivery, a Rede RWP une pizzarias de sucesso a um ecossistema de
              gestão que transforma dados em ação — para o cliente, para o franqueado e para o
              consultor.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <BotaoLink href="/site/encontrar" variante="primaria">
                Encontrar pizzaria
              </BotaoLink>
              <BotaoLink href="/site/franqueado" variante="secundaria">
                Quero ser franqueado
              </BotaoLink>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {MARCAS.map((m) => (
              <Link
                key={m.slug}
                href={`/site/marcas#${m.slug}`}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.logo} alt="" className="h-11 w-11 shrink-0 rounded-lg" />
                <span className="rwp-display text-sm leading-tight">{m.nome}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* QUATRO CAMINHOS por público. */}
      <Secao tom="clara">
        <TituloSecao
          sobrescrito="Por onde começar"
          titulo="O que você procura hoje?"
          descricao="Escolha o caminho e a gente te leva direto ao ponto — sem menu gigante para decifrar."
        />
        <ul className="mt-10 grid gap-5 sm:grid-cols-2">
          {CAMINHOS.map((c) => (
            <li key={c.href}>
              <Link
                href={c.href}
                className="group flex h-full flex-col rounded-2xl border border-[var(--rwp-line)] bg-[var(--rwp-surface)] p-6 shadow-sm transition-colors hover:border-[var(--rwp-orange)]"
              >
                <span className="text-3xl" aria-hidden>
                  {c.emoji}
                </span>
                <h3 className="rwp-display mt-3 text-xl">{c.titulo}</h3>
                <p className="mt-2 flex-1 text-[var(--rwp-on-light-muted)]">{c.texto}</p>
                <span className="mt-4 inline-flex items-center gap-1 font-semibold text-[var(--rwp-orange-strong)]">
                  {c.cta}
                  <span aria-hidden className="transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Secao>

      {/* DIFERENCIAL da consultoria — o método em ciclo fechado. */}
      <Secao tom="escura">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <TituloSecao
            tom="escura"
            sobrescrito="Para franqueados"
            titulo="Não vendemos telas. Entregamos resultado acompanhado."
            descricao="A consultoria da Rede RWP fecha o ciclo: o sinal vira causa, a causa vira ação com dono e prazo, a ação gera evidência e o resultado é medido."
          />
          <ol className="grid gap-3 sm:grid-cols-5">
            {CICLO.map((etapa, i) => (
              <li
                key={etapa.titulo}
                className="rounded-xl border border-white/10 bg-white/5 p-4"
              >
                <span className="rwp-display text-2xl text-[var(--rwp-orange)]">{i + 1}</span>
                <h3 className="rwp-display mt-1 text-sm">{etapa.titulo}</h3>
                <p className="mt-1 text-xs text-[var(--rwp-on-dark-muted)]">{etapa.texto}</p>
              </li>
            ))}
          </ol>
        </div>
        <div className="mt-8">
          <BotaoLink href="/site/para-franqueados" variante="clara">
            Conhecer a consultoria
          </BotaoLink>
        </div>
      </Secao>
    </>
  );
}
