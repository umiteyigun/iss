const express = require('express');
const { NasDevice, Tenant } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { Op } = require('sequelize');
const MikrotikService = require('../services/MikrotikService');

const router = express.Router();

// Get all NAS devices with pagination and search
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      tenant_id = '',
      status = '',
      sortBy = 'id',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    
    // Build where clause
    const whereClause = {};
    
    if (search) {
      whereClause[Op.or] = [
        { nasname: { [Op.like]: `%${search}%` } },
        { shortname: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }
    
    if (tenant_id) {
      whereClause.tenant_id = tenant_id;
    }
    
    if (status) {
      whereClause.status = status;
    }

    // Get NAS devices with pagination
    const { count, rows: nasDevices } = await NasDevice.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder.toUpperCase()]],
      include: [
        {
          model: Tenant,
          as: 'tenant',
          attributes: ['id', 'name', 'subdomain']
        }
      ],
      attributes: [
        'id',
        'nasname',
        'shortname',
        'type',
        'ports',
        'secret',
        'server',
        'community',
        'description',
        'tenant_id',
        'ruser',
        'naspassword'
      ]
    });

    // Calculate pagination info
    const totalPages = Math.ceil(count / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      success: true,
      data: {
        nasDevices,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: count,
          itemsPerPage: parseInt(limit),
          hasNextPage,
          hasPrevPage
        }
      }
    });

  } catch (error) {
    console.error('Get NAS devices error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch NAS devices',
      error: error.message 
    });
  }
});

// Get single NAS device by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const nasDevice = await NasDevice.findByPk(id, {
      include: [
        {
          model: Tenant,
          as: 'tenant',
          attributes: ['id', 'name', 'subdomain']
        }
      ],
      attributes: [
        'id',
        'nasname',
        'shortname',
        'type',
        'ports',
        'secret',
        'server',
        'community',
        'description',
        'tenant_id',
        'ruser',
        'naspassword'
      ]
    });

    if (!nasDevice) {
      return res.status(404).json({
        success: false,
        message: 'NAS device not found'
      });
    }

    res.json({
      success: true,
      data: { nasDevice }
    });

  } catch (error) {
    console.error('Get NAS device error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch NAS device',
      error: error.message 
    });
  }
});

// Create new NAS device
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      nasname,
      shortname,
      type = 'other',
      ports = 0,
      secret,
      server,
      community,
      description,
      tenant_id,
      ruser = 'admin',
      naspassword
    } = req.body;

    // Validate required fields
    if (!nasname || !secret || !tenant_id) {
      return res.status(400).json({
        success: false,
        message: 'NAS name, secret, and tenant are required'
      });
    }

    // Check if tenant exists
    const tenant = await Tenant.findByPk(tenant_id);
    if (!tenant) {
      return res.status(400).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    // Check if NAS name already exists for this tenant
    const existingNas = await NasDevice.findOne({
      where: {
        nasname,
        tenant_id
      }
    });

    if (existingNas) {
      return res.status(400).json({
        success: false,
        message: 'NAS device with this name already exists for this tenant'
      });
    }

    const nasDevice = await NasDevice.create({
      nasname,
      shortname,
      type,
      ports: parseInt(ports),
      secret,
      server,
      community,
      description,
      tenant_id: parseInt(tenant_id),
      ruser,
      naspassword
    });

    // Include tenant info in response
    const nasWithTenant = await NasDevice.findByPk(nasDevice.id, {
      include: [
        {
          model: Tenant,
          as: 'tenant',
          attributes: ['id', 'name', 'subdomain']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'NAS device created successfully',
      data: { nasDevice: nasWithTenant }
    });

  } catch (error) {
    console.error('Create NAS device error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create NAS device',
      error: error.message 
    });
  }
});

