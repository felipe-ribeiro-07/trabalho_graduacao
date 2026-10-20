import { SimeiCnaeGeralRepositoryImp } from '../../infrastructure/out/database/sequelize/repositories/SimeiCnaeGeralRepositoryImp';

export class RankingNacionalSimeiUseCase {
  constructor(private repository: SimeiCnaeGeralRepositoryImp) {}

  async execute() {
    return this.repository.rankingNacionalEstados();
  }
}