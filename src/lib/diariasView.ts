import type { DiariaItem } from "@/components/ListaDiarias";
import { prisma } from "./prisma";
import { bairroCidade, enderecoCompleto, ruaDaLoja } from "./loja";
import { grupoDaLoja } from "./marcas";
import { podeDesfazerSolicitacao } from "./dates";
import { notaPublica } from "./notas";

type LojaLite = {
  nome: string;
  endereco: string | null;
  bairro: string | null;
  cidade: string | null;
  latitude: number | null;
  longitude: number | null;
};

type RequisicaoLite = {
  id: string;
  lojaId: string;
  data: string;
  horaInicio: string;
  horaFim: string;
  valorDiaria: number;
  funcao: string | null;
  loja: LojaLite;
};

export type ContextoDiarista = {
  funcao: string | null;
  lojasBloqueadas: Set<string>;
  datasComEscala: Set<string>;
  convocadoLojaData: Set<string>; // chave "lojaId|data"
  inscritoEm: Set<string>; // requisicaoId
  convidadoEm: Set<string>; // requisicaoId
  freqPorLoja: Map<string, number>; // diárias PRESENTE por loja
  favoritas: Set<string>; // lojaIds favoritas
};

// Média (0–5) das avaliações que os diaristas deram às lojas indicadas.
export async function notasDasLojas(
  lojaIds: string[],
): Promise<(lojaId: string) => number | null> {
  if (lojaIds.length === 0) return () => null;
  const avals = await prisma.avaliacaoLoja.findMany({
    where: { lojaId: { in: lojaIds } },
    select: {
      lojaId: true,
      ambiente: true,
      tratamento: true,
      pagamentoEmDia: true,
      organizacao: true,
      seguranca: true,
    },
  });
  const acc = new Map<string, { soma: number; qtd: number }>();
  for (const a of avals) {
    const m = (a.ambiente + a.tratamento + a.pagamentoEmDia + a.organizacao + a.seguranca) / 5 / 2;
    const cur = acc.get(a.lojaId) ?? { soma: 0, qtd: 0 };
    cur.soma += m;
    cur.qtd += 1;
    acc.set(a.lojaId, cur);
  }
  // Só mostra a nota depois de um mínimo de avaliações.
  return (lojaId: string) => {
    const c = acc.get(lojaId);
    return c ? notaPublica(c.soma, c.qtd) : null;
  };
}

// Filtra as requisições que o diarista pode pegar e mapeia para DiariaItem.
export function montarItensDiarias(
  requisicoes: RequisicaoLite[],
  ctx: ContextoDiarista,
  notaDaLoja: (lojaId: string) => number | null,
): DiariaItem[] {
  return requisicoes
    .filter(
      (r) =>
        !ctx.lojasBloqueadas.has(r.lojaId) &&
        !ctx.datasComEscala.has(r.data) &&
        !ctx.convocadoLojaData.has(`${r.lojaId}|${r.data}`) &&
        (!r.funcao || !ctx.funcao || r.funcao === ctx.funcao),
    )
    .map((r) => {
      const g = grupoDaLoja(r.loja.nome);
      return {
        id: r.id,
        lojaId: r.lojaId,
        lojaNome: r.loja.nome,
        marcaLabel: g.label,
        marcaOrdem: g.ordem,
        rua: ruaDaLoja(r.loja),
        enderecoCompleto: enderecoCompleto(r.loja) || ruaDaLoja(r.loja),
        bairroCidade: bairroCidade(r.loja),
        lat: r.loja.latitude,
        lng: r.loja.longitude,
        data: r.data,
        horaInicio: r.horaInicio,
        horaFim: r.horaFim,
        valor: r.valorDiaria,
        funcao: r.funcao,
        inscrito: ctx.inscritoEm.has(r.id),
        convidado: ctx.convidadoEm.has(r.id),
        nota: notaDaLoja(r.lojaId),
        freq: ctx.freqPorLoja.get(r.lojaId) ?? 0,
        favorita: ctx.favoritas.has(r.lojaId),
        podeDesfazer: podeDesfazerSolicitacao(r.data, r.horaInicio),
      };
    });
}
