// src/application/use-cases/AcampamentosTuristicos/RankingPorUFUseCase.ts
import { IAcampamentosTuristicosRepository, TotalPorUF } from '../../ports/IAcampamentosTuristicosRepository';

export class RankingPorUFUseCase {
  constructor(private repository: IAcampamentosTuristicosRepository) {}

  async execute(ano: number | null = null): Promise<TotalPorUF[]> {
    return this.repository.totalPorUF(ano);
  }
}