// Update NAS device
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const nasDevice = await NasDevice.findByPk(id);
    if (!nasDevice) {
      return res.status(404).json({
        success: false,
        message: 'NAS device not found'
      });
    }

    // Check if NAS name already exists for this tenant (excluding current device)
    if (updateData.nasname) {
      const existingNas = await NasDevice.findOne({
        where: {
          nasname: updateData.nasname,
          tenant_id: updateData.tenant_id || nasDevice.tenant_id,
          id: { [Op.ne]: id }
        }
      });

      if (existingNas) {
        return res.status(400).json({
          success: false,
          message: 'NAS device with this name already exists for this tenant'
        });
      }
    }

    // Validate tenant if being updated
    if (updateData.tenant_id) {
      const tenant = await Tenant.findByPk(updateData.tenant_id);
      if (!tenant) {
        return res.status(400).json({
          success: false,
          message: 'Tenant not found'
        });
      }
    }

    await nasDevice.update(updateData);

    // Include tenant info in response
    const updatedNas = await NasDevice.findByPk(id, {
      include: [
        {
          model: Tenant,
          as: 'tenant',
          attributes: ['id', 'name', 'subdomain']
        }
      ]
    });

    res.json({
      success: true,
      message: 'NAS device updated successfully',
      data: { nasDevice: updatedNas }
    });

  } catch (error) {
    console.error('Update NAS device error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update NAS device',
      error: error.message 
    });
  }
});

// Delete NAS device
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const nasDevice = await NasDevice.findByPk(id);
    if (!nasDevice) {
      return res.status(404).json({
        success: false,
        message: 'NAS device not found'
      });
    }

    await nasDevice.destroy();

    res.json({
      success: true,
      message: 'NAS device deleted successfully'
    });

  } catch (error) {
    console.error('Delete NAS device error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete NAS device',
      error: error.message 
    });
  }
});

// Get NAS device statistics
router.get('/:id/stats', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const nasDevice = await NasDevice.findByPk(id);
    if (!nasDevice) {
      return res.status(404).json({
        success: false,
        message: 'NAS device not found'
      });
    }

    // Get basic stats (can be expanded with more detailed statistics)
    const stats = {
      total_sessions: 0, // Will be implemented when we add session counting
      active_sessions: 0, // Will be implemented when we add session counting
      last_activity: nasDevice.updated_at,
      created_at: nasDevice.created_at
    };

    res.json({
      success: true,
      data: { stats }
    });

  } catch (error) {
    console.error('Get NAS device stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch NAS device statistics',
      error: error.message 
    });
  }
});

// Test NAS device connectivity
router.post('/:id/test', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password } = req.body;

    const nasDevice = await NasDevice.findByPk(id);
    if (!nasDevice) {
      return res.status(404).json({
        success: false,
        message: 'NAS device not found'
      });
    }

    if (!nasDevice.nasname) {
      return res.status(400).json({
        success: false,
        message: 'NAS device IP address not configured'
      });
    }

    // Use device's own credentials from database
    const apiUsername = nasDevice.ruser || 'admin';
    const apiPassword = nasDevice.naspassword || nasDevice.secret;

    if (!apiPassword) {
      return res.status(400).json({
        success: false,
        message: 'API credentials not provided'
      });
    }

    const testResult = await MikrotikService.testConnection(nasDevice.nasname, apiUsername, apiPassword);

    res.json(testResult);

  } catch (error) {
    console.error('Test NAS device error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to test NAS device',
      error: error.message 
    });
  }
});

// Get Mikrotik device information
router.get('/:id/mikrotik-info', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const nasDevice = await NasDevice.findByPk(id);
    if (!nasDevice) {
      return res.status(404).json({
        success: false,
        message: 'NAS device not found'
      });
    }

    if (!nasDevice.nasname) {
      return res.status(400).json({
        success: false,
        message: 'NAS device IP address not configured'
      });
    }

    // Use device's own credentials from database
    const apiUsername = nasDevice.ruser || 'admin';
    const apiPassword = nasDevice.naspassword || nasDevice.secret;

    if (!apiPassword) {
      return res.status(400).json({
        success: false,
        message: 'API credentials not provided'
      });
    }

    const mikrotikInfo = await MikrotikService.getMikrotikInfo(nasDevice.nasname, apiUsername, apiPassword);

    res.json(mikrotikInfo);

  } catch (error) {
    console.error('Get Mikrotik info error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get Mikrotik device information',
      error: error.message 
    });
  }
});

