const { DataTypes } = require('sequelize');
const sequelize = require('../../config/supabase'); // ajuste o caminho conforme seu projeto

const TbOrganizadoraDeEventos = sequelize.define('TbOrganizadoraDeEventos', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  ano: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  origem_tabela: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  razao_social: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  nome_fantasia: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  cnpj: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  porte: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  situacao: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  segmento: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  uf: {
    type: DataTypes.STRING(2),
    allowNull: true,
  },
  municipio: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  data_inicio_operacao: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
}, {
  tableName: 'tb_organizadora_de_eventos_acumulado',
  timestamps: false,
  indexes: [
    { fields: ['ano'] },
    { fields: ['uf'] },
    { fields: ['municipio'] },
    { fields: ['ano', 'uf'] },
  ],
});

module.exports = TbOrganizadoraDeEventos;
