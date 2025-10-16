const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

async function checkMembers() {
  try {
    console.log('🔍 Mevcut kullanıcıları kontrol ediliyor...\n');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Veritabanı bağlantısı başarılı\n');
    
    // Get all members
    const [members] = await sequelize.query("SELECT id, username, password, is_active, tenant_id FROM members");
    
    console.log(`📊 Toplam ${members.length} kullanıcı bulundu:\n`);
    
    members.forEach((member, index) => {
      console.log(`${index + 1}. ID: ${member.id}`);
      console.log(`   Username: ${member.username || 'N/A'}`);
      console.log(`   Password: ${member.password ? 'Set' : 'Not set'}`);
      console.log(`   Active: ${member.is_active ? 'Yes' : 'No'}`);
      console.log(`   Tenant ID: ${member.tenant_id}`);
      console.log(`   Password Length: ${member.password ? member.password.length : 0}`);
      console.log('');
    });
    
    // Test password for admin user
    const adminMember = members.find(m => m.username === 'admin');
    if (adminMember && adminMember.password) {
      console.log('🔐 Admin kullanıcısının şifresini test ediliyor...');
      
      // Try common passwords
      const commonPasswords = ['admin', '123456', 'password', 'admin123', '321321'];
      
      for (const testPassword of commonPasswords) {
        try {
          const isValid = await bcrypt.compare(testPassword, adminMember.password);
          if (isValid) {
            console.log(`✅ Şifre bulundu: "${testPassword}"`);
            break;
          }
        } catch (error) {
          console.log(`❌ Şifre test hatası: ${error.message}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Kullanıcı kontrolü sırasında hata:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkMembers();
