// Gera dados FAKE de demonstração (como se o app rodasse há ~3 meses).
// Uso: npx tsx prisma/seed.demo.ts  (usa as lojas já cadastradas no banco)
// Os diaristas criados ficam marcados com observacoes "(demo)" para limpeza futura.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const FUNCOES = ["Atendente", "Pizzaiolo", "Aux. pizzaiolo", "Motoqueiro"];
const VALORES = [7000, 8000, 9000, 10000, 11000, 12000, 13000];
const NOMES = [
  "Lucas Andrade", "Maria Souza", "João Pedro", "Ana Beatriz", "Carlos Henrique",
  "Fernanda Lima", "Rafael Gomes", "Juliana Castro", "Bruno Alves", "Camila Rocha",
  "Diego Martins", "Patrícia Nunes", "Thiago Ramos", "Larissa Dias", "Gabriel Pinto",
  "Vanessa Melo", "Felipe Cardoso", "Aline Barbosa", "Rodrigo Teixeira", "Beatriz Moraes",
];

function aleatorio<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function inteiro(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function dataISO(diasAtras: number): string {
  const d = new Date();
  d.setDate(d.getDate() - diasAtras);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function nota(): number {
  return inteiro(6, 10); // notas variadas, puxando pra cima
}

async function main() {
  const lojas = await prisma.loja.findMany({ where: { ativo: true }, select: { id: true } });
  if (lojas.length === 0) {
    console.log("Nenhuma loja cadastrada. Cadastre lojas antes de rodar o demo.");
    return;
  }
  console.log(`Usando ${lojas.length} loja(s).`);

  console.log("Criando diaristas (demo)...");
  const diaristas: { id: string }[] = [];
  for (let i = 0; i < NOMES.length; i++) {
    const d = await prisma.diarista.create({
      data: {
        nome: NOMES[i],
        cpf: `${inteiro(100, 999)}.${inteiro(100, 999)}.${inteiro(100, 999)}-${inteiro(10, 99)}`,
        funcao: aleatorio(FUNCOES),
        telefone: `(85) 9${inteiro(1000, 9999)}-${inteiro(1000, 9999)}`,
        chavePix: `demo${i}@email.com`,
        valorDiaria: aleatorio(VALORES),
        observacoes: "(demo)",
        lojasPreferidas: {
          connect: Array.from({ length: inteiro(1, 3) }, () => aleatorio(lojas)).map((l) => ({
            id: l.id,
          })),
        },
      },
    });
    diaristas.push({ id: d.id });
  }

  console.log("Criando histórico de diárias e avaliações (90 dias)...");
  let escalasCriadas = 0;
  for (let dia = 90; dia >= 1; dia--) {
    const data = dataISO(dia);
    const qtd = inteiro(2, 6); // diárias por dia
    for (let k = 0; k < qtd; k++) {
      const loja = aleatorio(lojas);
      const diarista = aleatorio(diaristas);
      const valor = aleatorio(VALORES);
      const escala = await prisma.escala.create({
        data: {
          diaristaId: diarista.id,
          lojaId: loja.id,
          data,
          horaInicio: "18:00",
          horaFim: "23:00",
          valor,
          presenca: Math.random() < 0.9 ? "PRESENTE" : "FALTOU",
          pago: Math.random() < 0.8,
        },
      });
      escalasCriadas++;
      // avalia ~75% das presenças
      if (escala.presenca === "PRESENTE" && Math.random() < 0.75) {
        await prisma.avaliacao.create({
          data: {
            escalaId: escala.id,
            diaristaId: diarista.id,
            pontualidade: nota(),
            limpeza: nota(),
            educacao: nota(),
            rapidez: nota(),
            habilidadeTecnica: nota(),
            respeito: nota(),
            espiritoEquipe: nota(),
          },
        });
      }
    }
  }

  console.log("Criando requisições abertas com candidatos...");
  for (let i = 0; i < 6; i++) {
    const loja = aleatorio(lojas);
    const req = await prisma.requisicao.create({
      data: {
        lojaId: loja.id,
        data: dataISO(-inteiro(0, 5)), // hoje e próximos dias
        horaInicio: "18:00",
        horaFim: "23:00",
        funcao: aleatorio(FUNCOES),
        quantidade: inteiro(1, 3),
        valorDiaria: aleatorio(VALORES),
        status: "ABERTA",
      },
    });
    const candidatos = Array.from({ length: inteiro(1, 5) }, () => aleatorio(diaristas));
    const unicos = [...new Set(candidatos.map((c) => c.id))];
    for (const id of unicos) {
      await prisma.inscricao
        .create({ data: { requisicaoId: req.id, diaristaId: id } })
        .catch(() => {});
    }
  }

  console.log(`Pronto! ${diaristas.length} diaristas e ${escalasCriadas} diárias de demonstração.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
