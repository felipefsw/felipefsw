/*
  Rodapé do site público. Reúne os quatro caminhos por público, contato e o
  aviso institucional. Textos revisados (a auditoria apontou erros como
  "Hiostoria", "Essencia", "Proxima", "Funcionarios" no site atual).
*/
import Link from "next/link";
import { CONTATO, MARCAS } from "@/lib/site/dados";

const ANO = 2026;

export default function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[var(--rwp-ink)] text-[var(--rwp-on-dark)]">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/rwp-logo.svg" alt="" className="h-9 w-auto" />
            <span className="rwp-display text-lg">Rede RWP</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-[var(--rwp-on-dark-muted)]">
            Rede de pizzarias e ecossistema de gestão para franqueados, gerentes e consultores.
          </p>
        </div>

        <nav aria-label="Para clientes">
          <h2 className="rwp-display text-sm text-[var(--rwp-orange)]">Para clientes</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link className="text-[var(--rwp-on-dark-muted)] hover:text-white" href="/site/encontrar">Encontrar pizzaria</Link></li>
            <li><Link className="text-[var(--rwp-on-dark-muted)] hover:text-white" href="/site/marcas">Nossas marcas</Link></li>
            <li><Link className="text-[var(--rwp-on-dark-muted)] hover:text-white" href="/site/sobre">Nossa história</Link></li>
          </ul>
        </nav>

        <nav aria-label="Para negócios">
          <h2 className="rwp-display text-sm text-[var(--rwp-orange)]">Para negócios</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link className="text-[var(--rwp-on-dark-muted)] hover:text-white" href="/site/franqueado">Seja franqueado</Link></li>
            <li><Link className="text-[var(--rwp-on-dark-muted)] hover:text-white" href="/site/para-franqueados">Para franqueados</Link></li>
            <li><Link className="text-[var(--rwp-on-dark-muted)] hover:text-white" href="/site/fornecedores">Fornecedores e parceiros</Link></li>
            <li><Link className="text-[var(--rwp-on-dark-muted)] hover:text-white" href="/entrar">Entrar no portal</Link></li>
          </ul>
        </nav>

        <div>
          <h2 className="rwp-display text-sm text-[var(--rwp-orange)]">Contato</h2>
          <ul className="mt-3 space-y-2 text-sm text-[var(--rwp-on-dark-muted)]">
            <li>
              <a className="hover:text-white" href={`tel:${CONTATO.telefoneLink}`}>{CONTATO.telefone}</a>
            </li>
            <li>
              <a className="hover:text-white" href={`mailto:${CONTATO.email}`}>{CONTATO.email}</a>
            </li>
            <li>{CONTATO.cidadeSede}</li>
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            {MARCAS.map((m) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={m.slug} src={m.logo} alt={m.nome} title={m.nome} className="h-7 w-7 rounded-md" />
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-5 py-6 text-xs text-[var(--rwp-on-dark-muted)] sm:flex-row sm:items-center sm:justify-between">
          <p>© {ANO} {CONTATO.razaoSocial} Todos os direitos reservados.</p>
          <div className="flex gap-4">
            <Link className="hover:text-white" href="/site/privacidade">Política de privacidade</Link>
            <Link className="hover:text-white" href="/site/contato">Fale conosco</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
