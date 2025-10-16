const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

async function fixAdminPassword() {
  try {
    console.log('🔧 Admin şifresini düzeltiliyor...\n');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Veritabanı bağlantısı başarılı\n');
    
    // Hash new password properly
    const newPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    console.log(`🔐 Yeni şifre hash'i oluşturuldu:`);
    console.log(`   - Password: ${newPassword}`);
    console.log(`   - Hash: ${hashedPassword}`);
    console.log(`   - Hash length: ${hashedPassword.length}`);
    
    // Update admin user password
    const [result] = await sequelize.query(
      `UPDATE members SET password = '${hashedPassword}' WHERE username = 'admin'`
    );
    
    if (result.affectedRows > 0) {
      console.log(`✅ Admin kullanıcısının şifresi güncellendi`);
      
      // Verify the password works
      const [updatedMembers] = await sequelize.query("SELECT password FROM members WHERE username = 'admin'");
      const updatedAdmin = updatedMembers[0];
      
      const isValid = await bcrypt.compare(newPassword, updatedAdmin.password);
      console.log(`🔍 Şifre doğrulama testi: ${isValid ? '✅ Başarılı' : '❌ Başarısız'}`);
      
    } else {
      console.log('❌ Admin kullanıcısı bulunamadı');
    }
    
    // Also update administrator user
    const [result2] = await sequelize.query(
      `UPDATE members SET password = '${hashedPassword}' WHERE username = 'administrator'`
    );
    
    if (result2.affectedRows > 0) {
      console.log(`✅ Administrator kullanıcısının şifresi güncellendi`);
    }
    
  } catch (error) {
    console.error('❌ Şifre düzeltme sırasında hata:', error.message);
  } finally {
    await sequelize.close();
  }
}

fixAdminPassword();
