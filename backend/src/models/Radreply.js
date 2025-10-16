const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Radreply = sequelize.define('Radreply', {
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
  }
}, {
  tableName: 'radreply',
  timestamps: false
});

module.exports = Radreply;