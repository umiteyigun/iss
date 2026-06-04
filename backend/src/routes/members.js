const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const MemberService = require('../services/MemberService');

function isSuperAdminUser(req) {
  const tenantId = req.user?.tenantId;
  return tenantId === null || tenantId === undefined || tenantId === 0;
}

/** Super admin: tenant from body/query; tenant admin: own tenant. */
function resolveEffectiveTenantId(req, bodyTenantId) {
  if (isSuperAdminUser(req)) {
    const raw = bodyTenantId ?? req.query.tenantId;
    if (raw === null || raw === undefined || raw === '' || raw === 'null') {
      return null;
    }
    const parsed = parseInt(raw, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }
  const own = req.user?.tenantId;
  return own === null || own === undefined ? null : parseInt(own, 10);
}

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all members (with tenant filtering)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    // Super admin (tenant_id = 0 or null) can see all members
    // Regular admin can only see their tenant members
    const tenantId = (req.user?.tenantId === null || req.user?.tenantId === 0) ? req.query.tenantId : req.user?.tenantId;

    const result = await MemberService.getMembers(
      tenantId,
      parseInt(page),
      parseInt(limit),
      search
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in GET /members:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get roles (for role assignment) - MUST be before /:id route
router.get('/roles', async (req, res) => {
  try {
    // Super admin (tenant_id = 0 or null) can see all roles
    // Regular admin can only see their tenant roles
    const tenantId = (req.user?.tenantId === null || req.user?.tenantId === 0) ? (req.query.tenantId ? parseInt(req.query.tenantId) : null) : req.user?.tenantId;

    const result = await MemberService.getRoles(tenantId);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in GET /members/roles:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get available roles for tenant
router.get('/roles/available', async (req, res) => {
  try {
    const tenantId = resolveEffectiveTenantId(req, req.query.tenantId);

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: isSuperAdminUser(req)
          ? 'Tenant selection is required'
          : 'Tenant ID is required'
      });
    }

    const result = await MemberService.getAvailableRoles(tenantId);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in GET /members/roles/available:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get permissions grouped by module
router.get('/permissions/grouped', async (req, res) => {
  try {
    const result = await MemberService.getPermissionsGrouped();

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in GET /members/permissions/grouped:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get single member by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.role === 'super_admin' ? req.query.tenantId : req.user?.tenantId;

    const result = await MemberService.getMemberById(id, tenantId);

    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('Error in GET /members/:id:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Create new member
router.post('/', async (req, res) => {
  try {
    const memberData = req.body;
    const tenantId = resolveEffectiveTenantId(req, memberData.tenant_id);

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: isSuperAdminUser(req)
          ? 'Tenant selection is required'
          : 'Tenant ID is required'
      });
    }

    // Validate required fields
    if (!memberData.username || !memberData.password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Username and password are required' 
      });
    }

    const result = await MemberService.createMember(memberData, tenantId);

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in POST /members:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Update member
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const memberData = req.body;
    // Super admin (tenant_id = 0 or null) can update any member
    // Regular admin can only update their tenant members
    const tenantId = (req.user?.tenantId === null || req.user?.tenantId === 0) ? null : req.user?.tenantId;

    const result = await MemberService.updateMember(id, memberData, tenantId);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in PUT /members/:id:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Delete member
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = isSuperAdminUser(req) ? null : resolveEffectiveTenantId(req, null);

    if (!isSuperAdminUser(req) && !tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant ID is required' });
    }

    const result = await MemberService.deleteMember(id, tenantId);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in DELETE /members/:id:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});


// Create or update role
router.post('/roles', async (req, res) => {
  try {
    const roleData = req.body;
    const tenantId = resolveEffectiveTenantId(req, roleData.tenant_id);

    if (!tenantId && !isSuperAdminUser(req)) {
      return res.status(400).json({ success: false, error: 'Tenant ID is required' });
    }

    const roleTenantId = tenantId || null;

    // Validate required fields
    if (!roleData.name || !roleData.display_name) {
      return res.status(400).json({ 
        success: false, 
        error: 'Role name and display name are required' 
      });
    }

    const result = await MemberService.saveRole(roleData, roleTenantId);

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in POST /members/roles:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Update role
router.put('/roles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const roleData = { ...req.body, id: parseInt(id) };
    const tenantId = resolveEffectiveTenantId(req, roleData.tenant_id);

    if (!tenantId && !isSuperAdminUser(req)) {
      return res.status(400).json({ success: false, error: 'Tenant ID is required' });
    }

    const result = await MemberService.saveRole(roleData, tenantId || null);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in PUT /members/roles/:id:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Delete role
router.delete('/roles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = isSuperAdminUser(req) ? null : resolveEffectiveTenantId(req, null);

    if (!isSuperAdminUser(req) && !tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant ID is required' });
    }

    const result = await MemberService.deleteRole(id, tenantId);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in DELETE /members/roles/:id:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get member permissions
router.get('/:id/permissions', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;

    const result = await MemberService.getMemberPermissions(id, tenantId);

    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('Error in GET /members/:id/permissions:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
