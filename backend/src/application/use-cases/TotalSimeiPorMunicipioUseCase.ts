// src/application/use-cases/SimeiCnaeEstado/TotalSimeiPorMunicipioUseCase.ts

import { 
  ISimeiCnaeEstadoRepository, 
  TotalSimeiPorMunicipio 
} from '@application/ports/ISimeiCNAESSIMEI';

export class TotalSimeiPorMunicipioUseCase {
  constructor(private repository: ISimeiCnaeEstadoRepository) {}

  async execute(): Promise<TotalSimeiPorMunicipio[]> {
    return this.repository.totalPorMunicipio();
  }
}