import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Dados de EXEMPLO (fictícios) só para conhecer o app.
// Os dados reais (lojas/diaristas) NÃO ficam no Git — rode o seed privado
// que você guardou separadamente (ex.: prisma/seed.real.ts, ignorado pelo Git).

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}
function addDias(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return toISO(d);
}

async function main() {
  console.log("Limpando dados antigos...");
  await prisma.escala.deleteMany();
  await prisma.diarista.deleteMany();
  await prisma.loja.deleteMany();

  console.log("Criando lojas de exemplo...");
  const centro = await prisma.loja.create({
    data: {
      nome: "Loja Exemplo Centro",
      cnpj: "00.000.000/0001-00",
      cidade: "Cidade Exemplo",
      endereco: "Rua das Flores, 100 - Centro",
    },
  });
  const shopping = await prisma.loja.create({
    data: {
      nome: "Loja Exemplo Shopping",
      cnpj: "11.111.111/0001-11",
      cidade: "Cidade Exemplo",
      endereco: "Av. Brasil, 2000 - Shopping Norte",
    },
  });
  const bairro = await prisma.loja.create({
    data: {
      nome: "Loja Exemplo Bairro",
      cnpj: "22.222.222/0001-22",
      cidade: "Cidade Exemplo",
      endereco: "Rua Verde, 45 - Jardim",
    },
  });

  console.log("Criando diaristas de exemplo...");
  const a = await prisma.diarista.create({
    data: {
      nome: "Diarista Exemplo 1",
      funcao: "Atendente",
      telefone: "(00) 90000-0001",
      chavePix: "exemplo1@email.com",
      valorDiaria: 12000, // R$ 120,00
      lojasPreferidas: { connect: [{ id: centro.id }, { id: shopping.id }] },
    },
  });
  const b = await prisma.diarista.create({
    data: {
      nome: "Diarista Exemplo 2",
      funcao: "Pizzaiolo",
      telefone: "(00) 90000-0002",
      chavePix: "00900000002",
      valorDiaria: 13000, // R$ 130,00
    },
  });
  const c = await prisma.diarista.create({
    data: {
      nome: "Diarista Exemplo 3",
      funcao: "Motoqueiro",
      telefone: "(00) 90000-0003",
      chavePix: "exemplo3@email.com",
      valorDiaria: 11000, // R$ 110,00
    },
  });

  console.log("Criando escalas de exemplo...");
  await prisma.escala.createMany({
    data: [
      // Já trabalhou e ainda não recebeu (aparece em "A pagar")
      { data: addDias(-2), valor: a.valorDiaria, presenca: "PRESENTE", pago: false, diaristaId: a.id, lojaId: centro.id },
      { data: addDias(-2), valor: b.valorDiaria, presenca: "PRESENTE", pago: false, diaristaId: b.id, lojaId: shopping.id },
      { data: addDias(-1), valor: c.valorDiaria, presenca: "PRESENTE", pago: false, diaristaId: c.id, lojaId: bairro.id },
      // Já trabalhou e já recebeu (aparece no histórico)
      { data: addDias(-7), valor: a.valorDiaria, presenca: "PRESENTE", pago: true, pagoEm: new Date(), diaristaId: a.id, lojaId: centro.id },
      // Faltou
      { data: addDias(-3), valor: b.valorDiaria, presenca: "FALTOU", pago: false, diaristaId: b.id, lojaId: centro.id },
      // Escalas de hoje (presença pendente)
      { data: addDias(0), valor: a.valorDiaria, presenca: "PENDENTE", pago: false, diaristaId: a.id, lojaId: centro.id },
      { data: addDias(0), valor: c.valorDiaria, presenca: "PENDENTE", pago: false, diaristaId: c.id, lojaId: shopping.id },
      // Escalas futuras
      { data: addDias(1), valor: b.valorDiaria, presenca: "PENDENTE", pago: false, diaristaId: b.id, lojaId: bairro.id },
      { data: addDias(2), valor: a.valorDiaria, presenca: "PENDENTE", pago: false, diaristaId: a.id, lojaId: shopping.id },
    ],
  });

  console.log("Criando requisição de exemplo...");
  await prisma.requisicao.create({
    data: {
      lojaId: centro.id,
      data: addDias(1),
      horaInicio: "18:00",
      horaFim: "23:00",
      funcao: "Pizzaiolo",
      quantidade: 2,
      valorDiaria: 12000,
      observacoes: "Turno da noite",
    },
  });

  console.log("Criando avaliação de exemplo...");
  const escalaPresente = await prisma.escala.findFirst({
    where: { presenca: "PRESENTE", diaristaId: a.id },
  });
  if (escalaPresente) {
    await prisma.avaliacao.create({
      data: {
        escalaId: escalaPresente.id,
        diaristaId: a.id,
        pontualidade: 9,
        limpeza: 8,
        educacao: 10,
        rapidez: 7,
        habilidadeTecnica: 8,
        respeito: 10,
        espiritoEquipe: 9,
        comentario: "Ótima diária, chegou no horário.",
      },
    });
    await prisma.avaliacaoLoja.create({
      data: {
        escalaId: escalaPresente.id,
        lojaId: escalaPresente.lojaId,
        diaristaId: a.id,
        ambiente: 8,
        tratamento: 9,
        pagamentoEmDia: 10,
        organizacao: 7,
        seguranca: 9,
        comentario: "Equipe receptiva, pagamento certinho.",
      },
    });
  }

  console.log("Pronto! Dados de exemplo criados.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
