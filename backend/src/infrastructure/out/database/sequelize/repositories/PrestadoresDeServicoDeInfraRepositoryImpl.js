// src/infra/database/sequelize/repositories/AcampamentoConsolidadoRepositoryImp.js
const { fn, col, Op } = require('sequelize');
const TbPrestadoresDeServicoDeInfraestruturaConsolidado  = require('../models/TBPrestadoresDeServicosDeInfraestrutura');

class PrestadoresDeServicoDeInfraRepositoryImpl {

  async totalPorAno() {
    return TbPrestadoresDeServicoDeInfraestruturaConsolidado.findAll({
      attributes: ['ano', [fn('COUNT', col('id')), 'total']],
      group: ['ano'],
      order: [['ano', 'ASC']],
      raw: true,
    });
  }

  async totalPorUF(ano = null) {
    const where = ano ? { ano } : {};
    return TbPrestadoresDeServicoDeInfraestruturaConsolidado.findAll({
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

    return TbPrestadoresDeServicoDeInfraestruturaConsolidado.findAll({
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

  return TbPrestadoresDeServicoDeInfraestruturaConsolidado.findAll({ 
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
    return TbPrestadoresDeServicoDeInfraestruturaConsolidado.findAll({
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

    return TbPrestadoresDeServicoDeInfraestruturaConsolidado.count({ where });
  }

  async ultimosCincoAnos(filtros = {}) {
    const where = {};
    if (filtros.uf) where.uf = filtros.uf;

    if (filtros.ano) {
      where.ano = Array.isArray(filtros.ano) ? { [Op.in]: filtros.ano } : filtros.ano;
    }

    return TbPrestadoresDeServicoDeInfraestruturaConsolidado.findAll({
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

    return TbPrestadoresDeServicoDeInfraestruturaConsolidado.findAll({
      attributes: ['ano', [fn('COUNT', col('id')), 'total']],
      where,
      group: ['ano'],
      order: [['ano', 'DESC']],
      raw: true,
    });
  }
}

module.exports = PrestadoresDeServicoDeInfraRepositoryImpl;