const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

async function debugPassword() {
  try {
    console.log('🔐 Şifre debug işlemi başlatılıyor...\n');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Veritabanı bağlantısı başarılı\n');
    
    // Get admin user
    const [members] = await sequelize.query("SELECT id, username, password FROM members WHERE username = 'admin'");
    
    if (members.length === 0) {
      console.log('❌ Admin kullanıcısı bulunamadı');
      return;
    }
    
    const admin = members[0];
    console.log(`👤 Admin kullanıcısı bulundu:`);
    console.log(`   - ID: ${admin.id}`);
    console.log(`   - Username: ${admin.username}`);
    console.log(`   - Password hash: ${admin.password}`);
    console.log(`   - Password length: ${admin.password.length}`);
    
    // Test different passwords
    const testPasswords = ['admin123', 'admin', '123456', 'password', '321321'];
    
    console.log('\n🔍 Şifre testleri:');
    for (const testPassword of testPasswords) {
      try {
        const isValid = await bcrypt.compare(testPassword, admin.password);
        console.log(`   - "${testPassword}": ${isValid ? '✅ Valid' : '❌ Invalid'}`);
      } catch (error) {
        console.log(`   - "${testPassword}": ❌ Error - ${error.message}`);
      }
    }
    
    // Test if password is already plain text
    console.log('\n🔍 Plain text kontrolü:');
    console.log(`   - admin123 === admin.password: ${admin.password === 'admin123'}`);
    console.log(`   - admin === admin.password: ${admin.password === 'admin'}`);
    
    // Try to hash a new password and compare
    console.log('\n🔍 Yeni hash testi:');
    const newHash = await bcrypt.hash('admin123', 12);
    console.log(`   - Yeni hash: ${newHash}`);
    console.log(`   - Yeni hash length: ${newHash.length}`);
    
    const isValidNew = await bcrypt.compare('admin123', newHash);
    console.log(`   - Yeni hash ile test: ${isValidNew ? '✅ Valid' : '❌ Invalid'}`);
    
  } catch (error) {
    console.error('❌ Debug sırasında hata:', error.message);
  } finally {
    await sequelize.close();
  }
}

debugPassword();
