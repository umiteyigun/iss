const { Member, Role, Permission, MemberRole, RolePermission, Tenant, sequelize } = require('../models/index');
const { Op } = require('sequelize');

class MemberService {
  
  // Get all members with tenant filtering
  async getMembers(tenantId, page = 1, limit = 10, search = '') {
    try {
      const offset = (page - 1) * limit;
      
      let whereClause = {};
      // If tenantId is null (super admin), show all members
      // If tenantId is provided, filter by that tenant
      if (tenantId !== null && tenantId !== undefined) {
        whereClause.tenant_id = tenantId;
      }
      
      if (search) {
        whereClause[Op.or] = [
          { username: { [Op.like]: `%${search}%` } },
          { name: { [Op.like]: `%${search}%` } },
          { lastname: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } }
        ];
      }

      const { count, rows } = await Member.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Tenant,
            as: 'tenant',
            attributes: ['id', 'name']
          },
          {
            model: Role,
            as: 'roles',
            attributes: ['id', 'name', 'display_name'],
            through: { attributes: [] }
          }
        ],
        attributes: { exclude: ['password'] },
        limit,
        offset,
        order: [['created_at', 'DESC']]
      });

      return {
        success: true,
        data: {
          members: rows,
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      console.error('Error getting members:', error);
      return { success: false, error: error.message };
    }
  }

  // Get single member by ID
  async getMemberById(id, tenantId = null) {
    try {
      let whereClause = { id };
      if (tenantId) {
        whereClause.tenant_id = tenantId;
      }

      const member = await Member.findOne({
        where: whereClause,
        include: [
          {
            model: Tenant,
            as: 'tenant',
            attributes: ['id', 'name']
          },
          {
            model: Role,
            as: 'roles',
            attributes: ['id', 'name', 'display_name'],
            through: { attributes: [] }
          }
        ],
        attributes: { exclude: ['password'] }
      });

      if (!member) {
        return { success: false, error: 'Member not found' };
      }

      return { success: true, data: member };
    } catch (error) {
      console.error('Error getting member:', error);
      return { success: false, error: error.message };
    }
  }

  // Create new member
  async createMember(memberData, tenantId) {
    try {
      const member = await Member.create({
        ...memberData,
        tenant_id: tenantId
      });

      // Assign roles if provided
      if (memberData.roleIds && memberData.roleIds.length > 0) {
        await member.setRoles(memberData.roleIds);
      }

      return { success: true, data: member };
    } catch (error) {
      console.error('Error creating member:', error);
      return { success: false, error: error.message };
    }
  }

  // Update member
  async updateMember(id, memberData, tenantId = null) {
    try {
      let whereClause = { id };
      if (tenantId) {
        whereClause.tenant_id = tenantId;
      }

      const member = await Member.findOne({ where: whereClause });
      if (!member) {
        return { success: false, error: 'Member not found' };
      }

      // Update member data (exclude password if not provided)
      const updateData = { ...memberData };
      if (!updateData.password) {
        delete updateData.password;
      }

      await member.update(updateData);

      // Update roles if provided
      if (memberData.roleIds !== undefined) {
        const roles = await Role.findAll({ where: { id: memberData.roleIds } });
        await member.setRoles(roles);
      }

      // Fetch updated member with roles
      const updatedMember = await Member.findByPk(id, {
        include: [
          { model: Tenant, as: 'tenant', attributes: ['id', 'name'] },
          { model: Role, as: 'roles', attributes: ['id', 'name', 'display_name'], through: { attributes: [] } }
        ],
        attributes: { exclude: ['password'] }
      });

      return { success: true, member: updatedMember };
    } catch (error) {
      console.error('Error updating member:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete member
  async deleteMember(id, tenantId = null) {
    try {
      let whereClause = { id };
      if (tenantId) {
        whereClause.tenant_id = tenantId;
      }

      const member = await Member.findOne({ where: whereClause });
      if (!member) {
        return { success: false, error: 'Member not found' };
      }

      await member.destroy();
      return { success: true };
    } catch (error) {
      console.error('Error deleting member:', error);
      return { success: false, error: error.message };
    }
  }

  // Get roles (for role assignment)
  async getRoles(tenantId = null) {
    try {
      const whereClause = {};
      
      if (tenantId !== null) {
        // For specific tenant, show system roles + tenant roles
        whereClause[Op.or] = [
          { is_system_role: true },
          { tenant_id: tenantId }
        ];
      }
      // For super admin (tenantId = null), show all roles

      const roles = await Role.findAll({
        where: whereClause,
        include: [
          {
            model: Permission,
            as: 'permissions',
            attributes: ['id', 'name', 'display_name', 'module', 'action'],
            through: { attributes: [] }
          }
        ],
        order: [['display_name', 'ASC']]
      });

      return { success: true, roles };
    } catch (error) {
      console.error('Error getting roles:', error);
      return { success: false, error: error.message };
    }
  }

  // Get available roles for tenant
  async getAvailableRoles(tenantId) {
    try {
      const roles = await Role.findAll({
        where: {
          [Op.or]: [
            { tenant_id: tenantId },
            { tenant_id: null }, // Global roles
            { is_system_role: true }
          ]
        },
        include: [
          {
            model: Permission,
            as: 'permissions',
            attributes: ['id', 'name', 'display_name', 'module', 'action'],
            through: { attributes: [] }
          }
        ],
        order: [['name', 'ASC']]
      });

      return { success: true, data: roles };
    } catch (error) {
      console.error('Error getting roles:', error);
      return { success: false, error: error.message };
    }
  }

  // Get all permissions grouped by module
  async getPermissionsGrouped() {
    try {
      const permissions = await Permission.findAll({
        order: [['module', 'ASC'], ['action', 'ASC']]
      });

      // Group permissions by module
      const groupedPermissions = permissions.reduce((acc, permission) => {
        const module = permission.module;
        if (!acc[module]) {
          acc[module] = [];
        }
        acc[module].push(permission);
        return acc;
      }, {});

      return { success: true, data: groupedPermissions };
    } catch (error) {
      console.error('Error getting permissions:', error);
      return { success: false, error: error.message };
    }
  }

  // Create or update role
  async saveRole(roleData, tenantId) {
    try {
      let role;
      
      if (roleData.id) {
        // Update existing role
        role = await Role.findOne({
          where: {
            id: roleData.id,
            [Op.or]: [
              { tenant_id: tenantId },
              { tenant_id: null }
            ]
          }
        });
        
        if (!role) {
          return { success: false, error: 'Role not found' };
        }
        
        await role.update({
          name: roleData.name,
          display_name: roleData.display_name,
          description: roleData.description
        });
      } else {
        // Create new role
        role = await Role.create({
          name: roleData.name,
          display_name: roleData.display_name,
          description: roleData.description,
          tenant_id: tenantId,
          is_system_role: false
        });
      }

      // Update role permissions
      if (roleData.permissionIds) {
        await role.setPermissions(roleData.permissionIds);
      }

      return { success: true, data: role };
    } catch (error) {
      console.error('Error saving role:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete role
  async deleteRole(roleId, tenantId) {
    try {
      const role = await Role.findOne({
        where: {
          id: roleId,
          [Op.and]: [
            { is_system_role: false }, // Don't delete system roles
            {
              [Op.or]: [
                { tenant_id: tenantId },
                { tenant_id: null }
              ]
            }
          ]
        }
      });

      if (!role) {
        return { success: false, error: 'Role not found or cannot be deleted' };
      }

      await role.destroy();
      return { success: true };
    } catch (error) {
      console.error('Error deleting role:', error);
      return { success: false, error: error.message };
    }
  }

  // Get member permissions (all permissions from all roles)
  async getMemberPermissions(memberId, tenantId = null) {
    try {
      let whereClause = { id: memberId };
      if (tenantId) {
        whereClause.tenant_id = tenantId;
      }

      const member = await Member.findOne({
        where: whereClause,
        include: [
          {
            model: Role,
            as: 'roles',
            include: [
              {
                model: Permission,
                as: 'permissions',
                through: { attributes: [] }
              }
            ]
          }
        ]
      });

      if (!member) {
        return { success: false, error: 'Member not found' };
      }

      // Flatten all permissions from all roles
      const permissions = member.roles.reduce((acc, role) => {
        role.permissions.forEach(permission => {
          if (!acc.find(p => p.id === permission.id)) {
            acc.push(permission);
          }
        });
        return acc;
      }, []);

      return { success: true, data: permissions };
    } catch (error) {
      console.error('Error getting member permissions:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new MemberService();
