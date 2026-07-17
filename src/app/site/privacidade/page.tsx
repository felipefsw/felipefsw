import type { Metadata } from "next";
import { Secao, TituloSecao } from "@/components/site/ui";
import { CONTATO } from "@/lib/site/dados";

export const metadata: Metadata = {
  title: "Política de privacidade",
  description: "Como a Rede RWP trata os dados pessoais coletados no site, conforme a LGPD.",
};

const SECOES = [
  {
    titulo: "Quais dados coletamos",
    texto:
      "No site público, coletamos apenas os dados que você nos envia voluntariamente — por exemplo, ao demonstrar interesse em uma franquia ou ao entrar em contato: nome, telefone, e-mail, cidade e informações sobre o seu interesse.",
  },
  {
    titulo: "Para que usamos",
    texto:
      "Usamos esses dados exclusivamente para responder ao seu contato e conduzir o atendimento (comercial, de expansão, de fornecimento ou de suporte). Não vendemos seus dados.",
  },
  {
    titulo: "Base legal e seus direitos",
    texto:
      "O tratamento se apoia no seu consentimento e no legítimo interesse de atendimento. Conforme a LGPD (Lei nº 13.709/2018), você pode solicitar acesso, correção ou exclusão dos seus dados a qualquer momento.",
  },
  {
    titulo: "Portal de gestão",
    texto:
      "O acesso ao portal (franqueados e colaboradores) é restrito e regido por termos próprios, com permissões por papel e trilha de auditoria das ações sensíveis.",
  },
];

export default function PrivacidadePage() {
  return (
    <>
      <Secao tom="escura" className="!py-12">
        <TituloSecao
          tom="escura"
          sobrescrito="Privacidade"
          titulo="Política de privacidade"
          descricao="Transparência sobre como tratamos os dados que você compartilha conosco."
        />
      </Secao>
      <Secao tom="clara">
        <div className="max-w-3xl">
          {SECOES.map((s) => (
            <div key={s.titulo} className="mb-8">
              <h2 className="rwp-display text-xl">{s.titulo}</h2>
              <p className="mt-2 text-[var(--rwp-on-light-muted)]">{s.texto}</p>
            </div>
          ))}
          <p className="text-sm text-[var(--rwp-on-light-muted)]">
            Dúvidas sobre privacidade? Fale com{" "}
            <a className="underline hover:text-[var(--rwp-orange-strong)]" href={`mailto:${CONTATO.email}`}>
              {CONTATO.email}
            </a>
            . Responsável: {CONTATO.razaoSocial}
          </p>
          <p className="mt-6 text-xs text-[var(--rwp-on-light-muted)]">
            Este texto é um modelo inicial e deve ser revisado pela assessoria jurídica da rede antes
            da publicação definitiva.
          </p>
        </div>
      </Secao>
    </>
  );
}
