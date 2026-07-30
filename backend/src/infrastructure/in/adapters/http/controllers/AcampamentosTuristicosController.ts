// src/infrastructure/in/adapters/http/controllers/AcampamentosTuristicosController.ts
import { Request, Response } from 'express';
import { EvolucaoAnualUseCase } from '../../../../../application/use-cases/AcampamentosTuristicos/EvolucaoAnualUseCase';
import { RankingPorUFUseCase } from '../../../../../application/use-cases/AcampamentosTuristicos/RankingPorUFUseCase';
import { RankingPorMunicipioUseCase } from '../../../../../application/use-cases/AcampamentosTuristicos/RankingPorMunicipioUseCase';
import { CompararAnosUseCase } from '../../../../../application/use-cases/AcampamentosTuristicos/ComparaPorAnoUseCase';
import { UltimosCincoAnosUseCase } from '../../../../../application/use-cases/AcampamentosTuristicos/CompararAnosPorUFUseCase';
import {EvolucaoAnualPorUfUseCase} from '../../../../../application/use-cases/AcampamentosTuristicos/EvolucaoAnualUFUseCase'

interface DashboardControllerDeps {
  evolucaoAnual: EvolucaoAnualUseCase;
  rankingUF: RankingPorUFUseCase;
  rankingMunicipio: RankingPorMunicipioUseCase;
  compararAnos: CompararAnosUseCase;
  ultimosCincoAnos: UltimosCincoAnosUseCase;
  evolucaoAnualPorUf: EvolucaoAnualPorUfUseCase;
}

export class DashboardController {
  private evolucaoAnual: EvolucaoAnualUseCase;
  private rankingUF: RankingPorUFUseCase;
  private rankingMunicipio: RankingPorMunicipioUseCase;
  private compararAnos: CompararAnosUseCase;
  private ultimosCincoAnos: UltimosCincoAnosUseCase;
  private evolucaoAnualPorUf: EvolucaoAnualPorUfUseCase;


  constructor(deps: DashboardControllerDeps) {
    this.evolucaoAnual = deps.evolucaoAnual;
    this.rankingUF = deps.rankingUF;
    this.rankingMunicipio = deps.rankingMunicipio;
    this.compararAnos = deps.compararAnos;
    this.ultimosCincoAnos = deps.ultimosCincoAnos;
    this.evolucaoAnualPorUf = deps.evolucaoAnualPorUf;
  }

  async handleEvolucaoAnual(req: Request, res: Response): Promise<Response> {
    try {
      const resultado = await this.evolucaoAnual.execute();
      return res.json(resultado);
    } catch (error) {
      console.error('Erro em handleEvolucaoAnual:', error);
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      return res.status(500).json({ error: message });
    }
  }

  async handleRankingUF(req: Request, res: Response): Promise<Response> {
    try {
      const { ano } = req.query;
      const resultado = await this.rankingUF.execute(ano ? Number(ano) : null);
      return res.json(resultado);
    } catch (error) {
      console.error('Erro em handleRankingUF:', error);
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      return res.status(500).json({ error: message });
    }
  }

  async handleRankingMunicipio(req: Request, res: Response): Promise<Response> {
    try {
      const { uf, ano } = req.query;
      const resultado = await this.rankingMunicipio.execute({
        uf: uf as string | undefined,
        ano: ano ? Number(ano) : null,
      });
      return res.json(resultado);
    } catch (error) {
      console.error('Erro em handleRankingMunicipio:', error);
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      return res.status(500).json({ error: message });
    }
  }

  async handleCompararAnos(req: Request, res: Response): Promise<Response> {
    try {
      const anosParam = String(req.query.anos ?? '');
      const anos = anosParam
        .split(',')
        .map(Number)
        .filter((n) => !Number.isNaN(n));
      const resultado = await this.compararAnos.execute(anos);
      return res.json(resultado);
    } catch (error) {
      console.error('Erro em handleCompararAnos:', error);
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      return res.status(500).json({ error: message });
    }
  }

  async handleUltimosCincoAnos(req: Request, res: Response): Promise<Response> {
    try {
      const { uf } = req.query;
      const anosParam = req.query.anos ? String(req.query.anos) : null;

      let ano: number | number[] | undefined;

      if (anosParam) {
        const anosArray = anosParam
          .split(',')
          .map(Number)
          .filter((n) => !Number.isNaN(n));

        if (anosArray.length === 0) {
          return res.status(400).json({ error: 'Parâmetro "anos" inválido' });
        }

        ano = anosArray.length === 1 ? anosArray[0] : anosArray;
      }

      const resultado = await this.ultimosCincoAnos.execute({
        uf: uf as string | undefined,
        ano,
      });

      return res.json(resultado);
    } catch (error) {
      console.error('Erro em handleUltimosCincoAnos:', error);
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      return res.status(500).json({ error: message });
    }
  }

  async handleEvolucaoAnualPorUf(req: Request, res: Response): Promise<Response> {
    try {
      const { uf } = req.query;
      const resultado = await this.evolucaoAnualPorUf.execute({ uf: uf as string | undefined });
      return res.json(resultado);
    } catch (error) {
      console.error('Erro em handleEvolucaoAnualPorUf:', error);
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      return res.status(500).json({ error: message });
    }
  }
}

export default DashboardController;