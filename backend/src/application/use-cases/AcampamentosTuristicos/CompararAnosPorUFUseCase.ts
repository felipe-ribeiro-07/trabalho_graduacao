// src/application/use-cases/AcampamentosTuristicos/UltimosCincoAnosUseCase.ts
import {
  IAcampamentosTuristicosRepository,
  TotalPorAno,
  FiltrosUltimosCincoAnos,
} from '../../ports/IAcampamentosTuristicosRepository';

export class UltimosCincoAnosUseCase {
  constructor(private repository: IAcampamentosTuristicosRepository) {}

  async execute(filtros: FiltrosUltimosCincoAnos = {}): Promise<TotalPorAno[]> {
    const { uf, ano } = filtros;

    if (ano !== undefined) {
      if (Array.isArray(ano)) {
        if (ano.some((a) => !Number.isInteger(a))) {
          throw new Error('Todos os anos informados devem ser números inteiros');
        }
      } else if (!Number.isInteger(ano)) {
        throw new Error('O ano informado deve ser um número inteiro');
      }
    }

    const resultado = await this.repository.ultimosCincoAnos({ uf, ano });

    return resultado
      .map((item) => ({ ano: Number(item.ano), total: Number(item.total) }))
      .sort((a, b) => a.ano - b.ano); // do mais antigo pro mais recente, pronto pro gráfico
  }
}