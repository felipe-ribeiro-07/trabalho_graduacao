// src/application/use-cases/SimeiCnaeEstado/ListarCnaesComDescricaoUseCase.ts

import { 
  ISimeiCnaeEstadoRepository, 
  SimeiCnaeComDescricao 
} from '@application/ports/ISimeiCNAESSIMEI';

export class ListarCnaesComDescricaoUseCase {
  constructor(private repository: ISimeiCnaeEstadoRepository) {}

  async execute(limit: number = 100, offset: number = 0): Promise<SimeiCnaeComDescricao[]> {
    if (limit < 0 || offset < 0) {
      throw new Error('Os valores de limit e offset devem ser maiores ou iguais a zero');
    }

    return this.repository.listarComDescricao(limit, offset);
  }
}