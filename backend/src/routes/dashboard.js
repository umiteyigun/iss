const express = require('express');
const { User, Router, NasDevice, RadiusUser, Tenant } = require('../models');
const DashboardService = require('../services/DashboardService');
const { authenticateToken } = require('../middleware/auth');
const { requireDashboardAccess } = require('../middleware/moduleAuth');

const router = express.Router();
const dashboardService = new DashboardService();

// Get dashboard statistics
router.get('/stats', authenticateToken, requireDashboardAccess, async (req, res) => {
  try {
    // Super admin can select tenant via query param, otherwise use their tenant
    let tenantId = req.user?.tenantId;
    if (req.user?.role === 'super_admin' && req.query.tenantId !== undefined) {
      // If tenantId is 'null' or empty string, set to null for "All Tenants"
      if (req.query.tenantId === 'null' || req.query.tenantId === '') {
        tenantId = null;
      } else {
        tenantId = parseInt(req.query.tenantId);
      }
    }
    
    const stats = await dashboardService.getDashboardStats(tenantId);

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics'
    });
  }
});

// Get user status for charts
router.get('/user-status', authenticateToken, requireDashboardAccess, async (req, res) => {
  try {
    // Super admin can select tenant via query param, otherwise use their tenant
    let tenantId = req.user?.tenantId;
    if (req.user?.role === 'super_admin' && req.query.tenantId !== undefined) {
      // If tenantId is 'null' or empty string, set to null for "All Tenants"
      if (req.query.tenantId === 'null' || req.query.tenantId === '') {
        tenantId = null;
      } else {
        tenantId = parseInt(req.query.tenantId);
      }
    }
    
    const userStatus = await dashboardService.getUserStatus(tenantId);

    res.json({
      success: true,
      data: userStatus
    });

  } catch (error) {
    console.error('User status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user status'
    });
  }
});


// Get network traffic data
router.get('/traffic', authenticateToken, requireDashboardAccess, async (req, res) => {
  try {
    // Super admin can select tenant via query param, otherwise use their tenant
    let tenantId = req.user?.tenantId;
    if (req.user?.role === 'super_admin' && req.query.tenantId !== undefined) {
      // If tenantId is 'null' or empty string, set to null for "All Tenants"
      if (req.query.tenantId === 'null' || req.query.tenantId === '') {
        tenantId = null;
      } else {
        tenantId = parseInt(req.query.tenantId);
      }
    }
    
    const nasDeviceId = req.query.nasDeviceId ? parseInt(req.query.nasDeviceId) : null;
    const interfaceName = req.query.interface || null;
    
    const trafficData = await dashboardService.getNetworkTraffic(tenantId, nasDeviceId, interfaceName);

    res.json({
      success: true,
      data: trafficData.data
    });

  } catch (error) {
    console.error('Network traffic error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch network traffic data'
    });
  }
});

// Get system health
router.get('/health', authenticateToken, requireDashboardAccess, async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const health = await dashboardService.getSystemHealth(tenantId);

    res.json({
      success: true,
      data: health
    });

  } catch (error) {
    console.error('System health error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system health'
    });
  }
});

// Get NAS devices for traffic selection
router.get('/nas-devices', authenticateToken, requireDashboardAccess, async (req, res) => {
  try {
    // Super admin can select tenant via query param, otherwise use their tenant
    let tenantId = req.user?.tenantId;
    if (req.user?.role === 'super_admin' && req.query.tenantId !== undefined) {
      if (req.query.tenantId === 'null' || req.query.tenantId === '') {
        tenantId = null;
      } else {
        tenantId = parseInt(req.query.tenantId);
      }
    }

    const { NasDevice } = require('../models');
    const whereClause = tenantId ? { tenant_id: tenantId } : {};
    
    const nasDevices = await NasDevice.findAll({
      where: whereClause,
      attributes: ['id', 'nasname', 'shortname', 'status', 'tenant_id']
    });

    res.json({
      success: true,
      data: { nasDevices }
    });
  } catch (error) {
    console.error('Error getting NAS devices:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get NAS devices',
      error: error.message 
    });
  }
});

// Get interfaces for a specific NAS device
router.get('/nas-devices/:id/interfaces', authenticateToken, requireDashboardAccess, async (req, res) => {
  try {
    const nasDeviceId = parseInt(req.params.id);
    const MikrotikService = require('../services/MikrotikService');
    
    const { NasDevice } = require('../models');
    const nasDevice = await NasDevice.findByPk(nasDeviceId);
    
    if (!nasDevice) {
      return res.status(404).json({
        success: false,
        message: 'NAS device not found'
      });
    }

    const interfaces = await MikrotikService.getInterfaces(
      nasDevice.nasname,
      nasDevice.ruser,
      nasDevice.naspassword
    );

    res.json({
      success: true,
      data: { interfaces }
    });
  } catch (error) {
    console.error('Error getting interfaces:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get interfaces',
      error: error.message 
    });
  }
});

module.exports = router;
