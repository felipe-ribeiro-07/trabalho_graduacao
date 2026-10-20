// src/infrastructure/in/adapters/http/routes/SimeiCnaeRoutes.ts

import { Router } from 'express';
import { SimeiCnaeController } from '../controllers/SimeiCnaeController';

const router = Router();
const simeiController = new SimeiCnaeController();

// =========================================================================
// Rotas SIMEI CNAE (Dinâmicas por /Estado)
// O parâmetro ":tabela" permite que a mesma rota sirva para qualquer /estado.
// Exemplo de ":tabela": simei_cnae_acre_2026, simei_cnae_sao_paulo_2026
// =========================================================================



// 1. Listagem completa paginada (com JOIN da descrição do CNAE)
// Exemplo: GET /api/simei/simei_cnae_acre_2026/listar?limit=50&offset=0
router.get('/estado/:tabela/listar', (req, res) => simeiController.handleListarComDescricao(req, res));

// 2. Ranking dos CNAEs mais frequentes no /estado
// Exemplo: GET /api/simei/simei_cnae_acre_2026/top-cnaes?limit=10
router.get('/estado/:tabela/top-cnaes', (req, res) => simeiController.handleTopCnaesEstado(req, res));

// 3. Totais gerais de MEIs agrupados por município dentro de um estado
// Exemplo: GET /api/simei/simei_cnae_acre_2026/municipios
router.get('/estado/:tabela/municipios', (req, res) => simeiController.handleTotalPorMunicipio(req, res));

// 4. Força de um CNAE específico em cada município do /estado
// Exemplo: GET /api/simei/simei_cnae_acre_2026/distribuicao?cnae=5611203
router.get('/estado/:tabela/distribuicao', (req, res) => simeiController.handleDistribuicaoCnae(req, res));

// 5. Acumulado geral nacional separado por estado
router.get('/nacional/ranking', (req, res) => simeiController.handleRankingNacional(req, res));


export default router;