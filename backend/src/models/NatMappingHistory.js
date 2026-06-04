const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const NatMappingHistory = sequelize.define('NatMappingHistory', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  username: {
    type: DataTypes.STRING(64),
    allowNull: false
  },
  framedipaddress: {
    type: DataTypes.STRING(15),
    allowNull: true
  },
  nasipaddress: {
    type: DataTypes.STRING(15),
    allowNull: true
  },
  port: {
    type: DataTypes.STRING(30),
    allowNull: true
  },
  valid_from: {
    type: DataTypes.DATE,
    allowNull: false
  },
  valid_to: {
    type: DataTypes.DATE,
    allowNull: true
  },
  change_source: {
    type: DataTypes.STRING(32),
    allowNull: false,
    defaultValue: 'unknown'
  }
}, {
  tableName: 'nat_mapping_history',
  timestamps: false
});

module.exports = NatMappingHistory;
