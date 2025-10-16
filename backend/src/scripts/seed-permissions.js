const { Permission, Role, RolePermission, sequelize } = require('../models/index');
const { Op } = require('sequelize');

const permissions = [
  // Dashboard Module
  { name: 'dashboard.view', display_name: 'View Dashboard', module: 'dashboard', action: 'view' },
  { name: 'dashboard.stats', display_name: 'View Statistics', module: 'dashboard', action: 'stats' },
  
  // Tenant Management Module
  { name: 'tenant.view', display_name: 'View Tenants', module: 'tenant', action: 'view' },
  { name: 'tenant.create', display_name: 'Create Tenant', module: 'tenant', action: 'create' },
  { name: 'tenant.update', display_name: 'Update Tenant', module: 'tenant', action: 'update' },
  { name: 'tenant.delete', display_name: 'Delete Tenant', module: 'tenant', action: 'delete' },
  
  // Member Management Module
  { name: 'member.view', display_name: 'View Members', module: 'member', action: 'view' },
  { name: 'member.create', display_name: 'Create Member', module: 'member', action: 'create' },
  { name: 'member.update', display_name: 'Update Member', module: 'member', action: 'update' },
  { name: 'member.delete', display_name: 'Delete Member', module: 'member', action: 'delete' },
  
  // NAS Management Module
  { name: 'nas.view', display_name: 'View NAS Devices', module: 'nas', action: 'view' },
  { name: 'nas.create', display_name: 'Create NAS Device', module: 'nas', action: 'create' },
  { name: 'nas.update', display_name: 'Update NAS Device', module: 'nas', action: 'update' },
  { name: 'nas.delete', display_name: 'Delete NAS Device', module: 'nas', action: 'delete' },
  { name: 'nas.manage', display_name: 'Manage NAS Devices', module: 'nas', action: 'manage' },
  
  // User Management Module (RADIUS Users)
  { name: 'user.view', display_name: 'View Users', module: 'user', action: 'view' },
  { name: 'user.create', display_name: 'Create User', module: 'user', action: 'create' },
  { name: 'user.update', display_name: 'Update User', module: 'user', action: 'update' },
  { name: 'user.delete', display_name: 'Delete User', module: 'user', action: 'delete' },
  { name: 'user.suspend', display_name: 'Suspend User', module: 'user', action: 'suspend' },
  { name: 'user.activate', display_name: 'Activate User', module: 'user', action: 'activate' },
  
  // Package Management Module
  { name: 'package.view', display_name: 'View Packages', module: 'package', action: 'view' },
  { name: 'package.create', display_name: 'Create Package', module: 'package', action: 'create' },
  { name: 'package.update', display_name: 'Update Package', module: 'package', action: 'update' },
  { name: 'package.delete', display_name: 'Delete Package', module: 'package', action: 'delete' },
  
  // Network Traffic Module
  { name: 'traffic.view', display_name: 'View Network Traffic', module: 'traffic', action: 'view' },
  { name: 'traffic.monitor', display_name: 'Monitor Network Traffic', module: 'traffic', action: 'monitor' },
  
  // Reports Module
  { name: 'report.view', display_name: 'View Reports', module: 'report', action: 'view' },
  { name: 'report.export', display_name: 'Export Reports', module: 'report', action: 'export' },
  
  // Settings Module
  { name: 'settings.view', display_name: 'View Settings', module: 'settings', action: 'view' },
  { name: 'settings.update', display_name: 'Update Settings', module: 'settings', action: 'update' },
  
  // Role Management Module
  { name: 'role.view', display_name: 'View Roles', module: 'role', action: 'view' },
  { name: 'role.create', display_name: 'Create Role', module: 'role', action: 'create' },
  { name: 'role.update', display_name: 'Update Role', module: 'role', action: 'update' },
  { name: 'role.delete', display_name: 'Delete Role', module: 'role', action: 'delete' }
];

const systemRoles = [
  {
    name: 'super_admin',
    display_name: 'Super Administrator',
    description: 'Full system access with all permissions',
    is_system_role: true,
    permissions: permissions.map(p => p.name) // All permissions
  },
  {
    name: 'admin',
    display_name: 'Administrator',
    description: 'Full tenant access with most permissions',
    is_system_role: true,
    permissions: [
      'dashboard.view', 'dashboard.stats',
      'member.view', 'member.create', 'member.update', 'member.delete',
      'nas.view', 'nas.create', 'nas.update', 'nas.delete', 'nas.manage',
      'user.view', 'user.create', 'user.update', 'user.delete', 'user.suspend', 'user.activate',
      'package.view', 'package.create', 'package.update', 'package.delete',
      'traffic.view', 'traffic.monitor',
      'report.view', 'report.export',
      'settings.view', 'settings.update',
      'role.view', 'role.create', 'role.update', 'role.delete'
    ]
  },
  {
    name: 'operator',
    display_name: 'Operator',
    description: 'Limited access for daily operations',
    is_system_role: true,
    permissions: [
      'dashboard.view', 'dashboard.stats',
      'user.view', 'user.create', 'user.update', 'user.suspend', 'user.activate',
      'package.view',
      'traffic.view',
      'report.view'
    ]
  },
  {
    name: 'viewer',
    display_name: 'Viewer',
    description: 'Read-only access',
    is_system_role: true,
    permissions: [
      'dashboard.view', 'dashboard.stats',
      'user.view',
      'package.view',
      'traffic.view',
      'report.view'
    ]
  }
];

async function seedPermissions() {
  try {
    console.log('🌱 Starting permission seeding...');

    // Create permissions
    console.log('📝 Creating permissions...');
    for (const permissionData of permissions) {
      await Permission.findOrCreate({
        where: { name: permissionData.name },
        defaults: permissionData
      });
    }

    // Create system roles
    console.log('👥 Creating system roles...');
    for (const roleData of systemRoles) {
      const [role] = await Role.findOrCreate({
        where: { name: roleData.name },
        defaults: {
          name: roleData.name,
          display_name: roleData.display_name,
          description: roleData.description,
          is_system_role: roleData.is_system_role,
          tenant_id: null // System roles are global
        }
      });

      // Assign permissions to role
      if (roleData.permissions) {
        const permissionObjects = await Permission.findAll({
          where: { name: { [Op.in]: roleData.permissions } }
        });
        
        await role.setPermissions(permissionObjects);
      }
    }

    console.log('✅ Permission seeding completed successfully!');
    console.log(`📊 Created ${permissions.length} permissions`);
    console.log(`👥 Created ${systemRoles.length} system roles`);

  } catch (error) {
    console.error('❌ Error seeding permissions:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedPermissions()
    .then(() => {
      console.log('🎉 Seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedPermissions };
