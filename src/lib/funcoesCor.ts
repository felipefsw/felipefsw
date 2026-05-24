// Cor de fundo da vaga conforme a função, para identificar num relance:
// Pizzaiolo = laranja, Aux. pizzaiolo = amarelo, Atendente = azul, Motoqueiro = verde.
export type CorFuncao = { bg: string; border: string; card: string };

export function corDaFuncao(funcao: string | null | undefined): CorFuncao {
  switch (funcao) {
    case "Pizzaiolo":
      return { bg: "bg-orange-50", border: "border-orange-300", card: "border-orange-300 bg-orange-50" };
    case "Aux. pizzaiolo":
      return { bg: "bg-yellow-50", border: "border-yellow-300", card: "border-yellow-300 bg-yellow-50" };
    case "Atendente":
      return { bg: "bg-blue-50", border: "border-blue-300", card: "border-blue-300 bg-blue-50" };
    case "Motoqueiro":
      return { bg: "bg-green-50", border: "border-green-300", card: "border-green-300 bg-green-50" };
    default:
      return { bg: "bg-white", border: "border-gray-200", card: "border-gray-200 bg-white" };
  }
}
