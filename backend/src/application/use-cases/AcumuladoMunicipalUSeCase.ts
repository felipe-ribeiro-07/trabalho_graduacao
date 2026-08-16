// src/application/use-cases/AcampamentosTuristicos/AcumuladoMunicipalUSeCase.ts
import { IAcampamentosTuristicosRepository, AcumuladoMuncipal } from '@application/ports/IAcampamentosTuristicosRepository';

export class AcumuladoMuncipalUseCase {
  constructor(private repository: IAcampamentosTuristicosRepository) {}

  async execute(municipio: string): Promise<AcumuladoMuncipal[]> {
    if (!municipio || typeof municipio !== 'string' || municipio.trim() === '') {
      throw new Error('O município informado é obrigatório');
    }

    return this.repository.acumuladoAnualMunicipio(municipio);
  }
}