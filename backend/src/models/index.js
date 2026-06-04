const { sequelize } = require('../config/database');

// Import models
const User = require('./User');
const Member = require('./Member');
const Tenant = require('./Tenant');
const Router = require('./Router');
const NasDevice = require('./NasDevice');
const RadiusUser = require('./RadiusUser');
const Package = require('./Package');
const Radcheck = require('./Radcheck');
const Radacct = require('./Radacct');
const UsersInfo = require('./UsersInfo');
const Radreply = require('./Radreply');
const Radippool = require('./Radippool');
const MetroIP = require('./MetroIP');
const Role = require('./Role');
const Permission = require('./Permission');
const RolePermission = require('./RolePermission');
const MemberRole = require('./MemberRole');
const TenantBtkSettings = require('./TenantBtkSettings');
const BtkLogExport = require('./BtkLogExport');
const NatMappingHistory = require('./NatMappingHistory');

// Define associations
// Tenant associations
Tenant.hasMany(User, { foreignKey: 'tenant_id', as: 'users' });
Tenant.hasMany(Router, { foreignKey: 'tenant_id', as: 'routers' });
Tenant.hasMany(NasDevice, { foreignKey: 'tenant_id', as: 'nasDevices' });
Tenant.hasMany(RadiusUser, { foreignKey: 'tenant_id', as: 'radiusUsers' });
Tenant.hasMany(Package, { foreignKey: 'tenant_id', as: 'packages' });
Tenant.hasOne(TenantBtkSettings, { foreignKey: 'tenant_id', as: 'btkSettings' });
Tenant.hasMany(BtkLogExport, { foreignKey: 'tenant_id', as: 'btkLogExports' });

// User associations
User.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });

// Member associations (main user table)
Member.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
Member.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
Tenant.hasMany(Member, { foreignKey: 'tenant_id', as: 'members' });

// Router associations
Router.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

// NasDevice associations
NasDevice.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

// RadiusUser associations
RadiusUser.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
RadiusUser.belongsTo(Package, { foreignKey: 'package_id', as: 'package' });

// Package associations
Package.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
// Package.hasMany(RadiusUser, { foreignKey: 'package_id', as: 'radiusUsers' });

// RADIUS table associations
Radcheck.belongsTo(UsersInfo, { foreignKey: 'username', targetKey: 'username', as: 'userInfo' });
Radcheck.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
Radcheck.hasMany(Radacct, { foreignKey: 'username', sourceKey: 'username', as: 'sessions' });
Radcheck.hasMany(Radreply, { foreignKey: 'username', sourceKey: 'username', as: 'replies' });

Radacct.belongsTo(Radcheck, { foreignKey: 'username', targetKey: 'username', as: 'user' });

UsersInfo.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
UsersInfo.hasMany(Radcheck, { foreignKey: 'username', sourceKey: 'username', as: 'radcheck' });
UsersInfo.belongsTo(Package, { foreignKey: 'packet', targetKey: 'name', as: 'package' });

Radreply.belongsTo(Radcheck, { foreignKey: 'username', targetKey: 'username', as: 'user' });

Radippool.belongsTo(Radcheck, { foreignKey: 'username', targetKey: 'username', as: 'user' });

// Role and Permission associations
Role.belongsToMany(Permission, { through: RolePermission, foreignKey: 'role_id', as: 'permissions' });
Permission.belongsToMany(Role, { through: RolePermission, foreignKey: 'permission_id', as: 'roles' });

// Member and Role associations (many-to-many)
Member.belongsToMany(Role, { through: MemberRole, foreignKey: 'member_id', as: 'roles' });
Role.belongsToMany(Member, { through: MemberRole, foreignKey: 'role_id', as: 'members' });

TenantBtkSettings.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
BtkLogExport.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

// Export models
module.exports = {
  sequelize,
  User,
  Member,
  Tenant,
  Router,
  NasDevice,
  RadiusUser,
  Package,
  Radcheck,
  Radacct,
  UsersInfo,
  Radreply,
  Radippool,
  MetroIP,
  Role,
  Permission,
  RolePermission,
  MemberRole,
  TenantBtkSettings,
  BtkLogExport,
  NatMappingHistory
};
