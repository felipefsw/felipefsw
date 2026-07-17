import type { Metadata } from "next";
import { BotaoLink, Secao, TituloSecao } from "@/components/site/ui";
import { MARCAS } from "@/lib/site/dados";

export const metadata: Metadata = {
  title: "Nossas marcas",
  description:
    "As quatro marcas de pizza da Rede RWP: Pizza Pizza, Rei da Pizza, We Love Pizza e Royal Pizza.",
};

export default function MarcasPage() {
  return (
    <>
      <Secao tom="escura">
        <TituloSecao
          nivel={1}
          tom="escura"
          sobrescrito="Nossas marcas"
          titulo="Uma rede, quatro jeitos de amar pizza"
          descricao="Cada marca atende um público e uma ocasião. Todas compartilham o mesmo padrão de operação, compras e gestão da Rede RWP."
        />
      </Secao>

      <Secao tom="clara">
        <ul className="grid gap-6 sm:grid-cols-2">
          {MARCAS.map((m) => (
            <li
              key={m.slug}
              id={m.slug}
              className="scroll-mt-24 rounded-2xl border border-[var(--rwp-line)] bg-[var(--rwp-surface)] p-6 shadow-sm"
            >
              <div className="flex items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.logo} alt={`Logo ${m.nome}`} className="h-16 w-16 rounded-xl" />
                <h2 className="rwp-display text-2xl">{m.nome}</h2>
              </div>
              <p className="mt-4 text-[var(--rwp-on-light-muted)]">{m.descricao}</p>
              <div className="mt-5">
                <BotaoLink href={`/site/encontrar?marca=${m.slug}`} variante="fantasma">
                  Encontrar {m.nome}
                </BotaoLink>
              </div>
            </li>
          ))}
        </ul>
      </Secao>

      <Secao tom="cinza">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TituloSecao
            titulo="Quer levar uma dessas marcas para a sua cidade?"
            descricao="Conheça o modelo de franquia e o suporte da rede."
          />
          <BotaoLink href="/site/franqueado" variante="primaria">
            Quero ser franqueado
          </BotaoLink>
        </div>
      </Secao>
    </>
  );
}
