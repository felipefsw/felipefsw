// Opções de horário de fim da diária, incluindo madrugada do dia seguinte
// (para diárias que passam da meia-noite, ex.: 18:00 às 01:00).
export function opcoesHoraFim(): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = [];
  const pad = (n: number) => String(n).padStart(2, "0");

  // Mesmo dia: 12:00 até 23:30 (de 30 em 30 min).
  for (let h = 12; h <= 23; h++) {
    for (const m of [0, 30]) {
      const v = `${pad(h)}:${pad(m)}`;
      out.push({ value: v, label: v });
    }
  }
  // Dia seguinte: 00:00 até 03:00.
  for (let h = 0; h <= 3; h++) {
    for (const m of [0, 30]) {
      if (h === 3 && m === 30) break;
      const v = `${pad(h)}:${pad(m)}`;
      out.push({ value: v, label: `${v} (dia seguinte)` });
    }
  }
  return out;
}
