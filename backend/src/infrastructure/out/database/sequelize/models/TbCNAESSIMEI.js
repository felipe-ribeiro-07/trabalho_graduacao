// src/infra/database/sequelize/models/CnaeSimei.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/supabase'); // Ajuste o caminho

const CnaeSimei = sequelize.define('CnaeSimei', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  codigo: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  descricao: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
  }
}, {
  tableName: 'cnaes_simei',
  timestamps: true, // Usa createdAt e updatedAt gerados automaticamente
});

module.exports = CnaeSimei;