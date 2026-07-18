import Link from "next/link";

const TELAS = [
  {
    href: "/site/portal/cockpit",
    titulo: "Cockpit Diário da Loja",
    texto: "A tela “Hoje”: o que exige atenção agora — vendas, canal, equipe, ruptura e as 5 ações prioritárias.",
  },
  {
    href: "/site/portal/termometro",
    titulo: "Termômetro Explicável 2.0",
    texto: "A nota de saúde decomposta por dimensão, com meta, tendência, causa, fonte e confiança do dado.",
  },
  {
    href: "/site/portal/ifood",
    titulo: "Operação iFood Segura",
    texto: "A rotina do dia (Agora, Pedidos, Cardápio, Avaliações) separada da administração técnica e com ambiente sempre explícito.",
  },
];

export default function PortalIntro() {
  return (
    <div>
      <h1 className="rwp-display text-3xl">Prévia do portal</h1>
      <p className="mt-3 max-w-2xl text-[var(--rwp-on-light-muted)]">
        Estas duas telas mostram a direção de produto que a auditoria marcou como crítica: sair de
        uma coleção de módulos para uma gestão por prioridade, com dados confiáveis e cada sinal
        virando ação acompanhada. Escolha a loja e o período na barra de contexto acima — a seleção
        segue entre as telas.
      </p>

      <ul className="mt-8 grid gap-5 sm:grid-cols-2">
        {TELAS.map((t) => (
          <li key={t.href}>
            <Link
              href={t.href}
              className="group flex h-full flex-col rounded-2xl border border-[var(--rwp-line)] bg-white p-6 transition-colors hover:border-[var(--rwp-orange)]"
            >
              <h2 className="rwp-display text-xl">{t.titulo}</h2>
              <p className="mt-2 flex-1 text-[var(--rwp-on-light-muted)]">{t.texto}</p>
              <span className="mt-4 inline-flex items-center gap-1 font-semibold text-[var(--rwp-orange-strong)]">
                Abrir tela
                <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
