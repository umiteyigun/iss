const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Radcheck = sequelize.define('Radcheck', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(64),
    allowNull: true
  },
  attribute: {
    type: DataTypes.STRING(64),
    allowNull: true
  },
  op: {
    type: DataTypes.CHAR(2),
    allowNull: true
  },
  value: {
    type: DataTypes.STRING(253),
    allowNull: true
  },
  regdate: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 1
  }
}, {
  tableName: 'radcheck',
  timestamps: false
});

module.exports = Radcheck;