// Equipe interna (RH e TI). Modo de testes: cada pessoa entra clicando no nome.
export type MembroEquipe = {
  id: string;
  nome: string;
  perfil: "rh" | "ti";
  papel: string;
};

export const EQUIPE: MembroEquipe[] = [
  { id: "lynn", nome: "Lynn", perfil: "rh", papel: "Coordenadora" },
  { id: "fran", nome: "Fran", perfil: "rh", papel: "Estagiária" },
  { id: "sydnare", nome: "Sydnare", perfil: "ti", papel: "Analista de TI" },
  { id: "ana-carolina", nome: "Ana Carolina", perfil: "ti", papel: "Analista de TI" },
  { id: "daniel", nome: "Daniel", perfil: "ti", papel: "TI" },
  { id: "jefferson", nome: "Jefferson", perfil: "ti", papel: "TI" },
  { id: "marcelo", nome: "Marcelo", perfil: "ti", papel: "TI" },
];

export function membroEquipe(id: string): MembroEquipe | undefined {
  return EQUIPE.find((m) => m.id === id);
}
