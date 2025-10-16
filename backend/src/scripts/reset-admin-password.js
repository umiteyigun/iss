const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

async function resetAdminPassword() {
  try {
    console.log('🔐 Admin kullanıcısının şifresini sıfırlıyor...\n');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Veritabanı bağlantısı başarılı\n');
    
    // Hash new password
    const newPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Update admin user password
    const [result] = await sequelize.query(
      `UPDATE members SET password = '${hashedPassword}' WHERE username = 'admin'`
    );
    
    if (result.affectedRows > 0) {
      console.log(`✅ Admin kullanıcısının şifresi güncellendi`);
      console.log(`   Username: admin`);
      console.log(`   Password: ${newPassword}`);
    } else {
      console.log('❌ Admin kullanıcısı bulunamadı');
    }
    
    // Also update administrator user
    const [result2] = await sequelize.query(
      `UPDATE members SET password = '${hashedPassword}' WHERE username = 'administrator'`
    );
    
    if (result2.affectedRows > 0) {
      console.log(`✅ Administrator kullanıcısının şifresi güncellendi`);
      console.log(`   Username: administrator`);
      console.log(`   Password: ${newPassword}`);
    }
    
  } catch (error) {
    console.error('❌ Şifre sıfırlama sırasında hata:', error.message);
  } finally {
    await sequelize.close();
  }
}

resetAdminPassword();
