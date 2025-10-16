const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const NasDevice = sequelize.define('NasDevice', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nasname: {
    type: DataTypes.STRING(128),
    allowNull: false,
    unique: true
  },
  shortname: {
    type: DataTypes.STRING(32),
    allowNull: false
  },
  type: {
    type: DataTypes.STRING(30),
    allowNull: true,
    defaultValue: 'other'
  },
  ports: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  secret: {
    type: DataTypes.STRING(60),
    allowNull: false
  },
  server: {
    type: DataTypes.STRING(64),
    allowNull: true
  },
  community: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  description: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'tenant_id',
    references: {
      model: 'tenants',
      key: 'id'
    }
  },
  ruser: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  naspassword: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    allowNull: true,
    defaultValue: 'active'
  }
}, {
  tableName: 'nas',
  timestamps: false
});

module.exports = NasDevice;
