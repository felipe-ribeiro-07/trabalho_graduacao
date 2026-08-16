// src/application/use-cases/AcampamentosTuristicos/EvolucaoAnualUseCase.ts
import { IAcampamentosTuristicosRepository, TotalPorAno } from '../../ports/IAcampamentosTuristicosRepository';

export class EvolucaoAnualUseCase {
  constructor(private repository: IAcampamentosTuristicosRepository) {}

  async execute(): Promise<TotalPorAno[]> {
    return this.repository.totalPorAno();
  }
}