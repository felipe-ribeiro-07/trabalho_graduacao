// src/infrastructure/in/adapters/http/routes/AcampamentoTuristico.js
const router = require('express').Router();

// =========================================
// Rotas novas: dashboard (métricas consolidadas)
// ==========================================
const AcampamentoConsolidadoRepositoryImp = require('../../../../out/database/sequelize/repositories/AcampamentoTuristicosRepositoryImpl');
const { EvolucaoAnualUseCase } = require('../../../../../application/use-cases/AcampamentosTuristicos/EvolucaoAnualUseCase');
const { RankingPorUFUseCase } = require('../../../../../application/use-cases/AcampamentosTuristicos/RankingPorUFUseCase');
const { RankingPorMunicipioUseCase } = require('../../../../../application/use-cases/AcampamentosTuristicos/RankingPorMunicipioUseCase');
const { CompararAnosUseCase } = require('../../../../../application/use-cases/AcampamentosTuristicos/ComparaPorAnoUseCase');
const { UltimosCincoAnosUseCase } = require('../../../../../application/use-cases/AcampamentosTuristicos/CompararAnosPorUFUseCase');
const {EvolucaoAnualPorUfUseCase} = require('../../../../../application/use-cases/AcampamentosTuristicos/EvolucaoAnualUFUseCase')
const { DashboardController } = require('../controllers/AcampamentosTuristicosController'); // esse é o .ts que corrigimos agora

const repositoryConsolidado = new AcampamentoConsolidadoRepositoryImp();
const dashboardController = new DashboardController({
  evolucaoAnual: new EvolucaoAnualUseCase(repositoryConsolidado),
  rankingUF: new RankingPorUFUseCase(repositoryConsolidado),
  rankingMunicipio: new RankingPorMunicipioUseCase(repositoryConsolidado),
  compararAnos: new CompararAnosUseCase(repositoryConsolidado),
  ultimosCincoAnos: new UltimosCincoAnosUseCase(repositoryConsolidado),
  evolucaoAnualPorUf: new EvolucaoAnualPorUfUseCase(repositoryConsolidado)
});

router.get('/evolucao-anual', (req, res) => dashboardController.handleEvolucaoAnual(req, res));
router.get('/ranking-uf', (req, res) => dashboardController.handleRankingUF(req, res));
router.get('/ranking-municipio', (req, res) => dashboardController.handleRankingMunicipio(req, res));
router.get('/comparar-anos', (req, res) => dashboardController.handleCompararAnos(req, res));
router.get('/ultimos-cinco-anos', (req, res) => dashboardController.handleUltimosCincoAnos(req, res));
router.get('/evolucao-anual-uf', (req, res) => dashboardController.handleEvolucaoAnualPorUf(req, res));


module.exports = router;