// Get specific interface details
router.get('/:id/interface/:interfaceName', authenticateToken, async (req, res) => {
  try {
    const { id, interfaceName } = req.params;
    const { username, password } = req.query;

    const nasDevice = await NasDevice.findByPk(id);
    if (!nasDevice) {
      return res.status(404).json({
        success: false,
        message: 'NAS device not found'
      });
    }

    if (!nasDevice.nasname) {
      return res.status(400).json({
        success: false,
        message: 'NAS device IP address not configured'
      });
    }

    // Use device's own credentials from database
    const apiUsername = nasDevice.ruser || 'admin';
    const apiPassword = nasDevice.naspassword || nasDevice.secret;

    if (!apiPassword) {
      return res.status(400).json({
        success: false,
        message: 'API credentials not provided'
      });
    }

    const interfaceDetails = await MikrotikService.getInterfaceDetails(nasDevice.nasname, apiUsername, apiPassword, interfaceName);

    res.json(interfaceDetails);

  } catch (error) {
    console.error('Get interface details error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get interface details',
      error: error.message 
    });
  }
});

// Get IP Addresses
router.get('/:id/ip-addresses', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const nasDevice = await NasDevice.findByPk(id);
    if (!nasDevice) {
      return res.status(404).json({
        success: false,
        message: 'NAS device not found'
      });
    }

    if (!nasDevice.nasname) {
      return res.status(400).json({
        success: false,
        message: 'NAS device IP address not configured'
      });
    }

    const apiUsername = nasDevice.ruser || 'admin';
    const apiPassword = nasDevice.naspassword || nasDevice.secret;

    if (!apiPassword) {
      return res.status(400).json({
        success: false,
        message: 'API credentials not provided'
      });
    }

    const result = await MikrotikService.getIpAddresses(nasDevice.nasname, apiUsername, apiPassword);
    res.json(result);

  } catch (error) {
    console.error('Get IP addresses error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get IP addresses',
      error: error.message 
    });
  }
});

// Add IP Address
router.post('/:id/ip-addresses', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password } = req.query;
    const { address, interface: interfaceName, comment, disabled } = req.body;

    if (!address || !interfaceName) {
      return res.status(400).json({
        success: false,
        message: 'Address and interface are required'
      });
    }

    const nasDevice = await NasDevice.findByPk(id);
    if (!nasDevice) {
      return res.status(404).json({
        success: false,
        message: 'NAS device not found'
      });
    }

    const apiUsername = nasDevice.ruser || 'admin';
    const apiPassword = nasDevice.naspassword || nasDevice.secret;

    if (!apiPassword) {
      return res.status(400).json({
        success: false,
        message: 'API credentials not provided'
      });
    }

    const addressData = {
      address,
      interface: interfaceName,
      comment: comment || '',
      disabled: disabled || false
    };

    const result = await MikrotikService.addIpAddress(nasDevice.nasname, apiUsername, apiPassword, addressData);
    res.json(result);

  } catch (error) {
    console.error('Add IP address error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to add IP address',
      error: error.message 
    });
  }
});

// Update IP Address
router.put('/:id/ip-addresses/:addressId', authenticateToken, async (req, res) => {
  try {
    const { id, addressId } = req.params;
    const { username, password } = req.query;
    const { address, interface: interfaceName, comment, disabled } = req.body;

    const nasDevice = await NasDevice.findByPk(id);
    if (!nasDevice) {
      return res.status(404).json({
        success: false,
        message: 'NAS device not found'
      });
    }

    const apiUsername = nasDevice.ruser || 'admin';
    const apiPassword = nasDevice.naspassword || nasDevice.secret;

    if (!apiPassword) {
      return res.status(400).json({
        success: false,
        message: 'API credentials not provided'
      });
    }

    const addressData = {};
    if (address) addressData.address = address;
    if (interfaceName) addressData.interface = interfaceName;
    if (comment !== undefined) addressData.comment = comment;
    if (disabled !== undefined) addressData.disabled = disabled;

    const result = await MikrotikService.updateIpAddress(nasDevice.nasname, apiUsername, apiPassword, addressId, addressData);
    res.json(result);

  } catch (error) {
    console.error('Update IP address error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update IP address',
      error: error.message 
    });
  }
});

