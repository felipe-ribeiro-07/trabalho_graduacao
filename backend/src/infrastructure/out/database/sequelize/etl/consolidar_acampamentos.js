/**
 * ETL: consolida as tabelas anuais de acampamentos turísticos (2008–2026)
 * numa única tabela `tb_acampamentos_consolidado`, usada pelos dashboards.
 *
 * Cada tabela de origem tem um schema diferente (o CADASTUR mudou o layout
 * várias vezes ao longo dos anos), então cada uma tem seu próprio "mapper"
 * que traduz as colunas da fonte para o formato único da consolidada.
 *
 * Rodar com: node src/infra/database/sequelize/etl/consolidar_acampamentos.js
 */

const sequelize = require('../../config/supabase'); // ajuste o caminho conforme seu projeto
const { QueryTypes } = require('sequelize');

// ---------------------------------------------------------------------------
// 1. Configuração: uma entrada por tabela de origem, com o mapper específico
// ---------------------------------------------------------------------------

/**
 * Cada mapper recebe uma linha crua (objeto vindo do SELECT *) e devolve
 * um objeto já no formato da tabela consolidada.
 */
const TABELAS_ORIGEM = [
  {
    tabela: 'tb_acampamentos_turisticos_2008',
    ano: 2008,
    mapper: (r) => ({
      razao_social: r.razao_social,
      nome_fantasia: r.nome_fantasia,
      cnpj: r.cnpj,
      porte: r.porte,
      situacao: r.situacao,
      segmento: r.segmento,
      uf: r.uf,
      municipio: r.municipio,
      data_inicio_operacao: null, // não existe nessa tabela
    }),
  },

  // 2009 a 2017 seguem o mesmo layout "antigo" (CSV clássico do CADASTUR)
  ...([2009, 2010, 2011, 2012, 2013, 2014, 2015].map((ano) => ({
    tabela: `tb_acampamentos_turisticos_${ano}`,
    ano,
    mapper: (r) => ({
      razao_social: r.razao_social,
      nome_fantasia: r.nome_fantasia,
      cnpj: r.cnpj,
      porte: r.porte,
      situacao: r.situacao,
      segmento: r.segmentos_turisticos,
      uf: r.uf,
      municipio: r.localidade,
      data_inicio_operacao: r.data_inicio_operacao,
    }),
  }))),

  ...([2016, 2017].map((ano) => ({
    tabela: `tb_acampamentos_turisticos_${ano}_t4`,
    ano,
    mapper: (r) => ({
      razao_social: r.razao_social,
      nome_fantasia: r.nome_fantasia,
      cnpj: r.cnpj,
      porte: r.porte,
      situacao: r.situacao,
      segmento: r.segmentos_turisticos,
      uf: r.uf,
      municipio: r.localidade,
      data_inicio_operacao: r.data_inicio_operacao,
    }),
  }))),

  // 2018 a 2020: layout novo, sem coluna "segmento" própria — usamos "atividade"
  ...([2018, 2019].map((ano) => ({
    tabela: `tb_acampamentos_turisticos_${ano}_t4`,
    ano,
    mapper: (r) => ({
      razao_social: r.razao_social,
      nome_fantasia: r.nome_fantasia,
      cnpj: r.cnpj,
      porte: r.porte,
      situacao: r.situacao,
      segmento: r.atividade,
      uf: r.uf,
      municipio: r.localidade,
      data_inicio_operacao: r.data_inicio_operacao,
    }),
  }))),

  {
    tabela: 'tb_acampamentos_turisticos_2020_t4',
    ano: 2020,
    mapper: (r) => ({
      razao_social: r.razao_social,
      nome_fantasia: r.nome_fantasia,
      cnpj: r.cnpj,
      porte: r.porte,
      situacao: r.situacao,
      segmento: r.atividade,
      uf: r.uf,
      municipio: r.localidade,
      data_inicio_operacao: r.data_inicio_operacao,
    }),
  },

  // 2021: layout com razão social e situação da atividade separada
  {
    tabela: 'tb_acampamentos_turisticos_2021_t4',
    ano: 2021,
    mapper: (r) => ({
      razao_social: r.razao_social,
      nome_fantasia: r.nome_fantasia,
      cnpj: r.cnpj,
      porte: r.porte,
      situacao: r.situacao_atividade,
      segmento: r.atividade_turistica,
      uf: r.uf,
      municipio: r.municipio,
      data_inicio_operacao: r.data_abertura,
    }),
  },

  // 2022 e 2023: layout enxuto — sem razão social separada, sem situação, sem porte
  ...([2022, 2023].map((ano) => ({
    tabela: `tb_acampamentos_turisticos_${ano}_t4`,
    ano,
    mapper: (r) => ({
      razao_social: r.nome_fantasia, // não existe razao_social nesse layout
      nome_fantasia: r.nome_fantasia,
      cnpj: r.cnpj,
      porte: null, // não existe nesse layout
      situacao: null, // não existe nesse layout
      segmento: r.atividade_turistica,
      uf: r.uf,
      municipio: r.municipio,
      data_inicio_operacao: r.data_abertura,
    }),
  }))),

  // 2024 e 2025: layout completo de novo (com situação e porte)
  ...([2024, 2025].map((ano) => ({
    tabela: `tb_acampamentos_turisticos_${ano}_t4`,
    ano,
    mapper: (r) => ({
      razao_social: r.nome_fantasia, // esse layout também não tem razao_social própria
      nome_fantasia: r.nome_fantasia,
      cnpj: r.cnpj,
      porte: r.porte,
      situacao: r.situacao_atividade,
      segmento: r.atividade_turistica,
      uf: r.uf,
      municipio: r.municipio,
      data_inicio_operacao: r.data_abertura,
    }),
  }))),

  // 2026: igual 2024/2025, mas sem situacao_cadastral (usamos situacao_atividade mesmo)
  {
    tabela: 'tb_acampamentos_turisticos_2026_t1',
    ano: 2026,
    mapper: (r) => ({
      razao_social: r.nome_fantasia,
      nome_fantasia: r.nome_fantasia,
      cnpj: r.cnpj,
      porte: r.porte,
      situacao: r.situacao_atividade,
      segmento: r.atividade_turistica,
      uf: r.uf,
      municipio: r.municipio,
      data_inicio_operacao: r.data_abertura,
    }),
  },
];

