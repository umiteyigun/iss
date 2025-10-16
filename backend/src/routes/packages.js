const express = require('express');
const { Package, Tenant } = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

// Get all packages
router.get('/', async (req, res) => {
  try {
    const userTenantId = req.user?.tenantId;
    const requestedTenantId = req.query.tenantId && req.query.tenantId !== 'null' ? parseInt(req.query.tenantId) : null;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    let whereClause = {};
    
    // Tenant filtering
    // Super admin (tenant_id = 0 or null) can see all packages or filter by specific tenant
    // Regular admin can only see their tenant packages
    if (userTenantId === 0 || userTenantId === null) {
      // Super admin - use requested tenantId if provided, otherwise show all
      if (requestedTenantId !== null && requestedTenantId !== undefined) {
        whereClause.tenant_id = requestedTenantId;
      }
      // If no tenantId requested, show all (no filter)
    } else {
      // Regular admin - only show their tenant packages
      whereClause.tenant_id = userTenantId;
    }

    // Search functionality
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { download: { [Op.like]: `%${search}%` } },
        { upload: { [Op.like]: `%${search}%` } }
      ];
    }

    console.log('🔍 Backend Packages - userTenantId:', userTenantId);
    console.log('🔍 Backend Packages - requestedTenantId:', requestedTenantId);
    console.log('🔍 Backend Packages - whereClause:', whereClause);
    
    const { count, rows: packages } = await Package.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['name', 'ASC']],
      include: [
        {
          model: Tenant,
          as: 'tenant',
          attributes: ['id', 'name']
        }
      ]
    });

    console.log('🔍 Backend Packages - Found packages:', packages.length);
    console.log('🔍 Backend Packages - Total count:', count);

    res.json({
      success: true,
      data: {
        packages,
        pagination: {
          total: count,
          page,
          limit,
          pages: Math.ceil(count / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get packages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch packages'
    });
  }
});

// Get package by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userTenantId = req.user?.tenantId;

    const whereClause = { id };
    if (userTenantId !== null && userTenantId !== undefined && userTenantId !== 0) {
      whereClause.tenant_id = userTenantId;
    }

    const packageItem = await Package.findOne({
      where: whereClause,
      include: [
        {
          model: Tenant,
          as: 'tenant',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!packageItem) {
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }

    res.json({
      success: true,
      data: { package: packageItem }
    });

  } catch (error) {
    console.error('Get package error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch package'
    });
  }
});

// Create new package
router.post('/', async (req, res) => {
  try {
    const userTenantId = req.user?.tenantId;
    const { 
      name, 
      download,
      upload,
      price, 
      traffic,
      sat,
      tenant_id 
    } = req.body;

    // Determine tenant_id
    let packageTenantId = userTenantId;
    if (userTenantId === 0 || userTenantId === null) {
      // Super admin can create packages for any tenant
      if (tenant_id && tenant_id !== 'null') {
        packageTenantId = parseInt(tenant_id);
      }
    }

    if (!packageTenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID is required'
      });
    }

    const packageItem = await Package.create({
      name,
      download,
      upload,
      price: parseInt(price) || 0,
      traffic,
      sat,
      tenant_id: packageTenantId
    });

    res.status(201).json({
      success: true,
      message: 'Package created successfully',
      data: { package: packageItem }
    });

  } catch (error) {
    console.error('Create package error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create package'
    });
  }
});

// Update package
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userTenantId = req.user?.tenantId;
    const updateData = req.body;

    const whereClause = { id };
    if (userTenantId !== null && userTenantId !== undefined && userTenantId !== 0) {
      whereClause.tenant_id = userTenantId;
    }

    const packageItem = await Package.findOne({ where: whereClause });

    if (!packageItem) {
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }

    // Parse numeric fields
    if (updateData.price !== undefined) {
      updateData.price = parseInt(updateData.price) || 0;
    }

    await packageItem.update(updateData);

    res.json({
      success: true,
      message: 'Package updated successfully',
      data: { package: packageItem }
    });

  } catch (error) {
    console.error('Update package error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update package'
    });
  }
});

// Delete package
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userTenantId = req.user?.tenantId;

    const whereClause = { id };
    if (userTenantId !== null && userTenantId !== undefined && userTenantId !== 0) {
      whereClause.tenant_id = userTenantId;
    }

    const packageItem = await Package.findOne({ where: whereClause });

    if (!packageItem) {
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }

    await packageItem.destroy();

    res.json({
      success: true,
      message: 'Package deleted successfully'
    });

  } catch (error) {
    console.error('Delete package error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete package'
    });
  }
});

module.exports = router;
