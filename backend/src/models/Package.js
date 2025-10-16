const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Package = sequelize.define('Package', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  download: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Download speed limit'
  },
  upload: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Upload speed limit'
  },
  price: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  traffic: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Traffic limit'
  },
  sat: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  }
}, {
  tableName: 'packetsInfo',
  timestamps: false
});

module.exports = Package;