// ---------------------------------------------------------------------------
// 2. Utilitário: converte qualquer valor de data para 'YYYY-MM-DD' ou null
// ---------------------------------------------------------------------------

function normalizarData(valor) {
  if (!valor) return null;
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return null;
  return data.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// 3. Execução do ETL
// ---------------------------------------------------------------------------

async function consolidarTabela({ tabela, ano, mapper }) {
  const linhas = await sequelize.query(`SELECT * FROM ${tabela}`, {
    type: QueryTypes.SELECT,
  });

  if (linhas.length === 0) {
    console.log(`  [${tabela}] sem registros, pulando.`);
    return 0;
  }

  const registros = linhas.map((linha) => {
    const mapeado = mapper(linha);
    return {
      ano,
      origem_tabela: tabela,
      razao_social: mapeado.razao_social || null,
      nome_fantasia: mapeado.nome_fantasia || null,
      cnpj: mapeado.cnpj || null,
      porte: mapeado.porte || null,
      situacao: mapeado.situacao || null,
      segmento: mapeado.segmento || null,
      uf: mapeado.uf || null,
      municipio: mapeado.municipio || null,
      data_inicio_operacao: normalizarData(mapeado.data_inicio_operacao),
    };
  });

  // bulkInsert direto via query builder do Sequelize (sem precisar de um Model)
  const TbAcampamentosConsolidado = require('../models/TbAcampamentosConsolidado');
  await TbAcampamentosConsolidado.bulkCreate(registros);

  console.log(`  [${tabela}] ${registros.length} registros inseridos.`);
  return registros.length;
}

async function main() {
  console.log('Iniciando consolidação...\n');

  // Limpa a tabela consolidada antes de rodar de novo (idempotência)
  const TbAcampamentosConsolidado = require('../models/TbAcampamentosConsolidado');
  await TbAcampamentosConsolidado.destroy({ where: {}, truncate: true });

  let total = 0;
  for (const config of TABELAS_ORIGEM) {
    try {
      total += await consolidarTabela(config);
    } catch (err) {
      console.error(`  [${config.tabela}] ERRO:`, err.message);
    }
  }

  console.log(`\nConsolidação concluída. Total geral: ${total} registros.`);
  await sequelize.close();
}

main().catch((err) => {
  console.error('Falha no ETL:', err);
  process.exit(1);
});
