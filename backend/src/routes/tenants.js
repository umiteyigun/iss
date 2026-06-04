const express = require('express');
const { Tenant } = require('../models');
const { authenticateToken, requireSuperAdmin } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

router.use(authenticateToken, requireSuperAdmin);

// Get all tenants with pagination and search
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      status = '',
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    
    // Build where clause
    const whereClause = {};
    
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { subdomain: { [Op.like]: `%${search}%` } },
        { contact_email: { [Op.like]: `%${search}%` } }
      ];
    }
    
    if (status) {
      whereClause.status = status;
    }

    // Get tenants with pagination
    const { count, rows: tenants } = await Tenant.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder.toUpperCase()]],
      attributes: [
        'id',
        'name',
        'subdomain',
        'status',
        'contact_email',
        'contact_phone',
        'max_users',
        'max_nas',
        'created_at',
        'updated_at'
      ]
    });

    // Calculate pagination info
    const totalPages = Math.ceil(count / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      success: true,
      data: {
        tenants,
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
    console.error('Get tenants error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch tenants',
      error: error.message 
    });
  }
});

// Get single tenant by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const tenant = await Tenant.findByPk(id, {
      attributes: [
        'id',
        'name',
        'subdomain',
        'status',
        'radius_secret',
        'description',
        'contact_email',
        'contact_phone',
        'max_users',
        'max_nas',
        'created_at',
        'updated_at'
      ]
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    res.json({
      success: true,
      data: { tenant }
    });

  } catch (error) {
    console.error('Get tenant error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch tenant',
      error: error.message 
    });
  }
});

// Create new tenant
router.post('/', async (req, res) => {
  try {
    const {
      name,
      subdomain,
      status = 'active',
      radius_secret,
      description,
      contact_email,
      contact_phone,
      max_users,
      max_nas
    } = req.body;

    // Validate required fields
    if (!name || !radius_secret) {
      return res.status(400).json({
        success: false,
        message: 'Name and radius_secret are required'
      });
    }

    // Check if subdomain is unique (if provided)
    if (subdomain) {
      const existingTenant = await Tenant.findOne({ where: { subdomain } });
      if (existingTenant) {
        return res.status(400).json({
          success: false,
          message: 'Subdomain already exists'
        });
      }
    }

    const tenant = await Tenant.create({
      name,
      subdomain,
      status,
      radius_secret,
      description,
      contact_email,
      contact_phone,
      max_users: max_users ? parseInt(max_users) : null,
      max_nas: max_nas ? parseInt(max_nas) : null
    });

    res.status(201).json({
      success: true,
      message: 'Tenant created successfully',
      data: { tenant }
    });

  } catch (error) {
    console.error('Create tenant error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create tenant',
      error: error.message 
    });
  }
});

// Update tenant
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const tenant = await Tenant.findByPk(id);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    // Check subdomain uniqueness if being updated
    if (updateData.subdomain && updateData.subdomain !== tenant.subdomain) {
      const existingTenant = await Tenant.findOne({ 
        where: { 
          subdomain: updateData.subdomain,
          id: { [Op.ne]: id }
        } 
      });
      if (existingTenant) {
        return res.status(400).json({
          success: false,
          message: 'Subdomain already exists'
        });
      }
    }

    await tenant.update(updateData);

    res.json({
      success: true,
      message: 'Tenant updated successfully',
      data: { tenant }
    });

  } catch (error) {
    console.error('Update tenant error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update tenant',
      error: error.message 
    });
  }
});

// Delete tenant
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const tenant = await Tenant.findByPk(id);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    await tenant.destroy();

    res.json({
      success: true,
      message: 'Tenant deleted successfully'
    });

  } catch (error) {
    console.error('Delete tenant error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete tenant',
      error: error.message 
    });
  }
});

// Get tenant statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;

    const tenant = await Tenant.findByPk(id);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    // Get basic stats (can be expanded with more detailed statistics)
    const stats = {
      total_users: 0, // Will be implemented when we add user counting
      total_nas: 0,   // Will be implemented when we add NAS counting
      active_sessions: 0, // Will be implemented when we add session counting
      created_at: tenant.created_at,
      last_activity: tenant.updated_at
    };

    res.json({
      success: true,
      data: { stats }
    });

  } catch (error) {
    console.error('Get tenant stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch tenant statistics',
      error: error.message 
    });
  }
});

module.exports = router;