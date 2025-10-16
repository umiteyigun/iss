const jwt = require('jsonwebtoken');
const { Member } = require('../models');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    console.log('Auth header:', authHeader);
    const token = authHeader && authHeader.split(' ')[1];
    console.log('Token:', token ? 'Present' : 'Missing');

    if (!token) {
      console.log('No token provided');
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
        // Get member from database to ensure they still exist and are active
        const member = await Member.findByPk(decoded.userId);
        
        if (!member || !member.is_active) {
          return res.status(401).json({
            success: false,
            message: 'Invalid or inactive user'
          });
        }

    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role,
      tenantId: decoded.tenantId
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

const requireSuperAdmin = requireRole('super_admin');
const requireAdmin = requireRole(['super_admin', 'admin']);

module.exports = {
  authenticateToken,
  requireRole,
  requireSuperAdmin,
  requireAdmin
};
