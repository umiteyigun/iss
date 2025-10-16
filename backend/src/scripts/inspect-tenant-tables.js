const { sequelize } = require('../config/database');

async function inspectTenantTables() {
  try {
    console.log('🔍 Tenant tablolarını detaylı kontrol ediliyor...\n');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Veritabanı bağlantısı başarılı\n');
    
    // Check tenants table
    console.log('🏢 TENANTS tablosu yapısı:');
    const [tenantColumns] = await sequelize.query("DESCRIBE tenants");
    tenantColumns.forEach(column => {
      console.log(`- ${column.Field}: ${column.Type} ${column.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${column.Key ? `(${column.Key})` : ''}`);
    });
    
    // Check tenant data
    const [tenants] = await sequelize.query("SELECT * FROM tenants LIMIT 10");
    console.log(`\n📊 Tenant verileri (${tenants.length} adet):`);
    tenants.forEach((tenant, index) => {
      console.log(`${index + 1}. ID: ${tenant.id}, Name: ${tenant.name || 'N/A'}, Status: ${tenant.status || 'N/A'}`);
    });
    
    // Check tenant_ip_ranges table
    console.log('\n🌐 TENANT_IP_RANGES tablosu yapısı:');
    const [ipRangeColumns] = await sequelize.query("DESCRIBE tenant_ip_ranges");
    ipRangeColumns.forEach(column => {
      console.log(`- ${column.Field}: ${column.Type} ${column.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${column.Key ? `(${column.Key})` : ''}`);
    });
    
    // Check members table (this is our users table)
    console.log('\n👥 MEMBERS tablosu yapısı:');
    const [memberColumns] = await sequelize.query("DESCRIBE members");
    memberColumns.forEach(column => {
      console.log(`- ${column.Field}: ${column.Type} ${column.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${column.Key ? `(${column.Key})` : ''}`);
    });
    
    // Check members data
    const [members] = await sequelize.query("SELECT * FROM members LIMIT 5");
    console.log(`\n📊 Member verileri (${members.length} adet):`);
    members.forEach((member, index) => {
      console.log(`${index + 1}. ID: ${member.id}, Username: ${member.username || 'N/A'}, Email: ${member.email || 'N/A'}`);
    });
    
    // Check roles table
    console.log('\n🔐 ROLES tablosu yapısı:');
    const [roleColumns] = await sequelize.query("DESCRIBE roles");
    roleColumns.forEach(column => {
      console.log(`- ${column.Field}: ${column.Type} ${column.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${column.Key ? `(${column.Key})` : ''}`);
    });
    
    // Check roles data
    const [roles] = await sequelize.query("SELECT * FROM roles LIMIT 10");
    console.log(`\n📊 Role verileri (${roles.length} adet):`);
    roles.forEach((role, index) => {
      console.log(`${index + 1}. ID: ${role.id}, Name: ${role.name || 'N/A'}, Description: ${role.description || 'N/A'}`);
    });
    
    // Check permissions table
    console.log('\n🔑 PERMISSIONS tablosu yapısı:');
    const [permissionColumns] = await sequelize.query("DESCRIBE permissions");
    permissionColumns.forEach(column => {
      console.log(`- ${column.Field}: ${column.Type} ${column.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${column.Key ? `(${column.Key})` : ''}`);
    });
    
    // Check permissions data
    const [permissions] = await sequelize.query("SELECT * FROM permissions LIMIT 10");
    console.log(`\n📊 Permission verileri (${permissions.length} adet):`);
    permissions.forEach((permission, index) => {
      console.log(`${index + 1}. ID: ${permission.id}, Name: ${permission.name || 'N/A'}, Module: ${permission.module || 'N/A'}`);
    });
    
  } catch (error) {
    console.error('❌ Veritabanı kontrolü sırasında hata:', error.message);
  } finally {
    await sequelize.close();
  }
}

inspectTenantTables();