// Delete IP Address
router.delete('/:id/ip-addresses/:addressId', authenticateToken, async (req, res) => {
  try {
    const { id, addressId } = req.params;
    const { username, password } = req.query;

    const nasDevice = await NasDevice.findByPk(id);
    if (!nasDevice) {
      return res.status(404).json({
        success: false,
        message: 'NAS device not found'
      });
    }

    const apiUsername = nasDevice.ruser || 'admin';
    const apiPassword = nasDevice.naspassword || nasDevice.secret;

    if (!apiPassword) {
      return res.status(400).json({
        success: false,
        message: 'API credentials not provided'
      });
    }

    const result = await MikrotikService.deleteIpAddress(nasDevice.nasname, apiUsername, apiPassword, addressId);
    res.json(result);

  } catch (error) {
    console.error('Delete IP address error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete IP address',
      error: error.message 
    });
  }
});

// Get Routes
router.get('/:id/routes', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const nasDevice = await NasDevice.findByPk(id);
    if (!nasDevice) {
      return res.status(404).json({
        success: false,
        message: 'NAS device not found'
      });
    }

    if (!nasDevice.nasname) {
      return res.status(400).json({
        success: false,
        message: 'NAS device IP address not configured'
      });
    }

    const apiUsername = nasDevice.ruser || 'admin';
    const apiPassword = nasDevice.naspassword || nasDevice.secret;

    if (!apiPassword) {
      return res.status(400).json({
        success: false,
        message: 'API credentials not provided'
      });
    }

    const result = await MikrotikService.getRoutes(nasDevice.nasname, apiUsername, apiPassword);
    res.json(result);

  } catch (error) {
    console.error('Get routes error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get routes',
      error: error.message 
    });
  }
});

// Add Route
router.post('/:id/routes', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password } = req.query;
    const routeData = req.body;

    const nasDevice = await NasDevice.findByPk(id);
    if (!nasDevice) {
      return res.status(404).json({
        success: false,
        message: 'NAS device not found'
      });
    }

    const apiUsername = nasDevice.ruser || 'admin';
    const apiPassword = nasDevice.naspassword || nasDevice.secret;

    if (!apiPassword) {
      return res.status(400).json({
        success: false,
        message: 'API credentials not provided'
      });
    }

    const result = await MikrotikService.addRoute(nasDevice.nasname, apiUsername, apiPassword, routeData);
    res.json(result);

  } catch (error) {
    console.error('Add route error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to add route',
      error: error.message 
    });
  }
});

// Update Route
router.put('/:id/routes/:routeId', authenticateToken, async (req, res) => {
  try {
    const { id, routeId } = req.params;
    const { username, password } = req.query;
    const routeData = req.body;

    const nasDevice = await NasDevice.findByPk(id);
    if (!nasDevice) {
      return res.status(404).json({
        success: false,
        message: 'NAS device not found'
      });
    }

    const apiUsername = nasDevice.ruser || 'admin';
    const apiPassword = nasDevice.naspassword || nasDevice.secret;

    if (!apiPassword) {
      return res.status(400).json({
        success: false,
        message: 'API credentials not provided'
      });
    }

    const result = await MikrotikService.updateRoute(nasDevice.nasname, apiUsername, apiPassword, routeId, routeData);
    res.json(result);

  } catch (error) {
    console.error('Update route error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update route',
      error: error.message 
    });
  }
});

// Delete Route
router.delete('/:id/routes/:routeId', authenticateToken, async (req, res) => {
  try {
    const { id, routeId } = req.params;
    const { username, password } = req.query;

    const nasDevice = await NasDevice.findByPk(id);
    if (!nasDevice) {
      return res.status(404).json({
        success: false,
        message: 'NAS device not found'
      });
    }

    const apiUsername = nasDevice.ruser || 'admin';
    const apiPassword = nasDevice.naspassword || nasDevice.secret;

    if (!apiPassword) {
      return res.status(400).json({
        success: false,
        message: 'API credentials not provided'
      });
    }

    const result = await MikrotikService.deleteRoute(nasDevice.nasname, apiUsername, apiPassword, routeId);
    res.json(result);

  } catch (error) {
    console.error('Delete route error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete route',
      error: error.message 
    });
  }
});

