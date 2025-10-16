const express = require('express');
const { Router } = require('../models');

const router = express.Router();

// Get all routers
router.get('/', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const whereClause = tenantId ? { tenant_id: tenantId } : {};

    const { count, rows: routers } = await Router.findAndCountAll({
      where: whereClause,
      include: ['tenant'],
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        routers,
        pagination: {
          total: count,
          page,
          limit,
          pages: Math.ceil(count / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get routers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch routers'
    });
  }
});

// Get router by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;

    const whereClause = { id };
    if (tenantId) {
      whereClause.tenant_id = tenantId;
    }

    const router = await Router.findOne({
      where: whereClause,
      include: ['tenant']
    });

    if (!router) {
      return res.status(404).json({
        success: false,
        message: 'Router not found'
      });
    }

    res.json({
      success: true,
      data: { router }
    });

  } catch (error) {
    console.error('Get router error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch router'
    });
  }
});

// Create new router
router.post('/', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const routerData = {
      ...req.body,
      tenant_id: tenantId
    };

    const router = await Router.create(routerData);

    res.status(201).json({
      success: true,
      message: 'Router created successfully',
      data: { router }
    });

  } catch (error) {
    console.error('Create router error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create router'
    });
  }
});

// Update router
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;

    const whereClause = { id };
    if (tenantId) {
      whereClause.tenant_id = tenantId;
    }

    const router = await Router.findOne({ where: whereClause });

    if (!router) {
      return res.status(404).json({
        success: false,
        message: 'Router not found'
      });
    }

    await router.update(req.body);

    res.json({
      success: true,
      message: 'Router updated successfully',
      data: { router }
    });

  } catch (error) {
    console.error('Update router error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update router'
    });
  }
});

// Delete router
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;

    const whereClause = { id };
    if (tenantId) {
      whereClause.tenant_id = tenantId;
    }

    const router = await Router.findOne({ where: whereClause });

    if (!router) {
      return res.status(404).json({
        success: false,
        message: 'Router not found'
      });
    }

    await router.destroy();

    res.json({
      success: true,
      message: 'Router deleted successfully'
    });

  } catch (error) {
    console.error('Delete router error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete router'
    });
  }
});

// Test router connection
router.post('/:id/test', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;

    const whereClause = { id };
    if (tenantId) {
      whereClause.tenant_id = tenantId;
    }

    const router = await Router.findOne({ where: whereClause });

    if (!router) {
      return res.status(404).json({
        success: false,
        message: 'Router not found'
      });
    }

    // TODO: Implement actual Mikrotik connection test
    // For now, just simulate a test
    const isConnected = Math.random() > 0.3; // 70% success rate for demo

    await router.update({
      status: isConnected ? 'online' : 'offline',
      last_checked: new Date()
    });

    res.json({
      success: true,
      message: isConnected ? 'Router connection successful' : 'Router connection failed',
      data: {
        connected: isConnected,
        status: isConnected ? 'online' : 'offline'
      }
    });

  } catch (error) {
    console.error('Test router error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test router connection'
    });
  }
});

module.exports = router;
