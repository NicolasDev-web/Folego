export type Municipality = {
  id: string;
  name: string;
  region: string;
};

// Lista de navegação do piloto de UX. Não contém resultados analíticos.
export const municipalities: Municipality[] = [
  { id: "fortaleza", name: "Fortaleza", region: "Região Metropolitana" },
  { id: "sobral", name: "Sobral", region: "Norte Cearense" },
  { id: "juazeiro-do-norte", name: "Juazeiro do Norte", region: "Cariri" },
  { id: "caucaia", name: "Caucaia", region: "Região Metropolitana" },
  { id: "maracanau", name: "Maracanaú", region: "Região Metropolitana" },
  { id: "crato", name: "Crato", region: "Cariri" },
  { id: "itapipoca", name: "Itapipoca", region: "Norte Cearense" },
  { id: "quixada", name: "Quixadá", region: "Sertões Cearenses" },
];

