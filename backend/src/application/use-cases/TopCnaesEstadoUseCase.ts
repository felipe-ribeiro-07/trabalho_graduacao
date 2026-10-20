// src/application/use-cases/SimeiCnaeEstado/TopCnaesEstadoUseCase.ts

import { 
  ISimeiCnaeEstadoRepository, 
  TopCnaeEstado 
} from '@application/ports/ISimeiCNAESSIMEI';

export class TopCnaesEstadoUseCase {
  constructor(private repository: ISimeiCnaeEstadoRepository) {}

  async execute(limit: number = 10): Promise<TopCnaeEstado[]> {
    if (limit <= 0) {
      throw new Error('O limite de resultados deve ser maior que zero');
    }

    return this.repository.topCnaesEstado(limit);
  }
}