const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MetroIP = sequelize.define('MetroIP', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nasname: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  ipaddress: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  ports: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  user: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  ip_type: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'metroIP',
  timestamps: false
});

module.exports = MetroIP;
