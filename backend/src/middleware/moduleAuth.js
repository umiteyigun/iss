const { User, Role, Permission, RolePermission } = require('../models');

/**
 * Module-based authorization middleware
 * Checks if user has permission to access specific modules
 */
const requireModulePermission = (moduleName) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const userId = req.user.userId;
      const userRole = req.user.role;

      // Super admin has access to all modules
      if (userRole === 'super_admin') {
        return next();
      }

      // Get user's role and permissions
      const user = await User.findByPk(userId, {
        include: [
          {
            model: Role,
            as: 'role',
            include: [
              {
                model: Permission,
                as: 'permissions',
                where: { module: moduleName },
                required: false
              }
            ]
          }
        ]
      });

      if (!user || !user.role) {
        return res.status(403).json({
          success: false,
          message: 'User role not found'
        });
      }

      // Check if user has permission for this module
      const hasPermission = user.role.permissions && user.role.permissions.length > 0;

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: `Access denied to ${moduleName} module`
        });
      }

      next();
    } catch (error) {
      console.error('Module auth error:', error);
      return res.status(500).json({
        success: false,
        message: 'Authorization error'
      });
    }
  };
};

/**
 * Dashboard is accessible to all authenticated users
 */
const requireDashboardAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  next();
};

/**
 * Check if user can access tenant-specific data
 */
const requireTenantAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  const userTenantId = req.user.tenantId;
  const requestedTenantId = req.params.tenantId || req.body.tenantId;

  // Super admin can access all tenants
  if (req.user.role === 'super_admin') {
    return next();
  }

  // Regular users can only access their own tenant data
  if (userTenantId && requestedTenantId && userTenantId !== parseInt(requestedTenantId)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied to other tenant data'
    });
  }

  next();
};

module.exports = {
  requireModulePermission,
  requireDashboardAccess,
  requireTenantAccess
};
