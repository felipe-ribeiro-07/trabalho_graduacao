// src/application/use-cases/AcampamentosTuristicos/RankingPorMunicipioUseCase.ts
import { IAcampamentosTuristicosRepository, TotalPorMunicipio } from '../../ports/IAcampamentosTuristicosRepository';

interface RankingPorMunicipioInput {
  uf?: string;
  ano?: number | null;
}

export class RankingPorMunicipioUseCase {
  constructor(private repository: IAcampamentosTuristicosRepository) {}

  async execute({ uf, ano = null }: RankingPorMunicipioInput = {}): Promise<TotalPorMunicipio[]> {
    return this.repository.totalPorMunicipio(uf, ano);
  }
}