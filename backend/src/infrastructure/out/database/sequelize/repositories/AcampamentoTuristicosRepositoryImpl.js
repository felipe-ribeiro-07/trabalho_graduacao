// src/infra/database/sequelize/repositories/AcampamentoConsolidadoRepositoryImp.js
const { fn, col, Op } = require('sequelize');
const TbAcampamentosConsolidado = require('../models/TbAcampamentosConsolidado');

class AcampamentoConsolidadoRepositoryImp {

  async totalPorAno() {
    return TbAcampamentosConsolidado.findAll({
      attributes: ['ano', [fn('COUNT', col('id')), 'total']],
      group: ['ano'],
      order: [['ano', 'ASC']],
      raw: true,
    });
  }

  async totalPorUF(ano = null) {
    const where = ano ? { ano } : {};
    return TbAcampamentosConsolidado.findAll({
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

    return TbAcampamentosConsolidado.findAll({
      attributes: ['municipio', 'uf', [fn('COUNT', col('id')), 'total']],
      where,
      group: ['municipio', 'uf'],
      order: [[fn('COUNT', col('id')), 'DESC']],
      raw: true,
    });
  }

  async compararAnos(anos) {
    return TbAcampamentosConsolidado.findAll({
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

    return TbAcampamentosConsolidado.count({ where });
  }
}

module.exports = AcampamentoConsolidadoRepositoryImp;