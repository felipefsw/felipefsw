import { CabecalhoPainel, superficie } from "@/components/painel/ui";
import { NOME_DO_PAPEL, lojasDoAcesso, papelNaLoja } from "@/lib/painel/papeis";
import { contextoPainel } from "@/lib/painel/sessao";
import { escolherLoja } from "./actions";

export const dynamic = "force-dynamic";

export default async function TrocarLojaPage() {
  const ctx = await contextoPainel();
  const lojas = await lojasDoAcesso(ctx.acesso);

  return (
    <>
      <CabecalhoPainel titulo="Escolha a loja" subtitulo="Você só vê as lojas liberadas para o seu usuário." />

      <ul className="space-y-2">
        {lojas.map((loja) => {
          const papel = papelNaLoja(ctx.acesso, loja.id);
          const atual = loja.id === ctx.storeId;
          return (
            <li key={loja.id}>
              <form action={escolherLoja}>
                <input type="hidden" name="storeId" value={loja.id} />
                <button
                  type="submit"
                  className={`${superficie} flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-white/5 ${
                    atual ? "border-[var(--painel-laranja)]" : ""
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-lg font-semibold">{loja.name}</span>
                    <span className="block truncate text-sm text-[var(--painel-texto-fraco)]">
                      {loja.brand?.name ?? "RWP"}
                      {papel ? ` · ${NOME_DO_PAPEL[papel]}` : ""}
                    </span>
                  </span>
                  {atual ? (
                    <span className="shrink-0 text-xs font-semibold text-[var(--painel-laranja)]">
                      aberta
                    </span>
                  ) : null}
                </button>
              </form>
            </li>
          );
        })}
      </ul>
    </>
  );
}
