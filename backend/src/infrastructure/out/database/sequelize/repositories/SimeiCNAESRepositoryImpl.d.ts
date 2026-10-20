// Declarações de tipos para o repositório em JavaScript (SimeiCNAESRepositoryImpl.js)
import type { ISimeiCnaeEstadoRepository } from '../../../../../application/ports/ISimeiCNAESSIMEI';

declare class SimeiCnaeEstadoRepositoryImp implements ISimeiCnaeEstadoRepository {
  constructor(nomeTabela: string);
  listarComDescricao(
    limit?: number,
    offset?: number
  ): Promise<import('../../../../../application/ports/ISimeiCNAESSIMEI').SimeiCnaeComDescricao[]>;
  topCnaesEstado(
    limit?: number
  ): Promise<import('../../../../../application/ports/ISimeiCNAESSIMEI').TopCnaeEstado[]>;
  totalPorMunicipio(): Promise<
    import('../../../../../application/ports/ISimeiCNAESSIMEI').TotalSimeiPorMunicipio[]
  >;
  distribuicaoCnaePorMunicipio(
    cnae: string
  ): Promise<
    import('../../../../../application/ports/ISimeiCNAESSIMEI').DistribuicaoCnaeMunicipio[]
  >;
}

export default SimeiCnaeEstadoRepositoryImp;
