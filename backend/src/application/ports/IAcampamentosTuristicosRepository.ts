// src/application/ports/IAcampamentosTuristicosRepository.ts

export interface TotalPorAno {
  ano: number;
  total: number;
}

export interface TotalPorUF {
  uf: string;
  total: number;
}

export interface FiltrosUltimosCincoAnos {
  uf?: string;
  ano?: number | number[];
}

export interface TotalPorAno {
  ano: number;
  total: number;
}

export interface TotalPorMunicipio {
  municipio: string;
  uf: string;
  total: number;
}


export interface IAcampamentosTuristicosRepository {
  evolucaoAnualUF(arg0: { uf: string | undefined; }): unknown;
  totalPorAno(): Promise<TotalPorAno[]>;
  totalPorUF(ano?: number | null): Promise<TotalPorUF[]>;
  totalPorMunicipio(uf?: string | null, ano?: number | null): Promise<TotalPorMunicipio[]>;
  compararAnos(anos: number[]): Promise<TotalPorAno[]>;
  totalAcumulado(filtros?: { uf?: string; municipio?: string }): Promise<number>;
  ultimosCincoAnos(filtros: FiltrosUltimosCincoAnos): Promise<TotalPorAno[]>;
}
