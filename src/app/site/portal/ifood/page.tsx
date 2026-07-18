"use client";

import { useState } from "react";
import { useContexto } from "@/components/site/portal/contexto";
import { PainelCard, StatusPill } from "@/components/site/portal/ui";
import { LOJAS_DEMO } from "@/lib/site/portal";
import {
  IFOOD_ADMIN,
  IFOOD_AVALIACOES,
  IFOOD_CARDAPIO,
  IFOOD_PEDIDOS,
  IFOOD_STATUS,
} from "@/lib/site/ifood";

// Abas operacionais separadas da administração técnica (recomendação da auditoria).
const ABAS = ["Agora", "Pedidos", "Cardápio", "Avaliações", "Administração técnica"] as const;
type Aba = (typeof ABAS)[number];

export default function IfoodPage() {
  const { ctx } = useContexto();
  const loja = LOJAS_DEMO.find((l) => l.id === ctx.lojaId) ?? LOJAS_DEMO[0];
  const [aba, setAba] = useState<Aba>("Agora");
  const [modoAdmin, setModoAdmin] = useState(false);

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="rwp-display text-2xl">Operação iFood Segura</h1>
          <p className="mt-1 text-sm text-[var(--rwp-on-light-muted)]">{loja.nome}</p>
        </div>
        {/* Ambiente sempre explícito */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-[var(--rwp-on-light-muted)]">Ambiente</span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
              IFOOD_STATUS.ambiente === "Produção"
                ? "bg-[#e7f4ec] text-[#0f6b31]"
                : "bg-[#fbf1df] text-[#8a4e06]"
            }`}
          >
            {IFOOD_STATUS.ambiente === "Produção" ? "● Produção" : "▲ Homologação"}
          </span>
        </div>
      </header>

      {/* Sub-abas da tela */}
      <div className="mt-5 flex flex-wrap gap-1 border-b border-[var(--rwp-line)]">
        {ABAS.map((a) => {
          const ativo = aba === a;
          const tecnica = a === "Administração técnica";
          return (
            <button
              key={a}
              type="button"
              onClick={() => setAba(a)}
              aria-current={ativo ? "page" : undefined}
              className={`rwp-tap -mb-px rounded-t-lg border-b-2 px-3 text-sm font-semibold ${
                ativo
                  ? "border-[var(--rwp-orange)] text-[var(--rwp-on-light)]"
                  : "border-transparent text-[var(--rwp-on-light-muted)] hover:text-[var(--rwp-on-light)]"
              }`}
            >
              {tecnica ? "🔒 " : ""}
              {a}
            </button>
          );
        })}
      </div>

      <div className="mt-5">
        {aba === "Agora" && <Agora />}
        {aba === "Pedidos" && <Pedidos />}
        {aba === "Cardápio" && <Cardapio />}
        {aba === "Avaliações" && <Avaliacoes />}
        {aba === "Administração técnica" && (
          <AdminTecnica modoAdmin={modoAdmin} setModoAdmin={setModoAdmin} />
        )}
      </div>
    </div>
  );
}

function Agora() {
  const s = IFOOD_STATUS;
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
      <PainelCard titulo="Status agora">
        <div className="flex items-center gap-3">
          <StatusPill faixa={s.estado === "Aberta" ? "saudavel" : "critico"} />
          <span className="text-2xl font-bold">{s.estado}</span>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-[var(--rwp-on-light-muted)]">Horário de hoje</dt>
            <dd className="font-semibold">{s.horarioHoje}</dd>
          </div>
          <div>
            <dt className="text-[var(--rwp-on-light-muted)]">Pedidos pendentes</dt>
            <dd className="font-semibold">{s.pedidosPendentes}</dd>
          </div>
          <div>
            <dt className="text-[var(--rwp-on-light-muted)]">Integração</dt>
            <dd className="flex items-center gap-2">
              <StatusPill faixa={s.integracao === "ok" ? "saudavel" : "critico"} />
            </dd>
          </div>
        </dl>
        <div className="mt-5 flex flex-wrap gap-2">
          <button className="rwp-tap rounded-full border border-[var(--rwp-line)] px-4 text-sm font-semibold hover:bg-[var(--rwp-surface-2)]">
            Pausar loja
          </button>
          <button className="rwp-tap rounded-full border border-[var(--rwp-line)] px-4 text-sm font-semibold hover:bg-[var(--rwp-surface-2)]">
            Ajustar horário
          </button>
        </div>
        <p className="mt-3 text-xs text-[var(--rwp-on-light-muted)]">
          Ações de alto impacto mostram loja, ambiente, efeito esperado e pedem confirmação.
        </p>
      </PainelCard>

      <PainelCard titulo="Precisa de atenção">
        <div className="flex items-start gap-3 rounded-lg bg-[#fdeceb] p-3">
          <StatusPill faixa="critico" />
          <p className="text-sm text-[#b21f14]">{s.avaliacaoCritica}</p>
        </div>
        <div className="mt-3 flex items-start gap-3 rounded-lg bg-[#fbf1df] p-3">
          <StatusPill faixa="atencao" />
          <p className="text-sm text-[#8a4e06]">{s.pedidosPendentes} pedidos aguardando confirmação (ACK).</p>
        </div>
      </PainelCard>
    </div>
  );
}

function Pedidos() {
  return (
    <PainelCard titulo="Pedidos recentes">
      <ul className="divide-y divide-[var(--rwp-line)]">
        {IFOOD_PEDIDOS.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3 first:pt-0 last:pb-0">
            <span className="w-16 font-bold tabular-nums">{p.id}</span>
            <span className="w-12 text-sm text-[var(--rwp-on-light-muted)] tabular-nums">{p.horario}</span>
            <StatusPill faixa={p.statusFaixa} />
            <span className="text-sm font-medium">{p.status}</span>
            <span className="flex-1 text-sm text-[var(--rwp-on-light-muted)]">{p.tempo}</span>
            <span className="text-sm tabular-nums">
              {p.itens} itens · {p.valor}
            </span>
            {p.obs && <span className="w-full pl-16 text-xs text-[var(--rwp-on-light-muted)]">↳ {p.obs}</span>}
          </li>
        ))}
      </ul>
    </PainelCard>
  );
}

function Cardapio() {
  return (
    <div className="grid gap-5">
      {IFOOD_CARDAPIO.map((cat) => (
        <PainelCard key={cat.nome} titulo={cat.nome}>
          <ul className="divide-y divide-[var(--rwp-line)]">
            {cat.itens.map((it) => (
              <li key={it.nome} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 first:pt-0 last:pb-0">
                <span className="flex-1 text-sm font-medium">{it.nome}</span>
                <span className="text-sm tabular-nums">{it.preco}</span>
                <StatusPill faixa={it.disponivel ? "saudavel" : "critico"} />
                <span className="text-sm">{it.disponivel ? "Disponível" : "Indisponível"}</span>
                {it.alerta && <span className="w-full text-xs text-[#8a4e06]">↳ {it.alerta}</span>}
              </li>
            ))}
          </ul>
        </PainelCard>
      ))}
    </div>
  );
}

function Avaliacoes() {
  const a = IFOOD_AVALIACOES;
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1.3fr]">
      <PainelCard titulo="Reputação">
        <p className="text-4xl font-bold tabular-nums">
          {a.nota.toFixed(1)}
          <span className="text-base font-normal text-[var(--rwp-on-light-muted)]"> / 5</span>
        </p>
        <p className="mt-1 text-sm text-[var(--rwp-on-light-muted)]">{a.volume} avaliações</p>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-[var(--rwp-on-light-muted)]">Sem resposta</dt>
            <dd className="flex items-center gap-2">
              <StatusPill faixa="critico" /> {a.semResposta}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-[var(--rwp-on-light-muted)]">SLA de resposta</dt>
            <dd className="font-semibold">{a.slaResposta}</dd>
          </div>
        </dl>
      </PainelCard>

      <PainelCard titulo="Temas recorrentes">
        <ul className="space-y-2">
          {a.temas.map((t) => (
            <li key={t.tema} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2">
                <StatusPill faixa={t.faixa} />
                <span className="font-medium">{t.tema}</span>
              </span>
              <span className="tabular-nums text-[var(--rwp-on-light-muted)]">{t.mencoes} menções</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-[var(--rwp-on-light-muted)]">
          Cada tema crítico vira ação corretiva com dono e prazo (Planos e CAPA).
        </p>
      </PainelCard>
    </div>
  );
}

function AdminTecnica({
  modoAdmin,
  setModoAdmin,
}: {
  modoAdmin: boolean;
  setModoAdmin: (v: boolean) => void;
}) {
  return (
    <PainelCard titulo="🔒 Administração técnica">
      <div className="rounded-lg border border-[#f0c9c4] bg-[#fdeceb] p-4">
        <p className="text-sm font-semibold text-[#b21f14]">Acesso restrito</p>
        <p className="mt-1 text-sm text-[#b21f14]">
          Esta área tem ações de alto impacto (vínculos, OAuth, homologação e testes) e deve ficar
          visível apenas a perfis autorizados — separada da operação do dia.
        </p>
        <label className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-[#b21f14]">
          <input
            type="checkbox"
            checked={modoAdmin}
            onChange={(e) => setModoAdmin(e.target.checked)}
            className="h-4 w-4"
          />
          Sou perfil autorizado — exibir
        </label>
      </div>

      {modoAdmin && (
        <dl className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
          <div>
            <dt className="text-[var(--rwp-on-light-muted)]">Merchant ID</dt>
            <dd className="font-mono">{IFOOD_ADMIN.merchantId}</dd>
          </div>
          <div>
            <dt className="text-[var(--rwp-on-light-muted)]">OAuth</dt>
            <dd className="flex items-center gap-2">
              <StatusPill faixa="saudavel" /> {IFOOD_ADMIN.oauth.detalhe}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--rwp-on-light-muted)]">Homologação</dt>
            <dd className="font-semibold">{IFOOD_ADMIN.homologacao}</dd>
          </div>
          <div>
            <dt className="text-[var(--rwp-on-light-muted)]">Último teste</dt>
            <dd className="font-semibold">{IFOOD_ADMIN.ultimoTeste}</dd>
          </div>
        </dl>
      )}
    </PainelCard>
  );
}
