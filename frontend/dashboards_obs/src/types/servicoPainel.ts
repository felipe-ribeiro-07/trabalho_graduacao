// TODO: troque `any` pelos tipos reais retornados pelos services.
export type Serie = any;

export interface RankingUF {
  uf: string;
  total: number;
  regiao?: string;
}

/**
 * Contrato que cada service precisa cumprir para usar o <PainelTurismo />.
 * Se o service tiver nomes diferentes, crie um adaptador na página (veja pages/*).
 */
export interface ServicoPainel {
  EvolucaoAnual(): Promise<Serie[]>;
  Ranking(ano: string): Promise<Serie[]>;
  RankingEstados(): Promise<Serie[]>;
  RankingMunicipal(p: { uf: string }): Promise<Serie[]>;
  UltimosCincoAnos(p: { uf: string }): Promise<Serie[]>;
  TodosAnosUF(p: { uf: string }): Promise<Serie[]>;
  AcumuladoAnualMunicipio(nome: string): Promise<Serie[]>;
}