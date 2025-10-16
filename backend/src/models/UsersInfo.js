const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UsersInfo = sequelize.define('UsersInfo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  lastname: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  packet: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  address: {
    type: DataTypes.STRING(1000),
    allowNull: true
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'usersInfo',
  timestamps: false
});

module.exports = UsersInfo;
