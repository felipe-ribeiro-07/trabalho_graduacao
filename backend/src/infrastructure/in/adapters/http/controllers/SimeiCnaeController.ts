// src/infrastructure/in/adapters/http/controllers/SimeiCnaeController.ts

import { Request, Response } from 'express';

// Ajuste os caminhos conforme a sua estrutura real de pastas
import SimeiCnaeEstadoRepositoryImp from '../../../../out/database/sequelize/repositories/SimeiCNAESRepositoryImpl';
import { ListarCnaesComDescricaoUseCase } from '../../../../../application/use-cases/SimeiCnaePorEstadoUseCase';
import { TopCnaesEstadoUseCase } from '../../../../../application/use-cases/TopCnaesEstadoUseCase';
import { TotalSimeiPorMunicipioUseCase } from '../../../../../application/use-cases/TotalSimeiPorMunicipioUseCase';
import { DistribuicaoCnaePorMunicipioUseCase } from '../../../../../application/use-cases/DistribuicaoCnaePorMunicipioUseCase';
import { SimeiCnaeGeralRepositoryImp } from '../../../../out/database/sequelize/repositories/SimeiCnaeGeralRepositoryImp';
import { RankingNacionalSimeiUseCase } from '../../../../../application/use-cases/RankingNacionalSimeiUseCase';

export class SimeiCnaeController {
  /**
   * Factory interna: Instancia o repositório dinamicamente com base na
   * tabela solicitada e injeta as dependências nos Use Cases.
   */
  private buildUseCases(tabela: string) {
    if (!tabela) throw new Error('O nome da tabela do estado é obrigatório.');

    const repository = new SimeiCnaeEstadoRepositoryImp(tabela);

    return {
      listarComDescricao: new ListarCnaesComDescricaoUseCase(repository),
      topCnaes: new TopCnaesEstadoUseCase(repository),
      totalPorMunicipio: new TotalSimeiPorMunicipioUseCase(repository),
      distribuicaoCnae: new DistribuicaoCnaePorMunicipioUseCase(repository),
    };
  }

  async handleRankingNacional(req: Request, res: Response): Promise<Response> {
    try {
      const repository = new SimeiCnaeGeralRepositoryImp();
      const useCase = new RankingNacionalSimeiUseCase(repository);

      const resultado = await useCase.execute();

      return res.json(resultado);
    } catch (error) {
      console.error('Erro em handleRankingNacional:', error);
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      return res.status(500).json({ error: message });
    }
  }

  async handleListarComDescricao(req: Request, res: Response): Promise<Response> {
    try {
      const { tabela } = req.params as { tabela: string };
      const limit = req.query.limit ? Number(req.query.limit) : 100;
      const offset = req.query.offset ? Number(req.query.offset) : 0;

      const { listarComDescricao } = this.buildUseCases(tabela);
      const resultado = await listarComDescricao.execute(limit, offset);

      return res.json(resultado);
    } catch (error) {
      console.error('Erro em handleListarComDescricao:', error);
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      return res.status(500).json({ error: message });
    }
  }

  async handleTopCnaesEstado(req: Request, res: Response): Promise<Response> {
    try {
      const { tabela } = req.params as { tabela: string };
      const limit = req.query.limit ? Number(req.query.limit) : 10;

      const { topCnaes } = this.buildUseCases(tabela);
      const resultado = await topCnaes.execute(limit);

      return res.json(resultado);
    } catch (error) {
      console.error('Erro em handleTopCnaesEstado:', error);
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      return res.status(500).json({ error: message });
    }
  }

  async handleTotalPorMunicipio(req: Request, res: Response): Promise<Response> {
    try {
      const { tabela } = req.params as { tabela: string };

      const { totalPorMunicipio } = this.buildUseCases(tabela);
      const resultado = await totalPorMunicipio.execute();

      return res.json(resultado);
    } catch (error) {
      console.error('Erro em handleTotalPorMunicipio:', error);
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      return res.status(500).json({ error: message });
    }
  }

  async handleDistribuicaoCnae(req: Request, res: Response): Promise<Response> {
    try {
      const { tabela } = req.params as { tabela: string };
      const cnae = String(req.query.cnae ?? '');

      const { distribuicaoCnae } = this.buildUseCases(tabela);
      const resultado = await distribuicaoCnae.execute(cnae);

      return res.json(resultado);
    } catch (error) {
      console.error('Erro em handleDistribuicaoCnae:', error);
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      return res.status(500).json({ error: message });
    }
  }
}

export default SimeiCnaeController;
