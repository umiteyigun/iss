const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const RadiusUser = sequelize.define('RadiusUser', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(64),
    allowNull: false,
    unique: true
  },
  attribute: {
    type: DataTypes.STRING(64),
    allowNull: false
  },
  op: {
    type: DataTypes.CHAR(2),
    allowNull: false,
    defaultValue: ':='
  },
  value: {
    type: DataTypes.STRING(253),
    allowNull: false
  },
  first_name: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  last_name: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'suspended'),
    defaultValue: 'active'
  },
  package_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Packages',
      key: 'id'
    }
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Tenants',
      key: 'id'
    }
  }
}, {
  tableName: 'radcheck',
  timestamps: true
});

module.exports = RadiusUser;