// Get Firewall Rules
router.get('/:id/firewall-rules', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const nasDevice = await NasDevice.findByPk(id);
    if (!nasDevice) {
      return res.status(404).json({
        success: false,
        message: 'NAS device not found'
      });
    }

    if (!nasDevice.nasname) {
      return res.status(400).json({
        success: false,
        message: 'NAS device IP address not configured'
      });
    }

    const apiUsername = nasDevice.ruser || 'admin';
    const apiPassword = nasDevice.naspassword || nasDevice.secret;

    if (!apiPassword) {
      return res.status(400).json({
        success: false,
        message: 'API credentials not provided'
      });
    }

    const result = await MikrotikService.getFirewallRules(nasDevice.nasname, apiUsername, apiPassword);
    res.json(result);

  } catch (error) {
    console.error('Get firewall rules error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get firewall rules',
      error: error.message 
    });
  }
});

// Get NAT Rules
router.get('/:id/nat-rules', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const nasDevice = await NasDevice.findByPk(id);
    if (!nasDevice) {
      return res.status(404).json({
        success: false,
        message: 'NAS device not found'
      });
    }

    if (!nasDevice.nasname) {
      return res.status(400).json({
        success: false,
        message: 'NAS device IP address not configured'
      });
    }

    const apiUsername = nasDevice.ruser || 'admin';
    const apiPassword = nasDevice.naspassword || nasDevice.secret;

    if (!apiPassword) {
      return res.status(400).json({
        success: false,
        message: 'API credentials not provided'
      });
    }

    const result = await MikrotikService.getNatRules(nasDevice.nasname, apiUsername, apiPassword);
    res.json(result);

  } catch (error) {
    console.error('Get NAT rules error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get NAT rules',
      error: error.message 
    });
  }
});

// Get DHCP Server
router.get('/:id/dhcp-server', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const nasDevice = await NasDevice.findByPk(id);
    if (!nasDevice) {
      return res.status(404).json({
        success: false,
        message: 'NAS device not found'
      });
    }

    if (!nasDevice.nasname) {
      return res.status(400).json({
        success: false,
        message: 'NAS device IP address not configured'
      });
    }

    const apiUsername = nasDevice.ruser || 'admin';
    const apiPassword = nasDevice.naspassword || nasDevice.secret;

    if (!apiPassword) {
      return res.status(400).json({
        success: false,
        message: 'API credentials not provided'
      });
    }

    const result = await MikrotikService.getDhcpServer(nasDevice.nasname, apiUsername, apiPassword);
    res.json(result);

  } catch (error) {
    console.error('Get DHCP server error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get DHCP server',
      error: error.message 
    });
  }
});

// Get DHCP Client
router.get('/:id/dhcp-client', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const nasDevice = await NasDevice.findByPk(id);
    if (!nasDevice) {
      return res.status(404).json({
        success: false,
        message: 'NAS device not found'
      });
    }

    if (!nasDevice.nasname) {
      return res.status(400).json({
        success: false,
        message: 'NAS device IP address not configured'
      });
    }

    const apiUsername = nasDevice.ruser || 'admin';
    const apiPassword = nasDevice.naspassword || nasDevice.secret;

    if (!apiPassword) {
      return res.status(400).json({
        success: false,
        message: 'API credentials not provided'
      });
    }

    const result = await MikrotikService.getDhcpClient(nasDevice.nasname, apiUsername, apiPassword);
    res.json(result);

  } catch (error) {
    console.error('Get DHCP client error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get DHCP client',
      error: error.message 
    });
  }
});

// Add DHCP Server
router.post('/:id/dhcp-server', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password } = req.query;
    const serverData = req.body;

    const nasDevice = await NasDevice.findByPk(id);
    if (!nasDevice) {
      return res.status(404).json({
        success: false,
        message: 'NAS device not found'
      });
    }

    const apiUsername = nasDevice.ruser || 'admin';
    const apiPassword = nasDevice.naspassword || nasDevice.secret;

    if (!apiPassword) {
      return res.status(400).json({
        success: false,
        message: 'API credentials not provided'
      });
    }

    const result = await MikrotikService.addDhcpServer(nasDevice.nasname, apiUsername, apiPassword, serverData);
    res.json(result);

  } catch (error) {
    console.error('Add DHCP server error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to add DHCP server',
      error: error.message 
    });
  }
});

