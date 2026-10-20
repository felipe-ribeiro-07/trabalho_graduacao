// src/application/ports/ISimeiCnaeEstadoRepository.ts

export interface SimeiCnaeComDescricao {
  estado: string;
  municipio: string;
  ano: string | number;
  cnae: string;
  descricao: string | null;
  total: number;
}

export interface TopCnaeEstado {
  cnae: string;
  descricao: string | null;
  total_estado: number;
}

export interface TotalSimeiPorMunicipio {
  municipio: string;
  total_geral: number;
}

export interface DistribuicaoCnaeMunicipio {
  municipio: string;
  descricao: string | null;
  total: number;
}

export interface ISimeiCnaeEstadoRepository {
  /**
   * Lista os registros brutos do estado já com a descrição do CNAE através do JOIN.
   */
  listarComDescricao(limit?: number, offset?: number): Promise<SimeiCnaeComDescricao[]>;

  /**
   * Retorna os CNAEs que possuem o maior número acumulado de ocorrências em todo o estado.
   */
  topCnaesEstado(limit?: number): Promise<TopCnaeEstado[]>;

  /**
   * Retorna o total geral de MEIs (soma das ocorrências de todos os CNAEs) agrupado por município.
   */
  totalPorMunicipio(): Promise<TotalSimeiPorMunicipio[]>;

  /**
   * Mostra a força de um CNAE específico em cada município do estado.
   */
  distribuicaoCnaePorMunicipio(cnae: string): Promise<DistribuicaoCnaeMunicipio[]>;
}