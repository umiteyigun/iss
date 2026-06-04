const { Sequelize } = require('sequelize');
require('dotenv').config();

const btkTimezone = process.env.BTK_TIMEZONE_OFFSET || '+03:00';

const sequelize = new Sequelize(
  process.env.DB_NAME || 'radius',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '321321',
  {
    host: process.env.DB_HOST || '192.168.9.155',
    port: process.env.DB_PORT || 3306,
    dialect: process.env.DB_DIALECT || 'mysql',
    timezone: btkTimezone,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      supportBigNumbers: true
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true,
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    }
  }
);

module.exports = { sequelize, btkTimezone };
