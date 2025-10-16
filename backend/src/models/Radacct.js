const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Radacct = sequelize.define('Radacct', {
  radacctid: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  acctsessionid: {
    type: DataTypes.STRING(64),
    allowNull: false
  },
  acctuniqueid: {
    type: DataTypes.STRING(32),
    allowNull: false,
    unique: true
  },
  username: {
    type: DataTypes.STRING(64),
    allowNull: false
  },
  realm: {
    type: DataTypes.STRING(64),
    allowNull: true
  },
  nasipaddress: {
    type: DataTypes.STRING(15),
    allowNull: false
  },
  nasportid: {
    type: DataTypes.STRING(15),
    allowNull: true
  },
  nasporttype: {
    type: DataTypes.STRING(32),
    allowNull: true
  },
  acctstarttime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  acctstoptime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  acctsessiontime: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  acctauthentic: {
    type: DataTypes.STRING(32),
    allowNull: true
  },
  connectinfo_start: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  connectinfo_stop: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  acctinputoctets: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  acctoutputoctets: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  calledstationid: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  callingstationid: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  acctterminatecause: {
    type: DataTypes.STRING(32),
    allowNull: true
  },
  servicetype: {
    type: DataTypes.STRING(32),
    allowNull: true
  },
  framedprotocol: {
    type: DataTypes.STRING(32),
    allowNull: true
  },
  framedipaddress: {
    type: DataTypes.STRING(15),
    allowNull: true
  }
}, {
  tableName: 'radacct',
  timestamps: false
});

module.exports = Radacct;
