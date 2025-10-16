const { sequelize } = require('../config/database');

async function inspectDatabase() {
  try {
    console.log('🔍 Veritabanı tablolarını kontrol ediliyor...\n');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Veritabanı bağlantısı başarılı\n');
    
    // Get all tables
    const [results] = await sequelize.query("SHOW TABLES");
    console.log('📋 Mevcut tablolar:');
    results.forEach((row, index) => {
      const tableName = Object.values(row)[0];
      console.log(`${index + 1}. ${tableName}`);
    });
    
    console.log('\n🔍 Tenant ile ilgili tablolar:');
    const tenantTables = results.filter(row => {
      const tableName = Object.values(row)[0];
      return tableName.toLowerCase().includes('tenant') || 
             tableName.toLowerCase().includes('company') ||
             tableName.toLowerCase().includes('organization');
    });
    
    if (tenantTables.length > 0) {
      tenantTables.forEach((row, index) => {
        const tableName = Object.values(row)[0];
        console.log(`${index + 1}. ${tableName}`);
      });
    } else {
      console.log('❌ Tenant tablosu bulunamadı');
    }
    
    // Check users table structure
    console.log('\n👥 Users tablosu yapısı:');
    const [userColumns] = await sequelize.query("DESCRIBE users");
    userColumns.forEach(column => {
      console.log(`- ${column.Field}: ${column.Type} ${column.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    // Check if there are any users
    const [userCount] = await sequelize.query("SELECT COUNT(*) as count FROM users");
    console.log(`\n📊 Toplam kullanıcı sayısı: ${userCount[0].count}`);
    
    // Check for tenant-related columns in users table
    const tenantColumns = userColumns.filter(col => 
      col.Field.toLowerCase().includes('tenant') || 
      col.Field.toLowerCase().includes('company') ||
      col.Field.toLowerCase().includes('organization')
    );
    
    if (tenantColumns.length > 0) {
      console.log('\n🏢 Users tablosunda tenant ile ilgili kolonlar:');
      tenantColumns.forEach(column => {
        console.log(`- ${column.Field}: ${column.Type}`);
      });
    }
    
    // Check for existing tenant data
    console.log('\n🔍 Mevcut tenant verileri:');
    try {
      const [tenants] = await sequelize.query("SELECT * FROM tenants LIMIT 5");
      if (tenants.length > 0) {
        console.log('Tenant verileri:');
        tenants.forEach((tenant, index) => {
          console.log(`${index + 1}. ID: ${tenant.id}, Name: ${tenant.name || 'N/A'}`);
        });
      } else {
        console.log('❌ Tenant verisi bulunamadı');
      }
    } catch (error) {
      console.log('❌ Tenants tablosu bulunamadı veya erişilemiyor');
    }
    
  } catch (error) {
    console.error('❌ Veritabanı kontrolü sırasında hata:', error.message);
  } finally {
    await sequelize.close();
  }
}

inspectDatabase();
