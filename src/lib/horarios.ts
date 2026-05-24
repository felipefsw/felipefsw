// Cor da diária conforme o horário de início, para identificar o turno num relance:
// - começa de manhã/início da tarde (antes das 14h) → azul
// - começa entre 14h e 16h → verde
// - começa das 17h em diante → lilás
export type CorTurno = {
  bg: string;
  border: string;
  card: string;
  chip: string;
  rotulo: string;
  emoji: string;
};

export function corDoTurno(horaInicio: string | null | undefined): CorTurno {
  const h = horaInicio ? Number.parseInt(horaInicio.slice(0, 2), 10) : NaN;

  if (Number.isNaN(h)) {
    return {
      bg: "bg-white",
      border: "border-gray-200",
      card: "border-gray-200 bg-white",
      chip: "bg-gray-100 text-gray-600",
      rotulo: "Horário a definir",
      emoji: "",
    };
  }
  if (h < 14) {
    return {
      bg: "bg-blue-50",
      border: "border-blue-200",
      card: "border-blue-200 bg-blue-50",
      chip: "bg-blue-100 text-blue-800",
      rotulo: "Manhã/tarde",
      emoji: "🟦",
    };
  }
  if (h < 17) {
    return {
      bg: "bg-green-50",
      border: "border-green-200",
      card: "border-green-200 bg-green-50",
      chip: "bg-green-100 text-green-800",
      rotulo: "Tarde",
      emoji: "🟩",
    };
  }
  return {
    bg: "bg-purple-50",
    border: "border-purple-200",
    card: "border-purple-200 bg-purple-50",
    chip: "bg-purple-100 text-purple-800",
    rotulo: "Noite",
    emoji: "🟪",
  };
}
