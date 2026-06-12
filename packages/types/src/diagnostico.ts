export type DiagnosticoItem = {
  nome: string;
  ok: boolean;
  valor: string;
  dica: string | null;
};

export type DiagnosticoData = {
  resultados: DiagnosticoItem[];
};
