import { IAcampamentosTuristicosRepository, TotalPorAno } from '../ports/IAcampamentosTuristicosRepository';

export class CompararAnosUseCase {
  constructor(private repository: IAcampamentosTuristicosRepository) {}

  async execute(anos: number[]): Promise<TotalPorAno[]> {
    if (!Array.isArray(anos) || anos.length < 2) {
      throw new Error('Informe ao menos 2 anos para comparação');
    }
    return this.repository.compararAnos(anos);
  }
}