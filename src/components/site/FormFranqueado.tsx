"use client";

/*
  Formulário de interesse em franquia. A auditoria pediu para UNIFICAR a jornada
  de franquia (o site atual tinha links com destinos diferentes). Aqui há um
  único caminho: o lead preenche e envia por WhatsApp (canal direto com a rede),
  com os dados já formatados. Campos rotulados e validação nativa (acessível).
*/
import { useState } from "react";
import { CONTATO } from "@/lib/site/dados";

export default function FormFranqueado() {
  const [enviado, setEnviado] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const dados = new FormData(e.currentTarget);
    const linhas = [
      "Olá! Tenho interesse em ser franqueado da Rede RWP.",
      `Nome: ${dados.get("nome")}`,
      `Cidade/UF de interesse: ${dados.get("cidade")}`,
      `Telefone: ${dados.get("telefone")}`,
      `E-mail: ${dados.get("email")}`,
      `Já tem ponto comercial? ${dados.get("ponto")}`,
      `Capital disponível: ${dados.get("capital")}`,
    ];
    const url = `https://wa.me/${CONTATO.telefoneLink.replace("+", "")}?text=${encodeURIComponent(
      linhas.join("\n"),
    )}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setEnviado(true);
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo id="nome" rotulo="Nome completo" required />
        <Campo id="cidade" rotulo="Cidade / UF de interesse" required />
        <Campo id="telefone" rotulo="Telefone / WhatsApp" type="tel" required />
        <Campo id="email" rotulo="E-mail" type="email" required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="ponto" className="text-sm font-semibold">
            Já tem ponto comercial?
          </label>
          <select
            id="ponto"
            name="ponto"
            className="rwp-tap rounded-lg border border-[var(--rwp-line)] bg-white px-3 text-base"
          >
            <option>Ainda não</option>
            <option>Sim, já tenho o ponto</option>
            <option>Estou avaliando opções</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="capital" className="text-sm font-semibold">
            Capital disponível para investir
          </label>
          <select
            id="capital"
            name="capital"
            className="rwp-tap rounded-lg border border-[var(--rwp-line)] bg-white px-3 text-base"
          >
            <option>Até R$ 150 mil</option>
            <option>R$ 150 mil a R$ 300 mil</option>
            <option>Acima de R$ 300 mil</option>
          </select>
        </div>
      </div>

      <button
        type="submit"
        className="rwp-tap inline-flex items-center justify-center gap-2 rounded-full bg-[var(--rwp-orange)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--rwp-orange-strong)]"
      >
        Enviar interesse pelo WhatsApp
      </button>

      {enviado && (
        <p
          role="status"
          className="rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-[var(--rwp-success)]"
        >
          Abrimos o WhatsApp com seus dados. Se não abriu, fale direto no {CONTATO.telefone}.
        </p>
      )}
      <p className="text-xs text-[var(--rwp-on-light-muted)]">
        Ao enviar, você concorda em ser contatado pela equipe de expansão da rede. Seus dados são
        usados apenas para este atendimento.
      </p>
    </form>
  );
}

function Campo({
  id,
  rotulo,
  type = "text",
  required,
}: {
  id: string;
  rotulo: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-semibold">
        {rotulo} {required && <span className="text-[var(--rwp-risk)]">*</span>}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        required={required}
        className="rwp-tap rounded-lg border border-[var(--rwp-line)] bg-white px-3 text-base"
      />
    </div>
  );
}