// Update DHCP Server
router.put('/:id/dhcp-server/:serverId', authenticateToken, async (req, res) => {
  try {
    const { id, serverId } = req.params;
    const { username, password } = req.query;
    const serverData = req.body;

    const nasDevice = await NasDevice.findByPk(id);
    if (!nasDevice) {
      return res.status(404).json({
        success: false,
        message: 'NAS device not found'
      });
    }

    const apiUsername = nasDevice.ruser || 'admin';
    const apiPassword = nasDevice.naspassword || nasDevice.secret;

    if (!apiPassword) {
      return res.status(400).json({
        success: false,
        message: 'API credentials not provided'
      });
    }

    const result = await MikrotikService.updateDhcpServer(nasDevice.nasname, apiUsername, apiPassword, serverId, serverData);
    res.json(result);

  } catch (error) {
    console.error('Update DHCP server error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update DHCP server',
      error: error.message 
    });
  }
});

// Delete DHCP Server
router.delete('/:id/dhcp-server/:serverId', authenticateToken, async (req, res) => {
  try {
    const { id, serverId } = req.params;
    const { username, password } = req.query;

    const nasDevice = await NasDevice.findByPk(id);
    if (!nasDevice) {
      return res.status(404).json({
        success: false,
        message: 'NAS device not found'
      });
    }

    const apiUsername = nasDevice.ruser || 'admin';
    const apiPassword = nasDevice.naspassword || nasDevice.secret;

    if (!apiPassword) {
      return res.status(400).json({
        success: false,
        message: 'API credentials not provided'
      });
    }

    const result = await MikrotikService.deleteDhcpServer(nasDevice.nasname, apiUsername, apiPassword, serverId);
    res.json(result);

  } catch (error) {
    console.error('Delete DHCP server error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete DHCP server',
      error: error.message 
    });
  }
});

// Get DHCP Server Leases
router.get('/:id/dhcp-server-leases', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const nasDevice = await NasDevice.findByPk(id);
    if (!nasDevice) {
      return res.status(404).json({
        success: false,
        message: 'NAS device not found'
      });
    }

    if (!nasDevice.nasname) {
      return res.status(400).json({
        success: false,
        message: 'NAS device IP address not configured'
      });
    }

    const apiUsername = nasDevice.ruser || 'admin';
    const apiPassword = nasDevice.naspassword || nasDevice.secret;

    if (!apiPassword) {
      return res.status(400).json({
        success: false,
        message: 'API credentials not provided'
      });
    }

    const result = await MikrotikService.getDhcpServerLeases(nasDevice.nasname, apiUsername, apiPassword);
    res.json(result);

  } catch (error) {
    console.error('Get DHCP server leases error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get DHCP server leases',
      error: error.message 
    });
  }
});

// Get DNS
router.get('/:id/dns', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const nasDevice = await NasDevice.findByPk(id);
    if (!nasDevice) {
      return res.status(404).json({
        success: false,
        message: 'NAS device not found'
      });
    }

    if (!nasDevice.nasname) {
      return res.status(400).json({
        success: false,
        message: 'NAS device IP address not configured'
      });
    }

    const apiUsername = nasDevice.ruser || 'admin';
    const apiPassword = nasDevice.naspassword || nasDevice.secret;

    if (!apiPassword) {
      return res.status(400).json({
        success: false,
        message: 'API credentials not provided'
      });
    }

    const result = await MikrotikService.getDns(nasDevice.nasname, apiUsername, apiPassword);
    res.json(result);

  } catch (error) {
    console.error('Get DNS error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get DNS',
      error: error.message 
    });
  }
});

