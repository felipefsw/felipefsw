/*
  Primitivas de UI do site público. Um único conjunto de componentes com
  variantes semânticas consistentes (resolve o achado da auditoria "cores de
  botões variam sem semântica"). Tudo com foco visível e alvo de toque >= 44px.
*/
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variante = "primaria" | "secundaria" | "fantasma" | "clara";

const BASE =
  "rwp-tap inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold no-underline transition-colors";

const VARIANTES: Record<Variante, string> = {
  // Ação principal: laranja da marca, texto branco (contraste AA).
  primaria: "bg-[var(--rwp-orange)] text-white hover:bg-[var(--rwp-orange-strong)]",
  // Ação secundária sobre fundo escuro: contorno claro.
  secundaria: "border border-white/40 text-white hover:bg-white/10",
  // Ação terciária sobre fundo claro.
  fantasma: "border border-[var(--rwp-line)] text-[var(--rwp-on-light)] hover:bg-[var(--rwp-surface-2)]",
  // Botão claro sobre fundo escuro.
  clara: "bg-white text-[var(--rwp-ink)] hover:bg-[var(--rwp-surface-2)]",
};

export function BotaoLink({
  href,
  variante = "primaria",
  children,
  className = "",
  ...rest
}: {
  href: string;
  variante?: Variante;
  children: ReactNode;
  className?: string;
} & Omit<ComponentProps<typeof Link>, "href" | "className">) {
  const externo = href.startsWith("http");
  if (externo) {
    return (
      <a href={href} className={`${BASE} ${VARIANTES[variante]} ${className}`} {...(rest as ComponentProps<"a">)}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={`${BASE} ${VARIANTES[variante]} ${className}`} {...rest}>
      {children}
    </Link>
  );
}

export function Botao({
  variante = "primaria",
  children,
  className = "",
  ...rest
}: {
  variante?: Variante;
  children: ReactNode;
  className?: string;
} & ComponentProps<"button">) {
  return (
    <button className={`${BASE} ${VARIANTES[variante]} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function Secao({
  children,
  className = "",
  tom = "clara",
  id,
}: {
  children: ReactNode;
  className?: string;
  tom?: "clara" | "cinza" | "escura";
  id?: string;
}) {
  const fundo =
    tom === "escura"
      ? "bg-[var(--rwp-ink)] text-[var(--rwp-on-dark)]"
      : tom === "cinza"
        ? "bg-[var(--rwp-surface-2)]"
        : "bg-[var(--rwp-surface)]";
  return (
    <section id={id} className={`${fundo} ${className}`}>
      <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:py-20">{children}</div>
    </section>
  );
}

export function Card({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "article" | "li";
}) {
  return (
    <Tag
      className={`rounded-2xl border border-[var(--rwp-line)] bg-[var(--rwp-surface)] p-6 shadow-sm ${className}`}
    >
      {children}
    </Tag>
  );
}

// Rótulo de estado/etiqueta — sempre com texto, nunca só cor.
export function Etiqueta({
  children,
  tom = "neutra",
}: {
  children: ReactNode;
  tom?: "neutra" | "marca" | "risco" | "sucesso";
}) {
  const cores: Record<string, string> = {
    neutra: "bg-[var(--rwp-surface-2)] text-[var(--rwp-on-light-muted)]",
    marca: "bg-[var(--rwp-orange)]/10 text-[var(--rwp-orange-strong)]",
    risco: "bg-red-50 text-[var(--rwp-risk)]",
    sucesso: "bg-green-50 text-[var(--rwp-success)]",
  };
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${cores[tom]}`}>
      {children}
    </span>
  );
}

export function TituloSecao({
  sobrescrito,
  titulo,
  descricao,
  tom = "clara",
}: {
  sobrescrito?: string;
  titulo: string;
  descricao?: string;
  tom?: "clara" | "escura";
}) {
  const corTexto = tom === "escura" ? "text-[var(--rwp-on-dark-muted)]" : "text-[var(--rwp-on-light-muted)]";
  return (
    <div className="max-w-2xl">
      {sobrescrito && (
        <p className={`rwp-display mb-2 text-xs tracking-[0.2em] text-[var(--rwp-orange)]`}>{sobrescrito}</p>
      )}
      <h2 className="rwp-display text-3xl sm:text-4xl">{titulo}</h2>
      {descricao && <p className={`mt-3 text-base ${corTexto}`}>{descricao}</p>}
    </div>
  );
}
