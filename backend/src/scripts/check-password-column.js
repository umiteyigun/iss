const { sequelize } = require('../config/database');

async function checkPasswordColumn() {
  try {
    console.log('🔍 Password kolonu yapısını kontrol ediliyor...\n');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Veritabanı bağlantısı başarılı\n');
    
    // Check members table structure
    const [columns] = await sequelize.query("DESCRIBE members");
    
    console.log('📋 Members tablosu kolonları:');
    columns.forEach(column => {
      if (column.Field === 'password') {
        console.log(`🔑 PASSWORD KOLONU:`);
        console.log(`   - Field: ${column.Field}`);
        console.log(`   - Type: ${column.Type}`);
        console.log(`   - Null: ${column.Null}`);
        console.log(`   - Key: ${column.Key}`);
        console.log(`   - Default: ${column.Default}`);
        console.log(`   - Extra: ${column.Extra}`);
      } else {
        console.log(`   - ${column.Field}: ${column.Type}`);
      }
    });
    
    // Check if we need to alter the column
    const passwordColumn = columns.find(col => col.Field === 'password');
    if (passwordColumn && passwordColumn.Type.includes('varchar(20)')) {
      console.log('\n⚠️  Password kolonu VARCHAR(20) - bcrypt hash için yetersiz!');
      console.log('🔧 Kolonu VARCHAR(255) olarak güncelleniyor...');
      
      try {
        await sequelize.query("ALTER TABLE members MODIFY COLUMN password VARCHAR(255)");
        console.log('✅ Password kolonu güncellendi');
      } catch (error) {
        console.log('❌ Kolon güncelleme hatası:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Kolon kontrolü sırasında hata:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkPasswordColumn();