// Get DNS static records
router.get('/:id/dns-static', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const nasDevice = await NasDevice.findByPk(id);
    if (!nasDevice) {
      return res.status(404).json({
        success: false,
        message: 'NAS device not found'
      });
    }

    if (!nasDevice.nasname) {
      return res.status(400).json({
        success: false,
        message: 'NAS device IP address not configured'
      });
    }

    const apiUsername = nasDevice.ruser || 'admin';
    const apiPassword = nasDevice.naspassword || nasDevice.secret;

    if (!apiPassword) {
      return res.status(400).json({
        success: false,
        message: 'API credentials not provided'
      });
    }

    const result = await MikrotikService.getDnsStatic(nasDevice.nasname, apiUsername, apiPassword);
    res.json(result);

  } catch (error) {
    console.error('Get DNS static records error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get DNS static records',
      error: error.message 
    });
  }
});

// DNS Static Records CRUD routes
router.post('/:id/dns-static', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const record = req.body;

    const nasDevice = await NasDevice.findByPk(id);
    if (!nasDevice) {
      return res.status(404).json({
        success: false,
        message: 'NAS device not found'
      });
    }

    const apiUsername = nasDevice.ruser || 'admin';
    const apiPassword = nasDevice.naspassword || nasDevice.secret;

    const result = await MikrotikService.addDnsStaticRecord(nasDevice.nasname, apiUsername, apiPassword, record);
    res.json(result);

  } catch (error) {
    console.error('Add DNS static record error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to add DNS static record',
      error: error.message 
    });
  }
});

router.put('/:id/dns-static/:recordId', authenticateToken, async (req, res) => {
  try {
    const { id, recordId } = req.params;
    const record = req.body;

    const nasDevice = await NasDevice.findByPk(id);
    if (!nasDevice) {
      return res.status(404).json({
        success: false,
        message: 'NAS device not found'
      });
    }

    const apiUsername = nasDevice.ruser || 'admin';
    const apiPassword = nasDevice.naspassword || nasDevice.secret;

    const result = await MikrotikService.updateDnsStaticRecord(nasDevice.nasname, apiUsername, apiPassword, recordId, record);
    res.json(result);

  } catch (error) {
    console.error('Update DNS static record error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update DNS static record',
      error: error.message 
    });
  }
});

router.delete('/:id/dns-static/:recordId', authenticateToken, async (req, res) => {
  try {
    const { id, recordId } = req.params;

    const nasDevice = await NasDevice.findByPk(id);
    if (!nasDevice) {
      return res.status(404).json({
        success: false,
        message: 'NAS device not found'
      });
    }

    const apiUsername = nasDevice.ruser || 'admin';
    const apiPassword = nasDevice.naspassword || nasDevice.secret;

    const result = await MikrotikService.deleteDnsStaticRecord(nasDevice.nasname, apiUsername, apiPassword, recordId);
    res.json(result);

  } catch (error) {
    console.error('Delete DNS static record error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete DNS static record',
      error: error.message 
    });
  }
});

// Update DNS settings
router.put('/:id/dns', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const dnsSettings = req.body;

    const nasDevice = await NasDevice.findByPk(id);
    if (!nasDevice) {
      return res.status(404).json({
        success: false,
        message: 'NAS device not found'
      });
    }

    if (!nasDevice.nasname) {
      return res.status(400).json({
        success: false,
        message: 'NAS device IP address not configured'
      });
    }

    const apiUsername = nasDevice.ruser || 'admin';
    const apiPassword = nasDevice.naspassword || nasDevice.secret;

    if (!apiPassword) {
      return res.status(400).json({
        success: false,
        message: 'API credentials not provided'
      });
    }

    const result = await MikrotikService.updateDns(nasDevice.nasname, apiUsername, apiPassword, dnsSettings);
    res.json(result);

  } catch (error) {
    console.error('Update DNS error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update DNS settings',
      error: error.message 
    });
  }
});

// Get ARP
router.get('/:id/arp', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const nasDevice = await NasDevice.findByPk(id);
    if (!nasDevice) {
      return res.status(404).json({
        success: false,
        message: 'NAS device not found'
      });
    }

    if (!nasDevice.nasname) {
      return res.status(400).json({
        success: false,
        message: 'NAS device IP address not configured'
      });
    }

    const apiUsername = nasDevice.ruser || 'admin';
    const apiPassword = nasDevice.naspassword || nasDevice.secret;

    if (!apiPassword) {
      return res.status(400).json({
        success: false,
        message: 'API credentials not provided'
      });
    }

    const result = await MikrotikService.getArp(nasDevice.nasname, apiUsername, apiPassword);
    res.json(result);

  } catch (error) {
    console.error('Get ARP error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get ARP',
      error: error.message 
    });
  }
});

