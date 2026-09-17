// Seed do Painel do Gestor — seção 10 do /docs/BUILD_BOOK.md.
//
// É idempotente: pode rodar quantas vezes quiser que não duplica nada.
//   npx tsx prisma/seed.painel.ts
//
// O que ainda NÃO entra aqui, porque o book manda buscar em outro documento e
// a regra é nunca inventar dado (seção 0): os textos dos itens de checklist
// (Placar v3), a ficha técnica v3.2 e os preços do CD de set/2026 (skill CMV),
// e os pontos das regras de gamificação. As telas mostram essas pendências.

import { PrismaClient, type Prisma } from "@prisma/client";
import { gerarHashSenha } from "../src/lib/senha";
import { PARAMETROS_PADRAO } from "../src/lib/painel/parametros";

const prisma = new PrismaClient();

/** Vigência inicial de parâmetros e preços: setembro/2026, como o book. */
const VIGENCIA_INICIAL = new Date("2026-09-01T00:00:00.000Z");

const hora = (hhmm: string) => new Date(`1970-01-01T${hhmm}:00.000Z`);
const data = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

// ---------------------------------------------------------------- marcas e lojas

const MARCAS = ["We Love Pizza", "Rei da Pizza"];

const LOJAS = [
  {
    marca: "We Love Pizza",
    name: "We Love Pizza 1",
    shortName: "WLP1",
    address: "Pontes Vieira",
    city: "Fortaleza",
    openTime: "14:30",
    closeTime: "02:00",
    // Usado para achar a loja correspondente no app de diaristas.
    apelidosNoOutroApp: ["we love pizza 1", "wlp1", "we love"],
  },
  {
    marca: "Rei da Pizza",
    name: "Rei da Pizza WS",
    shortName: "Rei WS",
    address: "Washington Soares",
    city: "Fortaleza",
    openTime: "14:00",
    closeTime: "00:00",
    apelidosNoOutroApp: ["rei da pizza ws", "rei ws", "washington soares"],
  },
];

// ------------------------------------------------------------------- turnos
// Horários da seção 6.4. `paidHours` = duração do turno menos o intervalo.

const TURNOS = [
  { code: "A", label: "A · 14h00–23h00", startTime: "14:00", endTime: "23:00", breakStart: "15:30", breakEnd: "16:30", paidHours: 8 },
  { code: "A2", label: "A2 · 14h30–23h30", startTime: "14:30", endTime: "23:30", breakStart: null, breakEnd: null, paidHours: 9 },
  { code: "C", label: "C · 15h30–00h30", startTime: "15:30", endTime: "00:30", breakStart: "16:30", breakEnd: "17:30", paidHours: 8 },
  { code: "B", label: "B · 17h00–02h00", startTime: "17:00", endTime: "02:00", breakStart: "22:00", breakEnd: "23:00", paidHours: 8 },
];

// -------------------------------------------------------------- equipe WLP1

const EQUIPE_WLP1: { name: string; role: Prisma.EmployeeCreateInput["role"] }[] = [
  { name: "Cleilson", role: "lider_producao" },
  { name: "Valdinar", role: "producao" },
  { name: "Leonardo", role: "producao" },
  { name: "Mauricio", role: "producao" },
  { name: "Ronald", role: "producao" },
  { name: "Marina", role: "atendimento" },
  { name: "Camila", role: "atendimento" },
  { name: "Ana Flávia", role: "atendimento" },
  { name: "Weydna", role: "atendimento" },
  { name: "Adriana", role: "atendimento" },
];

// ----------------------------------------------------------- feriados 2026
// Fortaleza/CE: nacionais + Data Magna do Ceará (25/03) + padroeira (15/08).
// Todo feriado se comporta como sábado (seção 6.1).

const FERIADOS_2026: { date: string; name: string }[] = [
  { date: "2026-01-01", name: "Confraternização Universal" },
  { date: "2026-02-16", name: "Carnaval (segunda)" },
  { date: "2026-02-17", name: "Carnaval" },
  { date: "2026-02-18", name: "Quarta-feira de Cinzas" },
  { date: "2026-03-25", name: "Data Magna do Ceará" },
  { date: "2026-04-03", name: "Sexta-feira Santa" },
  { date: "2026-04-21", name: "Tiradentes" },
  { date: "2026-05-01", name: "Dia do Trabalho" },
  { date: "2026-06-04", name: "Corpus Christi" },
  { date: "2026-08-15", name: "Nossa Senhora da Assunção (padroeira de Fortaleza)" },
  { date: "2026-09-07", name: "Independência do Brasil" },
  { date: "2026-10-12", name: "Nossa Senhora Aparecida" },
  { date: "2026-11-02", name: "Finados" },
  { date: "2026-11-15", name: "Proclamação da República" },
  { date: "2026-11-20", name: "Dia da Consciência Negra" },
  { date: "2026-12-25", name: "Natal" },
];

// ------------------------------------------------------------------ usuário

const ADMIN = {
  email: process.env.PAINEL_ADMIN_EMAIL || "felipefsw@gmail.com",
  name: process.env.PAINEL_ADMIN_NOME || "Felipe",
  senha: process.env.PAINEL_ADMIN_SENHA || "123456",
};

