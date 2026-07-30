// src/application/use-cases/AcampamentosTuristicos/EvolucaoAnualPorUfUseCase.ts
import {
  IAcampamentosTuristicosRepository,
  TotalPorAno,
} from '../../ports/IAcampamentosTuristicosRepository';

export interface EvolucaoAnualFiltros {
  uf?: string;
}

export class EvolucaoAnualPorUfUseCase {
  constructor(private repository: IAcampamentosTuristicosRepository) {}

  async execute(filtros: EvolucaoAnualFiltros = {}): Promise<TotalPorAno[]> {
    const { uf } = filtros;

    const resultado: TotalPorAno[] = (await this.repository.evolucaoAnualUF({ uf })) as TotalPorAno[];

    return resultado
      .map((item) => ({ 
        ano: Number(item.ano), 
        total: Number(item.total) 
      }))
      .sort((a, b) => a.ano - b.ano); 
  }
}