// Get PPPoE Secrets
router.get('/:id/pppoe-secrets', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const nasDevice = await NasDevice.findByPk(id);
    if (!nasDevice) {
      return res.status(404).json({
        success: false,
        message: 'NAS device not found'
      });
    }

    const result = await MikrotikService.getPppoeSecrets(id);
    
    res.json(result);
  } catch (error) {
    console.error('Get PPPoE secrets error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get PPPoE secrets',
      error: error.message
    });
  }
});

// Get PPP Profiles
router.get('/:id/ppp-profiles', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const nasDevice = await NasDevice.findByPk(id);
    if (!nasDevice) {
      return res.status(404).json({
        success: false,
        message: 'NAS device not found'
      });
    }

    const result = await MikrotikService.getPppProfiles(id);
    
    res.json(result);
  } catch (error) {
    console.error('Get PPP profiles error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get PPP profiles',
      error: error.message
    });
  }
});

// Get Active PPP Sessions
router.get('/:id/active-ppp', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const nasDevice = await NasDevice.findByPk(id);
    if (!nasDevice) {
      return res.status(404).json({
        success: false,
        message: 'NAS device not found'
      });
    }


    const result = await MikrotikService.getActivePppSessions(id);
    
    res.json(result);
  } catch (error) {
    console.error('Get active PPP sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get active PPP sessions',
      error: error.message
    });
  }
});

// PPPoE Secrets CRUD routes
router.post('/:id/pppoe-secrets', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const secretData = req.body;
    
    const nasDevice = await NasDevice.findByPk(id);
    if (!nasDevice) {
      return res.status(404).json({
        success: false,
        message: 'NAS device not found'
      });
    }

    const result = await MikrotikService.createPppoeSecret(id, secretData);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Create PPPoE secret error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create PPPoE secret',
      error: error.message
    });
  }
});

router.put('/:id/pppoe-secrets/:secretId', authenticateToken, async (req, res) => {
  try {
    const { id, secretId } = req.params;
    const secretData = req.body;
    
    const nasDevice = await NasDevice.findByPk(id);
    if (!nasDevice) {
      return res.status(404).json({
        success: false,
        message: 'NAS device not found'
      });
    }

    const result = await MikrotikService.updatePppoeSecret(id, secretId, secretData);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Update PPPoE secret error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update PPPoE secret',
      error: error.message
    });
  }
});

router.delete('/:id/pppoe-secrets/:secretId', authenticateToken, async (req, res) => {
  try {
    const { id, secretId } = req.params;
    
    const nasDevice = await NasDevice.findByPk(id);
    if (!nasDevice) {
      return res.status(404).json({
        success: false,
        message: 'NAS device not found'
      });
    }

    const result = await MikrotikService.deletePppoeSecret(id, secretId);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Delete PPPoE secret error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete PPPoE secret',
      error: error.message
    });
  }
});

router.put('/:id/pppoe-secrets/:secretId/toggle', authenticateToken, async (req, res) => {
  try {
    const { id, secretId } = req.params;
    const { disabled } = req.body;
    
    const nasDevice = await NasDevice.findByPk(id);
    if (!nasDevice) {
      return res.status(404).json({
        success: false,
        message: 'NAS device not found'
      });
    }

    const result = await MikrotikService.togglePppoeSecret(id, secretId, disabled);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Toggle PPPoE secret error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle PPPoE secret',
      error: error.message
    });
  }
});

// Get neighbor discovery entries
router.get('/:id/neighbor', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const nasDevice = await NasDevice.findByPk(id);
    if (!nasDevice) {
      return res.status(404).json({
        success: false,
        error: 'NAS device not found'
      });
    }

    const result = await MikrotikService.getNeighborEntries(id);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Neighbor discovery error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;