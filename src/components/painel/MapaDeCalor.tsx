// Mapa de calor dia da semana × hora (seção 7.6 do book).
//
// Cor é encoding SEQUENCIAL (magnitude): um tom só — o laranja da marca —
// com claridade crescente. No tema escuro o "perto de zero" encosta na
// superfície e o máximo é o laranja cheio. Os cinco passos foram conferidos
// contra a superfície #141414: cada um tem cor de texto com pelo menos
// 4,5:1 (ver a legenda, que é parte da leitura, não enfeite).
//
// O número aparece escrito em toda célula com movimento, então a informação
// nunca depende só da cor.

import { NOME_CURTO_DO_DIA, type DiaDaSemana, type HoraDoPerfil } from "@/lib/painel/vendas";

/** Rampa sequencial (claro = mais movimento) e a cor de texto de cada passo. */
const PASSOS = [
  { fundo: "#42231c", texto: "#f3eee8" },
  { fundo: "#6a2e21", texto: "#f3eee8" },
  { fundo: "#8f3723", texto: "#f3eee8" },
  { fundo: "#b23e24", texto: "#f3eee8" },
  { fundo: "#ff4b1f", texto: "#0c0c0c" },
];

const DIAS: DiaDaSemana[] = [1, 2, 3, 4, 5, 6, 7];

function passoDe(valor: number, maximo: number): number {
  if (valor <= 0 || maximo <= 0) return -1; // sem movimento: fica a superfície
  const p = Math.ceil((valor / maximo) * PASSOS.length) - 1;
  return Math.min(PASSOS.length - 1, Math.max(0, p));
}

export default function MapaDeCalor({
  horas,
  titulo,
  unidade = "pedidos",
}: {
  horas: HoraDoPerfil[];
  titulo: string;
  unidade?: string;
}) {
  if (horas.length === 0) return null;

  const usadas = [...new Set(horas.map((h) => h.hora))].sort((a, b) => a - b);
  // O dia operacional começa às 06h: horas da madrugada vão para o fim da linha.
  const ordenadas = [
    ...usadas.filter((h) => h >= 6),
    ...usadas.filter((h) => h < 6),
  ];

  const porCelula = new Map(horas.map((h) => [`${h.dia}|${h.hora}`, h.pedidos]));
  const maximo = Math.max(...horas.map((h) => h.pedidos));

  return (
    <figure className="m-0">
      <figcaption className="mb-1 font-bold">{titulo}</figcaption>
      <p className="mb-2 text-sm text-[var(--painel-texto-fraco)]">
        Média de {unidade} por hora, nas últimas semanas completas. Quanto mais claro,
        mais movimento.
      </p>

      <div className="-mx-4 overflow-x-auto px-4">
        <table className="w-full border-separate border-spacing-[2px] text-center text-xs">
          <caption className="sr-only">
            {titulo}: média de {unidade} por dia da semana e hora do dia operacional.
          </caption>
          <thead>
            <tr>
              <th scope="col" className="sticky left-0 z-10 bg-[var(--painel-fundo)] pr-1 text-left font-medium text-[var(--painel-texto-fraco)]">
                hora
              </th>
              {DIAS.map((d) => (
                <th key={d} scope="col" className="font-medium text-[var(--painel-texto-fraco)]">
                  {NOME_CURTO_DO_DIA[d]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ordenadas.map((hora) => (
              <tr key={hora}>
                <th scope="row" className="sticky left-0 z-10 bg-[var(--painel-fundo)] pr-1 text-left font-normal text-[var(--painel-texto-fraco)]">
                  {String(hora).padStart(2, "0")}h
                </th>
                {DIAS.map((dia) => {
                  const valor = porCelula.get(`${dia}|${hora}`) ?? 0;
                  const p = passoDe(valor, maximo);
                  const estilo =
                    p < 0
                      ? { background: "var(--painel-superficie)", color: "var(--painel-texto-fraco)" }
                      : { background: PASSOS[p].fundo, color: PASSOS[p].texto };
                  return (
                    <td
                      key={dia}
                      className="rounded px-1 py-1 tabular-nums"
                      style={estilo}
                      title={`${NOME_CURTO_DO_DIA[dia]} ${String(hora).padStart(2, "0")}h · ${valor.toLocaleString("pt-BR")} ${unidade}`}
                    >
                      {valor > 0 ? valor.toLocaleString("pt-BR") : "–"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-2 flex items-center gap-2 text-xs text-[var(--painel-texto-fraco)]">
        <span>menos</span>
        {PASSOS.map((p) => (
          <span
            key={p.fundo}
            aria-hidden="true"
            className="h-3 w-6 rounded"
            style={{ background: p.fundo }}
          />
        ))}
        <span>mais (até {maximo.toLocaleString("pt-BR")})</span>
      </div>
    </figure>
  );
}
