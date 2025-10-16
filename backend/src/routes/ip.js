const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Radippool, MetroIP, Tenant } = require('../models');

// Get IP Pools
router.get('/pools', async (req, res) => {
  try {
    const userTenantId = req.user?.tenantId;
    const requestedTenantId = req.query.tenantId && req.query.tenantId !== 'null' ? parseInt(req.query.tenantId) : null;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search;
    const offset = (page - 1) * limit;

    const whereClause = {};

    // Apply tenant filtering
    if (userTenantId !== null && userTenantId !== undefined && userTenantId !== 0) {
      // Regular admin can only see their tenant's data
      whereClause.tenant_id = userTenantId;
    } else if (requestedTenantId !== null) {
      // Super admin can filter by specific tenant
      whereClause.tenant_id = requestedTenantId;
    }

    // Apply search filter
    if (search) {
      whereClause[Op.or] = [
        { pool_name: { [Op.like]: `%${search}%` } },
        { framedipaddress: { [Op.like]: `%${search}%` } },
        { username: { [Op.like]: `%${search}%` } },
        { nasipaddress: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: ipPools } = await Radippool.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['id', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        pools: ipPools,
        pagination: {
          total: count,
          page,
          limit,
          pages: Math.ceil(count / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get IP pools error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch IP pools'
    });
  }
});

// Get Metro IPs
router.get('/metroips', async (req, res) => {
  try {
    const userTenantId = req.user?.tenantId;
    const requestedTenantId = req.query.tenantId && req.query.tenantId !== 'null' ? parseInt(req.query.tenantId) : null;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search;
    const metroIpFilter = req.query.metroIpFilter;
    const ipAddressFilter = req.query.ipAddressFilter;
    const nasNameFilter = req.query.nasNameFilter;
    const offset = (page - 1) * limit;

    console.log('🔍 Backend - Metro IPs - userTenantId:', userTenantId);
    console.log('🔍 Backend - Metro IPs - requestedTenantId:', requestedTenantId);
    console.log('🔍 Backend - Metro IPs - filters:', { metroIpFilter, ipAddressFilter, nasNameFilter });

    const whereClause = {};

    // Apply tenant filtering
    if (userTenantId !== null && userTenantId !== undefined && userTenantId !== 0) {
      // Regular admin can only see their tenant's data
      whereClause.tenant_id = userTenantId;
    } else if (requestedTenantId !== null) {
      // Super admin can filter by specific tenant
      whereClause.tenant_id = requestedTenantId;
    }

    // Apply search filter
    if (search) {
      whereClause[Op.or] = [
        { nasname: { [Op.like]: `%${search}%` } },
        { ipaddress: { [Op.like]: `%${search}%` } },
        { user: { [Op.like]: `%${search}%` } },
        { ports: { [Op.like]: `%${search}%` } }
      ];
    }

        // Apply Metro IP specific filters
        if (metroIpFilter) {
          switch (metroIpFilter) {
            case 'available':
              whereClause.user = { [Op.is]: null };
              break;
            case 'in_use':
              whereClause.user = { [Op.ne]: null };
              break;
            case 'static':
              // Static IPs (ip_type = 0)
              whereClause.ip_type = 0;
              break;
            case 'shared':
              // Shared IPs (ip_type = 1)
              whereClause.ip_type = 1;
              break;
          }
        }

    // IP Address filter
    if (ipAddressFilter) {
      whereClause.ipaddress = { [Op.like]: `%${ipAddressFilter}%` };
    }

    // NAS Name filter
    if (nasNameFilter) {
      whereClause.nasname = { [Op.like]: `%${nasNameFilter}%` };
    }

    console.log('🔍 Backend - Metro IPs - whereClause:', whereClause);

    const { count, rows: metroIPs } = await MetroIP.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['id', 'DESC']]
    });

    console.log('🔍 Backend - Found Metro IPs:', metroIPs.length);
    console.log('🔍 Backend - Total count:', count);

    res.json({
      success: true,
      data: {
        metroips: metroIPs,
        pagination: {
          total: count,
          page,
          limit,
          pages: Math.ceil(count / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get Metro IPs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Metro IPs'
    });
  }
});

// Create IP Pool
router.post('/pools', async (req, res) => {
  try {
    const userTenantId = req.user?.tenantId;
    const { pool_name, nasname, framedipaddress, tenant_id } = req.body;

    console.log('🔍 Backend - Create IP Pool - userTenantId:', userTenantId);
    console.log('🔍 Backend - Create IP Pool - data:', { pool_name, nasname, framedipaddress, tenant_id });

    let poolTenantId = userTenantId;
    if (userTenantId === 0 || userTenantId === null) {
      if (tenant_id && tenant_id !== 'null') {
        poolTenantId = parseInt(tenant_id);
      }
    }

    const ipPool = await Radippool.create({
      pool_name,
      nasname,
      framedipaddress,
      tenant_id: poolTenantId
    });

    console.log('✅ Backend - IP Pool created:', ipPool.id);

    res.json({
      success: true,
      message: 'IP Pool created successfully',
      data: ipPool
    });

  } catch (error) {
    console.error('Create IP Pool error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create IP Pool'
    });
  }
});

// Create Metro IP
router.post('/metroips', async (req, res) => {
  try {
    const userTenantId = req.user?.tenantId;
    const { nasname, ipaddress, ports, user, tenant_id, ip_type } = req.body;

    console.log('🔍 Backend - Create Metro IP - userTenantId:', userTenantId);
    console.log('🔍 Backend - Create Metro IP - data:', { nasname, ipaddress, ports, user, tenant_id, ip_type });

    let metroTenantId = userTenantId;
    if (userTenantId === 0 || userTenantId === null) {
      if (tenant_id && tenant_id !== 'null') {
        metroTenantId = parseInt(tenant_id);
      }
    }

    const metroIP = await MetroIP.create({
      nasname,
      ipaddress,
      ports,
      user,
      tenant_id: metroTenantId,
      ip_type: ip_type || 0
    });

    console.log('✅ Backend - Metro IP created:', metroIP.id);

    res.json({
      success: true,
      message: 'Metro IP created successfully',
      data: metroIP
    });

  } catch (error) {
    console.error('Create Metro IP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create Metro IP'
    });
  }
});

module.exports = router;
