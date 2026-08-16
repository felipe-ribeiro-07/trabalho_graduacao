// src/infra/database/sequelize/repositories/AcampamentoConsolidadoRepositoryImp.js
const { fn, col, Op } = require('sequelize');
const TbCentroDeConvencoesConsolidado = require('../models/TbCentroDeConvencoesConsolidado');

class CentroDeConvencoesConsolidadoRepositoryImp {

  async totalPorAno() {
    return TbCentroDeConvencoesConsolidado.findAll({
      attributes: ['ano', [fn('COUNT', col('id')), 'total']],
      group: ['ano'],
      order: [['ano', 'ASC']],
      raw: true,
    });
  }

  async totalPorUF(ano = null) {
    const where = ano ? { ano } : {};
    return TbCentroDeConvencoesConsolidado.findAll({
      attributes: ['uf', [fn('COUNT', col('id')), 'total']],
      where,
      group: ['uf'],
      order: [[fn('COUNT', col('id')), 'DESC']],
      raw: true,
    });
  }

  async totalPorMunicipio(uf = null, ano = null) {
    const where = {};
    if (uf) where.uf = uf;
    if (ano) where.ano = ano;

    return TbCentroDeConvencoesConsolidado.findAll({
      attributes: ['municipio', 'uf', [fn('COUNT', col('id')), 'total']],
      where,
      group: ['municipio', 'uf'],
      order: [[fn('COUNT', col('id')), 'DESC']],
      raw: true,
    });
  }

async acumuladoAnualMunicipio(municipio = string) {
  const where = {};
  if (municipio) where.municipio = municipio;

  return TbCentroDeConvencoesConsolidado.findAll({ 
    attributes: [
      'municipio', 
      'ano', 
      [fn('COUNT', col('id')), 'total']
    ],
    where,
    group: ['municipio', 'ano'],
    order: [['ano', 'ASC']], 
    raw: true,
  });
}

  async compararAnos(anos) {
    return TbCentroDeConvencoesConsolidado.findAll({
      attributes: ['ano', [fn('COUNT', col('id')), 'total']],
      where: { ano: { [Op.in]: anos } },
      group: ['ano'],
      order: [['ano', 'ASC']],
      raw: true,
    });
  }

  async totalAcumulado(filtros = {}) {
    const where = {};
    if (filtros.uf) where.uf = filtros.uf;
    if (filtros.municipio) where.municipio = filtros.municipio;
    // sem filtro de ano = soma tudo, todos os anos

    return TbCentroDeConvencoesConsolidado.count({ where });
  }

  async ultimosCincoAnos(filtros = {}) {
    const where = {};
    if (filtros.uf) where.uf = filtros.uf;

    if (filtros.ano) {
      where.ano = Array.isArray(filtros.ano) ? { [Op.in]: filtros.ano } : filtros.ano;
    }

    return TbCentroDeConvencoesConsolidado.findAll({
      attributes: ['ano', [fn('COUNT', col('id')), 'total']],
      where,
      group: ['ano'],
      order: [['ano', 'DESC']],
      limit: 5,
      raw: true,
    });
  }


  async evolucaoAnualUF(filtros = {}) {
    const where = {};
    if (filtros.uf) where.uf = filtros.uf;

    return TbCentroDeConvencoesConsolidado.findAll({
      attributes: ['ano', [fn('COUNT', col('id')), 'total']],
      where,
      group: ['ano'],
      order: [['ano', 'DESC']],
      raw: true,
    });
  }
}

module.exports = CentroDeConvencoesConsolidadoRepositoryImp;