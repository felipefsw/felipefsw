import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Lojas reais da rede RWP.
// Excluídas as lojas com status "Em implantação" (PP 09, PP 12, PP 15, Royal 03, WLP 5).
// Os códigos do Saipos não são guardados: o que identifica a loja é o CNPJ + nome.
// endereco = bairro (quando conhecido). Bairros/cidades conferidos com o manual operacional RWP.
const lojas: { nome: string; cnpj: string; cidade: string; endereco?: string }[] = [
  { nome: "Centro de Distribuicao - RWP", cnpj: "58.156.153/0001-02", cidade: "Fortaleza" },
  { nome: "Pizza Pizza 01", cnpj: "58.174.494/0001-00", cidade: "Fortaleza", endereco: "Cidade dos Funcionários" },
  { nome: "Pizza Pizza 02", cnpj: "48.526.635/0001-53", cidade: "Fortaleza", endereco: "Santos Dumont" },
  { nome: "Pizza Pizza 03", cnpj: "58.157.684/0001-10", cidade: "Fortaleza", endereco: "Aldeota" },
  { nome: "Pizza Pizza 04", cnpj: "58.157.722/0001-34", cidade: "Fortaleza", endereco: "Guararapes" },
  { nome: "Pizza Pizza 05", cnpj: "58.174.445/0001-78", cidade: "Eusébio" },
  { nome: "Pizza Pizza 06", cnpj: "59.358.132/0001-32", cidade: "Fortaleza" },
  { nome: "Pizza Pizza 07", cnpj: "61.625.668/0001-19", cidade: "Fortaleza", endereco: "Parquelândia" },
  { nome: "Pizza Pizza 08", cnpj: "61.199.547/0001-52", cidade: "Fortaleza", endereco: "Maraponga" },
  { nome: "Pizza Pizza 10", cnpj: "62.389.638/0001-13", cidade: "Maracanaú" },
  { nome: "Pizza Pizza 11", cnpj: "63.707.986/0001-54", cidade: "Aquiraz" },
  { nome: "Pizza Pizza 14", cnpj: "64.973.612/0001-43", cidade: "Horizonte" },
  { nome: "Rei da pizza WS", cnpj: "58.156.437/0001-07", cidade: "Fortaleza", endereco: "Washington Soares" },
  { nome: "ROYAL PIZZA 01", cnpj: "53.896.423/0001-06", cidade: "Fortaleza" },
  { nome: "ROYAL PIZZA 02", cnpj: "61.229.963/0001-56", cidade: "Fortaleza", endereco: "Varjota" },
  { nome: "We Love Pizza 1", cnpj: "58.156.231/0001-79", cidade: "Fortaleza", endereco: "Pontes Vieira" },
  { nome: "We Love Pizza 2", cnpj: "65.624.316/0001-08", cidade: "Fortaleza", endereco: "Itaperi" },
  { nome: "We Love Pizza 3", cnpj: "65.624.690/0001-03", cidade: "Fortaleza", endereco: "Frei Cirilo" },
  { nome: "We Love Pizza 4", cnpj: "61.759.025/0001-68", cidade: "Fortaleza", endereco: "Kennedy" },
];

