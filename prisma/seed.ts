import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

  console.log("Criando lojas...");
  const centro = await prisma.loja.create({
    data: { nome: "Loja Centro", endereco: "Rua das Flores, 100 - Centro" },
  });
  const shopping = await prisma.loja.create({
    data: { nome: "Loja Shopping", endereco: "Av. Brasil, 2000 - Shopping Norte" },
  });
  const bairro = await prisma.loja.create({
    data: { nome: "Loja Bairro", endereco: "Rua Verde, 45 - Jardim" },
  });

  console.log("Criando diaristas...");
  const maria = await prisma.diarista.create({
    data: {
      nome: "Maria Silva",
      telefone: "(11) 90000-0001",
      chavePix: "maria@email.com",
      valorDiaria: 12000, // R$ 120,00
    },
  });
  const joana = await prisma.diarista.create({
    data: {
      nome: "Joana Souza",
      telefone: "(11) 90000-0002",
      chavePix: "11900000002",
      valorDiaria: 13000, // R$ 130,00
    },
  });
  const ana = await prisma.diarista.create({
    data: {
      nome: "Ana Pereira",
      telefone: "(11) 90000-0003",
      chavePix: "ana.pereira@email.com",
      valorDiaria: 11000, // R$ 110,00
    },
  });

  console.log("Criando escalas...");
  await prisma.escala.createMany({
    data: [
      // Já trabalhou e ainda não recebeu (aparece em "A pagar")
      { data: addDias(-2), valor: maria.valorDiaria, presenca: "PRESENTE", pago: false, diaristaId: maria.id, lojaId: centro.id },
      { data: addDias(-2), valor: joana.valorDiaria, presenca: "PRESENTE", pago: false, diaristaId: joana.id, lojaId: shopping.id },
      { data: addDias(-1), valor: ana.valorDiaria, presenca: "PRESENTE", pago: false, diaristaId: ana.id, lojaId: bairro.id },
      // Já trabalhou e já recebeu (aparece no histórico)
      { data: addDias(-7), valor: maria.valorDiaria, presenca: "PRESENTE", pago: true, pagoEm: new Date(), diaristaId: maria.id, lojaId: centro.id },
      // Faltou
      { data: addDias(-3), valor: joana.valorDiaria, presenca: "FALTOU", pago: false, diaristaId: joana.id, lojaId: centro.id },
      // Escalas de hoje (presença pendente)
      { data: addDias(0), valor: maria.valorDiaria, presenca: "PENDENTE", pago: false, diaristaId: maria.id, lojaId: centro.id },
      { data: addDias(0), valor: ana.valorDiaria, presenca: "PENDENTE", pago: false, diaristaId: ana.id, lojaId: shopping.id },
      // Escalas futuras
      { data: addDias(1), valor: joana.valorDiaria, presenca: "PENDENTE", pago: false, diaristaId: joana.id, lojaId: bairro.id },
      { data: addDias(2), valor: maria.valorDiaria, presenca: "PENDENTE", pago: false, diaristaId: maria.id, lojaId: shopping.id },
    ],
  });

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
