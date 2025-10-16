const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Radippool = sequelize.define('Radippool', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  pool_name: {
    type: DataTypes.STRING(30),
    allowNull: true
  },
  framedipaddress: {
    type: DataTypes.STRING(15),
    allowNull: true
  },
  nasipaddress: {
    type: DataTypes.STRING(15),
    allowNull: true
  },
  calledstationid: {
    type: DataTypes.STRING(30),
    allowNull: true
  },
  callingstationid: {
    type: DataTypes.STRING(30),
    allowNull: true
  },
  expiry_time: {
    type: DataTypes.DATE,
    allowNull: true
  },
  username: {
    type: DataTypes.STRING(64),
    allowNull: true
  },
  pool_key: {
    type: DataTypes.STRING(30),
    allowNull: true
  },
  port: {
    type: DataTypes.STRING(30),
    allowNull: true
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 1
  }
}, {
  tableName: 'radippool',
  timestamps: false
});

module.exports = Radippool;