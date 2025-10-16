const { sequelize, Package, Tenant } = require('../models');

async function createPackagesTable() {
  try {
    console.log('🔄 Creating packages table...');
    
    // Sync the Package model to create the table
    await Package.sync({ force: false }); // force: false means don't drop existing table
    
    console.log('✅ Packages table created successfully!');
    
    // Test if we can query the table
    const count = await Package.count();
    console.log(`📊 Current packages count: ${count}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating packages table:', error);
    process.exit(1);
  }
}

createPackagesTable();
