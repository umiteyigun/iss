const { sequelize } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function createPackagesTableManual() {
  try {
    console.log('🔄 Creating packages table with manual SQL...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'create-packages-table-manual.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    await sequelize.query(sql);
    
    console.log('✅ Packages table created successfully!');
    
    // Test if we can query the table
    const [results] = await sequelize.query('SELECT COUNT(*) as count FROM packages');
    console.log(`📊 Current packages count: ${results[0].count}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating packages table:', error);
    process.exit(1);
  }
}

createPackagesTableManual();
