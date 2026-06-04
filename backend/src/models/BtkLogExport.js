const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BtkLogExport = sequelize.define('BtkLogExport', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  tenant_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  hour_start: {
    type: DataTypes.DATE,
    allowNull: false
  },
  hour_end: {
    type: DataTypes.DATE,
    allowNull: false
  },
  filename: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  record_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  content_sha256: {
    type: DataTypes.STRING(64),
    allowNull: false
  },
  signature: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  sign_algorithm: {
    type: DataTypes.STRING(32),
    allowNull: false,
    defaultValue: 'HMAC-SHA256'
  },
  log_path: {
    type: DataTypes.STRING(512),
    allowNull: false
  },
  signature_path: {
    type: DataTypes.STRING(512),
    allowNull: false
  },
  zip_path: {
    type: DataTypes.STRING(512),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'signed', 'failed'),
    allowNull: false,
    defaultValue: 'pending'
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  signed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  signed_at_authority: {
    type: DataTypes.STRING(32),
    allowNull: false,
    defaultValue: 'mysql'
  },
  signed_at_timezone: {
    type: DataTypes.STRING(32),
    allowNull: false,
    defaultValue: '+03:00'
  },
  clock_drift_ms: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  reference_now: {
    type: DataTypes.DATE,
    allowNull: true
  },
  nat_fallback_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  nat_changes_in_hour: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  nat_resolution: {
    type: DataTypes.STRING(32),
    allowNull: false,
    defaultValue: 'session_start_history'
  }
}, {
  tableName: 'btk_log_exports',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = BtkLogExport;