// Banco de diaristas da rede (amostras de abril). Nomes deduplicados.
// "funcao" e "lojas" são guardados em observacoes (texto livre) pois o app ainda
// não tem campos próprios para isso. valor em centavos quando conhecido.
const diaristas: {
  nome: string;
  funcao: string;
  lojas: string;
  valor?: number;
  nota?: string;
}[] = [
  { nome: "Geraldo", funcao: "Produção", lojas: "Rei" },
  { nome: "Jardel", funcao: "Produção", lojas: "Rei, PP 05" },
  { nome: "Alisson Vitor", funcao: "Produção", lojas: "PP 01" },
  { nome: "Arthur Max", funcao: "Produção", lojas: "PP 01" },
  { nome: "Jeferson", funcao: "Produção", lojas: "PP 01" },
  { nome: "Davi", funcao: "Produção", lojas: "PP 03" },
  {
    nome: "Marcos",
    funcao: "Produção",
    lojas: "PP 03, PP 12 (Caucaia)",
    valor: 13000,
    nota: "Sáb R$130 / Dom R$140 + R$10",
  },
  { nome: "Sara Conceição", funcao: "Produção", lojas: "PP 03" },
  { nome: "Leandro", funcao: "Produção", lojas: "PP 04" },
  { nome: "Ronny", funcao: "Produção", lojas: "PP 05" },
  { nome: "Rafael", funcao: "Produção", lojas: "WLP 1" },
  { nome: "Marcelo", funcao: "Produção", lojas: "WLP 1" },
  {
    nome: "Gabriel",
    funcao: "Produção",
    lojas: "WLP 1; PP 14 (Horizonte) - teste fixo",
    nota: "Confirmar se é a mesma pessoa nas duas lojas",
  },
  { nome: "Sarah", funcao: "Atendimento", lojas: "WLP 1" },
  { nome: "Ricardo", funcao: "Produção", lojas: "WLP 2" },
  { nome: "Samuel", funcao: "Produção", lojas: "WLP 2" },
  { nome: "Yuri", funcao: "Produção", lojas: "WLP 2" },
  { nome: "Erivelton", funcao: "Produção", lojas: "WLP 3" },
  { nome: "Alessandro", funcao: "Produção (teste fixo)", lojas: "WLP 3" },
  { nome: "Erica", funcao: "Atendimento (teste fixo)", lojas: "WLP 3" },
  {
    nome: "Júlio",
    funcao: "Produção",
    lojas: "PP 12 (Caucaia)",
    valor: 12000,
    nota: "R$120 + R$10 + Uber da volta (loja distante)",
  },
  { nome: "Tainara", funcao: "Atendimento", lojas: "Rei" },
  { nome: "Suellen", funcao: "Produção", lojas: "PP 03" },
  { nome: "Mateus", funcao: "Produção", lojas: "PP 05, PP 14 (Horizonte)" },
  { nome: "Josy", funcao: "Produção", lojas: "PP 01" },
  {
    nome: "Pedro",
    funcao: "Produção / Atendimento",
    lojas: "Rei (produção); PP 05 (atendimento, teste fixo)",
    nota: "Confirmar se é a mesma pessoa",
  },
  { nome: "Aderlly", funcao: "Supervisor (teste fixo)", lojas: "PP 05" },
  { nome: "Anderson", funcao: "Produção", lojas: "WLP 2" },
  { nome: "Antonio Nunes", funcao: "Produção", lojas: "WLP 3" },
  { nome: "Dheniffer", funcao: "Atendimento (teste fixo)", lojas: "Rei" },
  { nome: "Lucas", funcao: "Atendimento", lojas: "Rei" },
  { nome: "Rodrigo", funcao: "Produção", lojas: "PP 14 (Horizonte)" },
  { nome: "Brena", funcao: "Produção", lojas: "PP 14 (Horizonte)" },
  { nome: "Adrielly", funcao: "Atendimento", lojas: "PP 14 (Horizonte)" },
  { nome: "Pires", funcao: "Produção", lojas: "PP 01" },
  { nome: "Taynara", funcao: "Teste fixo", lojas: "PP 05" },
  { nome: "Pedro Lucas", funcao: "Teste fixo", lojas: "PP 05" },
  { nome: "Nicolas", funcao: "Produção", lojas: "Rei" },
  { nome: "Camila", funcao: "Produção", lojas: "Rei" },
  { nome: "Alexsandro", funcao: "Produção", lojas: "PP 04" },
  { nome: "Samara", funcao: "Produção", lojas: "WLP 1" },
  { nome: "Claudemir", funcao: "Produção", lojas: "WLP 3" },
  { nome: "Kerlan", funcao: "Produção", lojas: "PP 04" },
  { nome: "Yasmim", funcao: "Atendimento", lojas: "PP 01" },
  { nome: "Taiany", funcao: "Teste fixo (auxiliar)", lojas: "PP 03" },
  { nome: "Gustavo", funcao: "Teste fixo", lojas: "PP 04" },
  { nome: "Renata", funcao: "Atendimento (teste fixo)", lojas: "PP 05" },
  { nome: "Naiara", funcao: "Teste fixo", lojas: "WLP 2" },
  { nome: "Wellington", funcao: "Produção", lojas: "WLP 3" },
  { nome: "Denis", funcao: "Produção", lojas: "Rei" },
  { nome: "Aila", funcao: "Atendimento (teste fixo)", lojas: "PP 14 (Horizonte)" },
  { nome: "Gabriela", funcao: "Atendimento", lojas: "PP 14 (Horizonte)" },
  { nome: "Lindemberg", funcao: "Produção", lojas: "PP 12 (Caucaia)" },
  { nome: "Lucas (PP 15)", funcao: "Produção", lojas: "PP 15 (Henrique Jorge)" },
  { nome: "Elaine", funcao: "Atendimento", lojas: "PP 15 (Henrique Jorge)" },
  { nome: "Luana", funcao: "Produção", lojas: "WLP 2" },
  { nome: "Beto", funcao: "Produção", lojas: "WLP 2" },
  { nome: "Tiago", funcao: "Produção", lojas: "WLP 2" },
  { nome: "Duarte", funcao: "Produção", lojas: "Rei" },
  { nome: "Joaquina", funcao: "Atendimento", lojas: "Rei" },
  { nome: "Emilly", funcao: "Atendimento (teste fixo)", lojas: "PP 01" },
  { nome: "Eduardo", funcao: "Produção", lojas: "PP 04" },
  { nome: "Ana Carolina", funcao: "Atendimento (teste fixo)", lojas: "PP 05" },
  { nome: "Carol", funcao: "Atendimento", lojas: "WLP 1" },
  { nome: "Vitor", funcao: "Produção (teste fixo)", lojas: "WLP 2" },
  { nome: "Alexandra", funcao: "Atendimento (teste fixo)", lojas: "WLP 3" },
  { nome: "Sr. Beto", funcao: "Produção", lojas: "PP 01" },
  { nome: "Kailane", funcao: "Atendimento", lojas: "PP 05" },
  { nome: "Ana", funcao: "Atendimento", lojas: "PP 05" },
  { nome: "Beatriz", funcao: "Produção", lojas: "Rei (teste fixo WLP Messejana)" },
  { nome: "Luiz", funcao: "Teste fixo", lojas: "PP 01" },
  { nome: "Eloisa", funcao: "Atendimento (teste fixo)", lojas: "PP 03" },
  { nome: "Nataniel", funcao: "Produção (teste fixo)", lojas: "WLP 1" },
  { nome: "Artelizia", funcao: "Produção", lojas: "Rei" },
  { nome: "Vladiane", funcao: "Atendimento (teste fixo)", lojas: "PP 15 (Henrique Jorge)" },
  { nome: "Ythalo", funcao: "Atendimento (teste fixo)", lojas: "PP 15 (Henrique Jorge)" },
  { nome: "Pedro Henrique", funcao: "Produção", lojas: "PP 01" },
  { nome: "João Paulo", funcao: "Teste fixo", lojas: "PP 03" },
  { nome: "Henrique", funcao: "Teste fixo", lojas: "WLP 1" },
  { nome: "Bruna", funcao: "Atendimento (teste fixo)", lojas: "WLP 1" },
  { nome: "Maria Silva", funcao: "Atendimento (teste fixo)", lojas: "WLP 2" },
  { nome: "Oliveira", funcao: "Produção", lojas: "WLP 3" },
  { nome: "Augusto", funcao: "Produção", lojas: "Rei" },
  { nome: "Leidiane", funcao: "Atendimento (teste fixo)", lojas: "Rei (teste fixo WLP 3)" },
];

function montarObs(d: (typeof diaristas)[number]): string {
  const partes = [`${d.funcao} · Lojas: ${d.lojas}`];
  if (d.nota) partes.push(d.nota);
  return partes.join(" · ");
}

async function main() {
  console.log("Limpando dados antigos...");
  await prisma.escala.deleteMany();
  await prisma.diarista.deleteMany();
  await prisma.loja.deleteMany();

  console.log(`Criando ${lojas.length} lojas...`);
  await prisma.loja.createMany({ data: lojas });

  console.log(`Criando ${diaristas.length} diaristas...`);
  await prisma.diarista.createMany({
    data: diaristas.map((d) => ({
      nome: d.nome,
      valorDiaria: d.valor ?? 0,
      observacoes: montarObs(d),
    })),
  });

  console.log("Pronto! Lojas e banco de diaristas cadastrados.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
