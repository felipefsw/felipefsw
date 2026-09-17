import { CardPainel, botaoSecundario } from "@/components/painel/ui";
import { sairDoPainel } from "../entrar/actions";

export default function SemAcessoPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <CardPainel>
        <h1 className="text-xl font-bold">Sem loja liberada</h1>
        <p className="mt-2 text-sm text-[var(--painel-texto-fraco)]">
          Seu usuário existe, mas ainda não foi ligado a nenhuma loja. Peça para o
          administrador da rede liberar o acesso em <strong>Admin › Usuários</strong>.
        </p>
        <form action={sairDoPainel} className="mt-4">
          <button type="submit" className={botaoSecundario}>
            Sair
          </button>
        </form>
      </CardPainel>
    </main>
  );
}
