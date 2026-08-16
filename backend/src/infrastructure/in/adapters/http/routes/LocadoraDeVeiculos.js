// src/infrastructure/in/adapters/http/routes/AcampamentoTuristico.js
const router = require('express').Router();

// =========================================
// Rotas novas: dashboard (métricas consolidadas)
// ==========================================
const LocadoraDeVeiculosConsolidadoRepositoryImp = require('../../../../out/database/sequelize/repositories/LocadoraDeVeiculosRepositoryImpl');
const { EvolucaoAnualUseCase } = require('../../../../../application/use-cases/EvolucaoAnualUseCase');
const { RankingPorUFUseCase } = require('../../../../../application/use-cases/RankingPorUFUseCase');
const { RankingPorMunicipioUseCase } = require('../../../../../application/use-cases/RankingPorMunicipioUseCase');
const { CompararAnosUseCase } = require('../../../../../application/use-cases/ComparaPorAnoUseCase');
const { UltimosCincoAnosUseCase } = require('../../../../../application/use-cases/CompararAnosPorUFUseCase');
const { EvolucaoAnualPorUfUseCase } = require('../../../../../application/use-cases/EvolucaoAnualUFUseCase');
const { AcumuladoMuncipalUseCase } = require('../../../../../application/use-cases/AcumuladoMunicipalUSeCase');
const { DashboardController } = require('../controllers/DashboardController');

const repositoryConsolidado = new LocadoraDeVeiculosConsolidadoRepositoryImp();
const dashboardController = new DashboardController({
  evolucaoAnual: new EvolucaoAnualUseCase(repositoryConsolidado),
  rankingUF: new RankingPorUFUseCase(repositoryConsolidado),
  rankingMunicipio: new RankingPorMunicipioUseCase(repositoryConsolidado),
  compararAnos: new CompararAnosUseCase(repositoryConsolidado),
  ultimosCincoAnos: new UltimosCincoAnosUseCase(repositoryConsolidado),
  evolucaoAnualPorUf: new EvolucaoAnualPorUfUseCase(repositoryConsolidado),
  acumuladoMuncipal: new AcumuladoMuncipalUseCase(repositoryConsolidado),
});

router.get('/evolucao-anual', (req, res) => dashboardController.handleEvolucaoAnual(req, res));
router.get('/ranking-uf', (req, res) => dashboardController.handleRankingUF(req, res));
router.get('/ranking-municipio', (req, res) => dashboardController.handleRankingMunicipio(req, res));
router.get('/comparar-anos', (req, res) => dashboardController.handleCompararAnos(req, res));
router.get('/ultimos-cinco-anos', (req, res) => dashboardController.handleUltimosCincoAnos(req, res));
router.get('/evolucao-anual-uf', (req, res) => dashboardController.handleEvolucaoAnualPorUf(req, res));
router.get('/acumulado-anual-municipio', (req, res) => dashboardController.handleAcumuladoMuncipal(req, res));

module.exports = router;