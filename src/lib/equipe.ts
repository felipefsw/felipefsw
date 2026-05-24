// Equipe interna (RH e TI). Modo de testes: cada pessoa entra clicando no nome.
export type MembroEquipe = {
  id: string;
  nome: string;
  perfil: "rh" | "ti";
  papel: string;
};

export const EQUIPE: MembroEquipe[] = [
  // RH
  { id: "aline-goncalves", nome: "Aline Gonçalves", perfil: "rh", papel: "Coordenadora" },
  { id: "sidnaria", nome: "Sidnaria", perfil: "rh", papel: "Analista de RH" },
  { id: "fran", nome: "Fran", perfil: "rh", papel: "Analista de RH" },
  { id: "carol", nome: "Carol", perfil: "rh", papel: "Analista de RH" },
  { id: "estagiaria-rh", nome: "Estagiária", perfil: "rh", papel: "Estagiária (sem nome)" },
  // TI
  { id: "daniel-nogueira", nome: "Daniel Nogueira", perfil: "ti", papel: "" },
  { id: "marcelo", nome: "Marcelo", perfil: "ti", papel: "" },
  { id: "jefferson", nome: "Jefferson", perfil: "ti", papel: "" },
];

export function membroEquipe(id: string): MembroEquipe | undefined {
  return EQUIPE.find((m) => m.id === id);
}
