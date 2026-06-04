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
  },
  binding_type: {
    type: DataTypes.ENUM('assigned', 'routed'),
    allowNull: false,
    defaultValue: 'assigned'
  },
  nat_in_use: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  nat_local_ip: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  lan_ip: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  notes: {
    type: DataTypes.STRING(500),
    allowNull: true
  }
}, {
  tableName: 'metroIP',
  timestamps: false
});

module.exports = MetroIP;
