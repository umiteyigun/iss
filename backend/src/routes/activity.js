const express = require('express');
const { Op, fn, col, literal } = require('sequelize');
const { Radacct, Radcheck, Tenant } = require('../models');
const { RADIUS_PASSWORD_ATTR } = require('../constants/radius');
const { authenticateToken } = require('../middleware/auth');
const { requireModulePermission } = require('../middleware/moduleAuth');

const router = express.Router();

// GET /api/activity/recent-sessions
// Returns latest sessions including accepted and rejected (if present), ordered by start/stop time
router.get('/recent-sessions', authenticateToken, requireModulePermission('activity'), async (req, res) => {
  try {
    const userTenantId = req.user?.tenantId;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 25, 200);
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const tenantFilter = req.query.tenant || '';

    const whereClause = {};
    
    // Apply tenant filter using subquery
    if (tenantFilter) {
      if (tenantFilter === 'unassigned') {
        whereClause.username = {
          [Op.in]: literal(`(SELECT username FROM radcheck WHERE attribute = '${RADIUS_PASSWORD_ATTR}' AND (tenant_id IS NULL OR tenant_id = 0))`)
        };
      } else {
        whereClause.username = {
          [Op.in]: literal(`(SELECT username FROM radcheck WHERE attribute = '${RADIUS_PASSWORD_ATTR}' AND tenant_id = ${parseInt(tenantFilter)})`)
        };
      }
    } else if (userTenantId !== 0 && userTenantId !== null) {
      // If no tenant filter specified and user is not super admin, restrict to user's tenant
      whereClause.username = {
        [Op.in]: literal(`(SELECT username FROM radcheck WHERE attribute = '${RADIUS_PASSWORD_ATTR}' AND tenant_id = ${userTenantId})`)
      };
    }
    
    // Apply search filter (combine with tenant filter if both exist)
    if (search) {
      if (tenantFilter || (userTenantId !== 0 && userTenantId !== null)) {
        // If both search and tenant filter exist, we need to combine them
        whereClause[Op.and] = [
          whereClause.username,
          { username: { [Op.like]: `%${search}%` } }
        ];
        delete whereClause.username;
      } else {
        whereClause.username = { [Op.like]: `%${search}%` };
      }
    }

    // Build include clause for tenant information
    const includeClause = [
      {
        model: Radcheck,
        as: 'user',
        attributes: ['tenant_id'],
        required: false,
        where: { attribute: RADIUS_PASSWORD_ATTR },
        include: [
          {
            model: Tenant,
            as: 'tenant',
            attributes: ['name'],
            required: false
          }
        ]
      }
    ];

    const { count, rows } = await Radacct.findAndCountAll({
      where: whereClause,
      include: includeClause,
      order: [
        [literal('COALESCE(acctstoptime, acctstarttime) DESC')]
      ],
      limit,
      offset
    });

    const sessions = rows.map((s) => ({
      radacctid: s.radacctid,
      username: s.username,
      nasipaddress: s.nasipaddress,
      framedipaddress: s.framedipaddress,
      acctstarttime: s.acctstarttime,
      acctstoptime: s.acctstoptime,
      acctsessiontime: s.acctsessiontime,
      acctterminatecause: s.acctterminatecause,
      acctinputoctets: s.acctinputoctets || 0,
      acctoutputoctets: s.acctoutputoctets || 0,
      callingstationid: s.callingstationid,
      calledstationid: s.calledstationid,
      nasportid: s.nasportid,
      nasporttype: s.nasporttype,
      tenant_id: s.user?.tenant_id || null,
      tenant_name: s.user?.tenant?.name || null
    }));

    res.json({
      success: true,
      data: {
        sessions,
        pagination: {
          total: count,
          page,
          limit,
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('recent-sessions error', error);
    res.status(500).json({ success: false, message: 'Failed to fetch recent sessions' });
  }
});

// GET /api/activity/users
// Returns list of users (from radcheck password entries) for convenience
router.get('/users', authenticateToken, requireModulePermission('activity'), async (req, res) => {
  try {
    const userTenantId = req.user?.tenantId;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 25, 200);
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const tenantFilter = req.query.tenant || '';

    const whereClause = { attribute: RADIUS_PASSWORD_ATTR };
    if (search) {
      whereClause.username = { [Op.like]: `%${search}%` };
    }

    // Apply tenant filter
    if (tenantFilter) {
      if (tenantFilter === 'unassigned') {
        whereClause.tenant_id = { [Op.or]: [null, 0] };
      } else {
        whereClause.tenant_id = parseInt(tenantFilter);
      }
    } else if (userTenantId !== 0 && userTenantId !== null) {
      // If no tenant filter specified and user is not super admin, restrict to user's tenant
      whereClause.tenant_id = userTenantId;
    }

    const { count, rows } = await Radcheck.findAndCountAll({
      where: whereClause,
      attributes: ['id', 'username', 'tenant_id', 'regdate'],
      include: [
        {
          model: Tenant,
          as: 'tenant',
          attributes: ['name'],
          required: false
        }
      ],
      order: [['id', 'DESC']],
      limit,
      offset
    });

    res.json({
      success: true,
      data: {
        users: rows,
        pagination: {
          total: count,
          page,
          limit,
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('activity users error', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

// GET /api/activity/tenants - Get all tenants for filter
router.get('/tenants', authenticateToken, requireModulePermission('activity'), async (req, res) => {
  try {
    const userTenantId = req.user?.tenantId;
    
    let tenants;
    if (userTenantId === 0 || userTenantId === null) {
      // Super admin can see all tenants
      tenants = await Tenant.findAll({
        attributes: ['id', 'name'],
        order: [['name', 'ASC']]
      });
    } else {
      // Tenant admin can only see their own tenant
      tenants = await Tenant.findAll({
        where: { id: userTenantId },
        attributes: ['id', 'name'],
        order: [['name', 'ASC']]
      });
    }

    res.json({
      success: true,
      data: { tenants }
    });
  } catch (error) {
    console.error('Get tenants error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tenants' });
  }
});

// GET /api/activity/users/:username/history
// Returns last 10 sessions for a username with traffic totals
router.get('/users/:username/history', authenticateToken, requireModulePermission('activity'), async (req, res) => {
  try {
    const { username } = req.params;
    const userTenantId = req.user?.tenantId;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);

    // Check if user has access to this username's data
    if (userTenantId !== 0 && userTenantId !== null) {
      const userRecord = await Radcheck.findOne({
        where: { 
          username,
          attribute: RADIUS_PASSWORD_ATTR,
          tenant_id: userTenantId
        }
      });
      
      if (!userRecord) {
        return res.status(403).json({ success: false, message: 'Access denied to this user\'s history' });
      }
    }

    const rows = await Radacct.findAll({
      where: { username },
      order: [[literal('COALESCE(acctstoptime, acctstarttime) DESC')]],
      limit
    });

    const history = rows.map((s) => ({
      radacctid: s.radacctid,
      acctstarttime: s.acctstarttime,
      acctstoptime: s.acctstoptime,
      acctsessiontime: s.acctsessiontime,
      framedipaddress: s.framedipaddress,
      nasipaddress: s.nasipaddress,
      acctterminatecause: s.acctterminatecause,
      upload_octets: s.acctinputoctets || 0,
      download_octets: s.acctoutputoctets || 0
    }));

    res.json({ success: true, data: { username, history } });
  } catch (error) {
    console.error('user history error', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user history' });
  }
});

module.exports = router;


