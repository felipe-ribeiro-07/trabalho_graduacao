import type { Serie, ServicoPainel } from '../types/servicoPainel.ts';

/**
 * Formato dos services atuais (nomes herdados de "Acampamentos" por copiar/colar).
 * Quando renomear os métodos nos services, troque por ServicoPainel e apague este arquivo.
 */
export interface ServicoLegado {
  EvolucaoAnualAcampamentos(): Promise<Serie[]>;
  RankingAcampamentos(ano: string): Promise<Serie[]>;
  RankingEstados(): Promise<Serie[]>;
  RankingMunicipal(p: { uf: string }): Promise<Serie[]>;
  UltimosCincoAnos(p: { uf: string }): Promise<Serie[]>;
  TodosAnosUF(p: { uf: string }): Promise<Serie[]>;
  AcumuladoAnualMunicipio(nome: string): Promise<Serie[]>;
}

/**
 * Chame FORA do componente (nível do módulo): o resultado precisa ter
 * referência estável, senão os efeitos dos hooks re-executam a cada render.
 */
export function adaptarServicoLegado(s: ServicoLegado): ServicoPainel {
  return {
    EvolucaoAnual: () => s.EvolucaoAnualAcampamentos(),
    Ranking: (ano) => s.RankingAcampamentos(ano),
    RankingEstados: () => s.RankingEstados(),
    RankingMunicipal: (p) => s.RankingMunicipal(p),
    UltimosCincoAnos: (p) => s.UltimosCincoAnos(p),
    TodosAnosUF: (p) => s.TodosAnosUF(p),
    AcumuladoAnualMunicipio: (nome) => s.AcumuladoAnualMunicipio(nome),
  };
}