// src/application/use-cases/SimeiCnaeEstado/DistribuicaoCnaePorMunicipioUseCase.ts

import { 
  ISimeiCnaeEstadoRepository, 
  DistribuicaoCnaeMunicipio 
} from '@application/ports/ISimeiCNAESSIMEI';

export class DistribuicaoCnaePorMunicipioUseCase {
  constructor(private repository: ISimeiCnaeEstadoRepository) {}

  async execute(cnae: string): Promise<DistribuicaoCnaeMunicipio[]> {
    if (!cnae || typeof cnae !== 'string' || cnae.trim() === '') {
      throw new Error('O código CNAE informado é obrigatório e deve ser uma string válida');
    }

    // Opcional: Aqui você pode adicionar uma limpeza caso o frontend envie com máscara
    const cnaeLimpo = cnae.replace(/[^0-9]/g, '');

    return this.repository.distribuicaoCnaePorMunicipio(cnaeLimpo);
  }
}