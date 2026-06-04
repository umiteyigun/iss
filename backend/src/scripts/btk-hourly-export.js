#!/usr/bin/env node
/**
 * Hourly BTK NAT IPDR export for all active tenants (run via cron at :05).
 * Usage: node src/scripts/btk-hourly-export.js [--force]
 */
require('dotenv').config();
const BtkLogService = require('../services/BtkLogService');
const { sequelize } = require('../models');

const force = process.argv.includes('--force');

async function main() {
  await sequelize.authenticate();
  const result = await BtkLogService.runHourlyExport({ force });
  console.log(JSON.stringify(result, null, 2));
  await sequelize.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
