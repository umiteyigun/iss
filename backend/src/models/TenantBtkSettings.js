const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TenantBtkSettings = sequelize.define('TenantBtkSettings', {
  tenant_id: {
    type: DataTypes.INTEGER,
    primaryKey: true
  },
  enabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  operator_code: {
    type: DataTypes.STRING(32),
    allowNull: false,
    defaultValue: '001'
  },
  btk_pvc_code: {
    type: DataTypes.STRING(32),
    allowNull: false,
    defaultValue: '0'
  },
  btk_bkm_code: {
    type: DataTypes.STRING(8),
    allowNull: false,
    defaultValue: '1'
  },
  timezone: {
    type: DataTypes.STRING(64),
    allowNull: false,
    defaultValue: 'Europe/Istanbul'
  }
}, {
  tableName: 'tenant_btk_settings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = TenantBtkSettings;
