import type { Metadata } from "next";
import { Secao, TituloSecao } from "@/components/site/ui";
import Localizador from "@/components/site/Localizador";

export const metadata: Metadata = {
  title: "Encontrar pizzaria",
  description: "Encontre a pizzaria da Rede RWP mais perto de você e peça pelo seu canal preferido.",
};

export default async function EncontrarPage({
  searchParams,
}: {
  searchParams: Promise<{ marca?: string }>;
}) {
  const { marca = "" } = await searchParams;

  return (
    <>
      <Secao tom="escura" className="!py-12">
        <TituloSecao
          tom="escura"
          sobrescrito="Encontrar pizzaria"
          titulo="Onde tem pizza da rede pertinho de você"
          descricao="Filtre por marca e cidade. Achou a sua? É só tocar em “Como chegar” e pedir."
        />
      </Secao>
      <Secao tom="cinza">
        <Localizador marcaInicial={marca} />
        <p className="mt-8 max-w-2xl text-xs text-[var(--rwp-on-light-muted)]">
          As unidades listadas são uma amostra de demonstração. A lista completa e atualizada da
          rede será integrada em breve.
        </p>
      </Secao>
    </>
  );
}
