import type { Metadata } from "next";
import { BotaoLink, Card, Etiqueta, Secao, TituloSecao } from "@/components/site/ui";
import { CICLO, FERRAMENTAS_DESTAQUE, PACOTES } from "@/lib/site/consultoria";

export const metadata: Metadata = {
  title: "Para franqueados",
  description:
    "A consultoria da Rede RWP: método em ciclo fechado (sinal → causa → ação → evidência → resultado), ferramentas nativas e pacotes por objetivo.",
};

export default function ParaFranqueadosPage() {
  return (
    <>
      <Secao tom="escura">
        <TituloSecao
          nivel={1}
          tom="escura"
          sobrescrito="Para franqueados"
          titulo="Consultoria que mostra o desvio, explica a causa e acompanha a correção"
          descricao="O portal da RWP não entrega apenas gráficos e PDFs. Entrega um método: cada sinal vira uma ação com dono, prazo, evidência e verificação de resultado."
        />
        <div className="mt-8">
          <BotaoLink href="/entrar" variante="clara">
            Acessar o portal
          </BotaoLink>
        </div>
      </Secao>

      {/* O CICLO FECHADO — o diferencial. */}
      <Secao tom="clara">
        <TituloSecao
          sobrescrito="O método"
          titulo="Do sinal ao resultado, sem pontas soltas"
          descricao="Nenhuma ferramenta termina em um número solto. Ela empurra a próxima etapa até o problema ser resolvido e o benefício ser medido."
        />
        <ol className="mt-10 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {CICLO.map((etapa, i) => (
            <li key={etapa.titulo} className="rounded-2xl border border-[var(--rwp-line)] bg-white p-5 shadow-sm">
              <span className="rwp-display text-3xl text-[var(--rwp-orange)]">{i + 1}</span>
              <h3 className="rwp-display mt-2 text-base">{etapa.titulo}</h3>
              <p className="mt-2 text-sm text-[var(--rwp-on-light-muted)]">{etapa.texto}</p>
            </li>
          ))}
        </ol>
      </Secao>

      {/* FERRAMENTAS EM DESTAQUE. */}
      <Secao tom="cinza">
        <TituloSecao
          sobrescrito="Ferramentas"
          titulo="As peças que sustentam a gestão da sua loja"
          descricao="Uma seleção do que a rede oferece. Tudo integrado ao mesmo cadastro de lojas, com dados confiáveis e permissões por papel."
        />
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FERRAMENTAS_DESTAQUE.map((f) => (
            <Card as="li" key={f.nome}>
              <h3 className="rwp-display text-lg">{f.nome}</h3>
              <p className="mt-2 text-sm text-[var(--rwp-on-light-muted)]">{f.entrega}</p>
            </Card>
          ))}
        </ul>
      </Secao>

      {/* PACOTES COMERCIAIS. */}
      <Secao tom="clara">
        <TituloSecao
          sobrescrito="Pacotes"
          titulo="Escolha pelo resultado que você quer primeiro"
          descricao="Cada pacote inclui implantação, treinamento, ritual de acompanhamento e relatório de benefício — não apenas o acesso às telas."
        />
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PACOTES.map((p) => (
            <Card as="li" key={p.slug} className="flex flex-col">
              <h3 className="rwp-display text-xl">{p.nome}</h3>
              <p className="mt-2 text-[var(--rwp-on-light-muted)]">{p.promessa}</p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {p.inclui.map((item) => (
                  <li key={item}>
                    <Etiqueta tom="marca">{item}</Etiqueta>
                  </li>
                ))}
              </ul>
              <p className="mt-4 border-t border-[var(--rwp-line)] pt-3 text-xs text-[var(--rwp-on-light-muted)]">
                <span className="font-semibold text-[var(--rwp-on-light)]">Ritmo:</span> {p.ritmo}
              </p>
            </Card>
          ))}
        </ul>
        <p className="mt-8 max-w-2xl text-sm text-[var(--rwp-on-light-muted)]">
          Promessas de retorno são feitas só após uma linha de base e pilotos controlados. O contrato
          deixa claro o que é software, integração, serviço e custo de terceiros.
        </p>
      </Secao>

      <Secao tom="escura">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TituloSecao
            tom="escura"
            titulo="Pronto para colocar a loja sob controle?"
            descricao="Fale com a consultoria e monte o pacote certo para o seu momento."
          />
          <div className="flex flex-wrap gap-3">
            <BotaoLink href="/site/contato" variante="primaria">
              Falar com a consultoria
            </BotaoLink>
            <BotaoLink href="/entrar" variante="secundaria">
              Já sou cliente
            </BotaoLink>
          </div>
        </div>
      </Secao>
    </>
  );
}
