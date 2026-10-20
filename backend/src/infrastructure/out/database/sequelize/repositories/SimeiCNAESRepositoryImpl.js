// src/infra/database/sequelize/repositories/SimeiCnaeEstadoRepositoryImp.js
const sequelize = require('../../config/supabase'); // Ajuste o caminho
const { QueryTypes } = require('sequelize');

class SimeiCnaeEstadoRepositoryImp {
  /**
   * @param {string} nomeTabela - Ex: 'simei_cnae_acre_2026'
   */
  constructor(nomeTabela) {
    this.nomeTabela = nomeTabela;
  }

  // 1. Lista os CNAEs do estado unidos com o significado (descrição)
  async listarComDescricao(limit = 100, offset = 0) {
    const query = `
      SELECT 
        e.estado, 
        e.municipio, 
        e.ano, 
        e.cnae, 
        c.descricao, 
        CAST(e.total AS UNSIGNED) as total
      FROM ${this.nomeTabela} e
      LEFT JOIN cnaes_simei c 
        ON REPLACE(REPLACE(c.codigo, '-', ''), '/', '') = e.cnae
      ORDER BY total DESC
      LIMIT :limit OFFSET :offset
    `;
    
    return sequelize.query(query, {
      replacements: { limit, offset },
      type: QueryTypes.SELECT
    });
  }

  // 2. Ranking dos CNAEs mais presentes no Estado (Top 10)
  async topCnaesEstado(limit = 10) {
    const query = `
      SELECT 
        e.cnae, 
        c.descricao, 
        SUM(CAST(e.total AS UNSIGNED)) as total_estado
      FROM ${this.nomeTabela} e
      LEFT JOIN cnaes_simei c 
        ON REPLACE(REPLACE(c.codigo, '-', ''), '/', '') = e.cnae
      GROUP BY e.cnae, c.descricao
      ORDER BY total_estado DESC
      LIMIT :limit
    `;

    return sequelize.query(query, {
      replacements: { limit },
      type: QueryTypes.SELECT
    });
  }

  // 3. Totais agrupados por Município
  async totalPorMunicipio() {
    const query = `
      SELECT 
        e.municipio, 
        SUM(CAST(e.total AS UNSIGNED)) as total_geral
      FROM ${this.nomeTabela} e
      GROUP BY e.municipio
      ORDER BY total_geral DESC
    `;

    return sequelize.query(query, {
      type: QueryTypes.SELECT
    });
  }

  // 4. Busca onde um CNAE específico é mais forte dentro daquele estado
  async distribuicaoCnaePorMunicipio(cnae) {
    const query = `
      SELECT 
        e.municipio, 
        c.descricao,
        CAST(e.total AS UNSIGNED) as total
      FROM ${this.nomeTabela} e
      LEFT JOIN cnaes_simei c 
        ON REPLACE(REPLACE(c.codigo, '-', ''), '/', '') = e.cnae
      WHERE e.cnae = :cnae
      ORDER BY total DESC
    `;

    return sequelize.query(query, {
      replacements: { cnae },
      type: QueryTypes.SELECT
    });
  }

  

}

module.exports = SimeiCnaeEstadoRepositoryImp;