async function main() {
  console.log("Painel do Gestor · seed da seção 10\n");

  // Marcas
  const marcas = new Map<string, string>();
  for (const nome of MARCAS) {
    const existente = await prisma.brand.findFirst({ where: { name: nome } });
    const b = existente ?? (await prisma.brand.create({ data: { name: nome } }));
    marcas.set(nome, b.id);
  }
  console.log(`  ${marcas.size} marcas`);

  // Lojas (ligadas à loja do app de diaristas quando der para identificar)
  const lojas = new Map<string, string>();
  for (const l of LOJAS) {
    const doOutroApp = await prisma.loja.findFirst({
      where: { OR: l.apelidosNoOutroApp.map((a) => ({ nome: { contains: a, mode: "insensitive" as const } })) },
      select: { id: true },
    });
    // Não rouba o vínculo de uma loja do Painel que já aponte para essa Loja.
    const jaVinculada = doOutroApp
      ? await prisma.store.findUnique({ where: { lojaId: doOutroApp.id }, select: { name: true } })
      : null;
    const lojaId = doOutroApp && (!jaVinculada || jaVinculada.name === l.name) ? doOutroApp.id : null;

    const dados = {
      brandId: marcas.get(l.marca)!,
      shortName: l.shortName,
      address: l.address,
      city: l.city,
      openTime: hora(l.openTime),
      closeTime: hora(l.closeTime),
      tz: "America/Fortaleza",
      active: true,
      lojaId,
    };
    const existente = await prisma.store.findFirst({ where: { name: l.name }, select: { id: true } });
    const store = existente
      ? await prisma.store.update({ where: { id: existente.id }, data: dados })
      : await prisma.store.create({ data: { name: l.name, ...dados } });
    lojas.set(l.shortName, store.id);
    console.log(`  loja ${l.name}${lojaId ? " (ligada ao app de diaristas)" : ""}`);
  }

  // Turnos da rede (store_id null)
  for (const t of TURNOS) {
    const existente = await prisma.shift.findFirst({ where: { storeId: null, code: t.code } });
    const dados = {
      label: t.label,
      startTime: hora(t.startTime),
      endTime: hora(t.endTime),
      breakStart: t.breakStart ? hora(t.breakStart) : null,
      breakEnd: t.breakEnd ? hora(t.breakEnd) : null,
      paidHours: t.paidHours,
    };
    if (existente) await prisma.shift.update({ where: { id: existente.id }, data: dados });
    else await prisma.shift.create({ data: { storeId: null, code: t.code, ...dados } });
  }
  console.log(`  ${TURNOS.length} turnos da rede`);

  // Parâmetros padrão da rede, com vigência.
  // (upsert do Prisma não aceita `store_id` nulo na chave composta, por isso
  //  a busca é manual; a unicidade real está no índice parcial da migration
  //  20260917040000_unicidade_rede.)
  for (const [key, valueNum] of Object.entries(PARAMETROS_PADRAO)) {
    const existente = await prisma.param.findFirst({
      where: { storeId: null, key, validFrom: VIGENCIA_INICIAL },
      select: { id: true },
    });
    if (existente) await prisma.param.update({ where: { id: existente.id }, data: { valueNum } });
    else await prisma.param.create({ data: { storeId: null, key, valueNum, validFrom: VIGENCIA_INICIAL } });
  }
  console.log(`  ${Object.keys(PARAMETROS_PADRAO).length} parâmetros da rede (vigência 01/09/2026)`);

  // Equipe da WLP1
  const wlp1 = lojas.get("WLP1")!;
  for (const p of EQUIPE_WLP1) {
    const existente = await prisma.employee.findFirst({ where: { storeId: wlp1, name: p.name } });
    const dados = { role: p.role, regime: "SEIS_POR_UM" as const, active: true };
    if (existente) await prisma.employee.update({ where: { id: existente.id }, data: dados });
    else await prisma.employee.create({ data: { storeId: wlp1, name: p.name, ...dados } });
  }
  console.log(`  ${EQUIPE_WLP1.length} pessoas na equipe da WLP1`);

  // Modelos de checklist da rede (os itens vêm do Placar v3 — ainda faltam)
  for (const name of ["Abertura", "Pico", "Fechamento"] as const) {
    const existente = await prisma.checklistTemplate.findFirst({ where: { storeId: null, name } });
    if (!existente) await prisma.checklistTemplate.create({ data: { storeId: null, name, active: true } });
  }
  const itensDeChecklist = await prisma.checklistItem.count();
  console.log(`  3 modelos de checklist da rede (${itensDeChecklist} itens cadastrados)`);

  // Feriados
  for (const f of FERIADOS_2026) {
    await prisma.holiday.upsert({
      where: { date: data(f.date) },
      update: { name: f.name, behavesLike: "Sáb" },
      create: { date: data(f.date), name: f.name, behavesLike: "Sáb" },
    });
  }
  console.log(`  ${FERIADOS_2026.length} feriados de 2026 (Fortaleza/CE)`);

  // Usuário administrador da rede, com acesso a todas as lojas
  const admin = await prisma.profile.upsert({
    where: { email: ADMIN.email },
    update: { name: ADMIN.name, active: true },
    create: { email: ADMIN.email, name: ADMIN.name, senha: gerarHashSenha(ADMIN.senha), active: true },
  });
  for (const storeId of lojas.values()) {
    await prisma.membership.upsert({
      where: { userId_storeId: { userId: admin.id, storeId } },
      update: { role: "admin_rede" },
      create: { userId: admin.id, storeId, role: "admin_rede" },
    });
  }
  console.log(`  administrador da rede: ${ADMIN.email}`);

  console.log("\nFalta cadastrar (o book manda pegar em outro documento):");
  console.log("  - itens dos checklists Abertura/Pico/Fechamento (Placar v3)");
  console.log("  - ingredientes da curva de 17 itens e preços do CD de set/2026");
  console.log("  - ficha técnica v3.2 (gramas por sabor)");
  console.log("  - pontos das regras de gamificação");
  console.log("  - pizzas_per_order e drink_cost_order de cada loja");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
