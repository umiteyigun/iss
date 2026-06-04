const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Radippool, MetroIP, Tenant, Radreply, NasDevice } = require('../models');
const MikrotikService = require('../services/MikrotikService');
const {
  METRO_IP_TYPE_BLOCK,
  METRO_IP_TYPE_STATIC,
  METRO_IP_TYPE_ROUTED,
  METRO_IP_TYPE_SHARED,
  METRO_SEMANTIC_FILTERS,
  isPortSegmentedSharedMetro,
  isPanelManagedNatMetro,
  normalizeMetroUserValue,
  matchesMetroSemanticFilter,
  buildMetroIpWhereClause
} = require('../constants/metroIp');
const { normalizeCidr, cidrsOverlap, parseCidr, ipInCidr } = require('../utils/cidr');

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
async function normalizeMetroIpRows(metroIPs) {
  const assignedUsernames = [...new Set(
    metroIPs
      .map((item) => normalizeMetroUserValue(item.user))
      .filter(Boolean)
  )];

  const framedByUser = new Map();
  if (assignedUsernames.length > 0) {
    const framedReplies = await Radreply.findAll({
      where: {
        attribute: 'Framed-IP-Address',
        username: {
          [Op.in]: assignedUsernames
        }
      },
      order: [['id', 'DESC']]
    });

    for (const reply of framedReplies) {
      if (!framedByUser.has(reply.username)) {
        framedByUser.set(reply.username, String(reply.value || '').trim());
      }
    }
  }

  return metroIPs.map((item) => {
    const metro = item.toJSON ? item.toJSON() : item;
    if (Number(metro.ip_type) === METRO_IP_TYPE_BLOCK) {
      const parsed = parseCidr(metro.ipaddress);
      return {
        ...metro,
        binding_type: 'block',
        is_block: true,
        block_host_count: parsed?.hostCount ?? null,
        block_label: metro.notes || normalizeMetroUserValue(metro.user) || 'Interface rezerve'
      };
    }

    if (Number(metro.ip_type) === METRO_IP_TYPE_ROUTED) {
      return {
        ...metro,
        binding_type: 'routed'
      };
    }

    if (Number(metro.ip_type) === METRO_IP_TYPE_SHARED && isPortSegmentedSharedMetro(metro)) {
      return {
        ...metro,
        binding_type: 'assigned',
        is_shared_src_pool: true
      };
    }

    const normalizedUser = normalizeMetroUserValue(metro.user);
    if (!normalizedUser) {
      return {
        ...metro,
        binding_type: 'assigned'
      };
    }

    const framedIp = framedByUser.get(normalizedUser);
    if (framedIp && String(metro.ipaddress || '').trim() === framedIp) {
      return {
        ...metro,
        binding_type: 'assigned'
      };
    }

    return {
      ...metro,
      binding_type: 'routed'
    };
  });
}

async function enrichMetroIpList(normalizedMetroIps, userTenantId, requestedTenantId, routerNatSync) {
  if (!routerNatSync) {
    return normalizedMetroIps;
  }

  const nasWhere = {};
  if (userTenantId !== null && userTenantId !== undefined && userTenantId !== 0) {
    nasWhere.tenant_id = userTenantId;
  } else if (requestedTenantId !== null) {
    nasWhere.tenant_id = requestedTenantId;
  }

  try {
    const nasDevices = await NasDevice.findAll({ where: nasWhere });
    return await enrichMetroIpsFromRouterNat(normalizedMetroIps, nasDevices);
  } catch (enrichError) {
    console.warn('Router NAT enrich failed:', enrichError.message);
    return normalizedMetroIps;
  }
}

router.get('/metroips', async (req, res) => {
  try {
    const userTenantId = req.user?.tenantId;
    const requestedTenantId = req.query.tenantId && req.query.tenantId !== 'null' ? parseInt(req.query.tenantId) : null;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(500, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const search = req.query.search;
    const metroIpFilter = req.query.metroIpFilter;
    const ipAddressFilter = req.query.ipAddressFilter;
    const nasNameFilter = req.query.nasNameFilter;
    const offset = (page - 1) * limit;
    const routerNatSync = req.query.routerNatSync !== 'false';
    const useSemanticFilter = metroIpFilter && METRO_SEMANTIC_FILTERS.includes(metroIpFilter);

    const whereClause = buildMetroIpWhereClause({
      userTenantId,
      requestedTenantId,
      search,
      metroIpFilter,
      ipAddressFilter,
      nasNameFilter
    });

    let responseMetroIps;
    let totalCount;

    if (useSemanticFilter) {
      const allRows = await MetroIP.findAll({
        where: whereClause,
        order: [['id', 'DESC']]
      });
      let normalized = await normalizeMetroIpRows(allRows);
      normalized = await enrichMetroIpList(
        normalized,
        userTenantId,
        requestedTenantId,
        routerNatSync
      );
      const filtered = normalized.filter((metro) => matchesMetroSemanticFilter(metro, metroIpFilter));
      totalCount = filtered.length;
      responseMetroIps = filtered.slice(offset, offset + limit);
    } else {
      const { count, rows: metroIPs } = await MetroIP.findAndCountAll({
        where: whereClause,
        limit,
        offset,
        order: [['id', 'DESC']]
      });
      let normalized = await normalizeMetroIpRows(metroIPs);
      responseMetroIps = await enrichMetroIpList(
        normalized,
        userTenantId,
        requestedTenantId,
        routerNatSync
      );
      totalCount = count;
    }

    const totalPages = totalCount > 0 ? Math.ceil(totalCount / limit) : 0;
    const safePage = totalPages > 0 ? Math.min(page, totalPages) : 1;

    res.json({
      success: true,
      data: {
        metroips: responseMetroIps,
        pagination: {
          total: totalCount,
          page: safePage,
          limit,
          pages: totalPages
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

// Create Metro IP (single host, expanded range, or block reserve)
router.post('/metroips', async (req, res) => {
  try {
    const userTenantId = req.user?.tenantId;
    const {
      nasname,
      ipaddress,
      ports,
      user,
      tenant_id,
      ip_type,
      lan_ip,
      notes,
      add_mode,
      reserve_label
    } = req.body;

    let metroTenantId = userTenantId;
    if (userTenantId === 0 || userTenantId === null) {
      if (tenant_id && tenant_id !== 'null') {
        metroTenantId = parseInt(tenant_id, 10);
      }
    }

    const isBlockReserve =
      add_mode === 'block_reserve' || parseInt(ip_type, 10) === METRO_IP_TYPE_BLOCK;

    if (isBlockReserve) {
      const cidr = normalizeCidr(ipaddress);
      if (!cidr) {
        return res.status(400).json({
          success: false,
          message: 'Invalid CIDR. Use format e.g. 212.15.1.160/27'
        });
      }

      const noteText = String(notes || reserve_label || '').trim()
        || 'WAN interface rezerve (abone hesabina bagli degil)';

      const existingBlocks = await MetroIP.findAll({
        where: { tenant_id: metroTenantId, ip_type: METRO_IP_TYPE_BLOCK }
      });
      for (const row of existingBlocks) {
        if (cidrsOverlap(cidr, row.ipaddress)) {
          return res.status(409).json({
            success: false,
            message: `CIDR overlaps existing block ${row.ipaddress}`
          });
        }
      }

      const metroIP = await MetroIP.create({
        nasname: nasname || null,
        ipaddress: cidr,
        ports: null,
        user: null,
        tenant_id: metroTenantId,
        ip_type: METRO_IP_TYPE_BLOCK,
        lan_ip: lan_ip || null,
        notes: noteText
      });

      const parsed = parseCidr(cidr);
      return res.json({
        success: true,
        message: 'Metro IP block reserved (single row, note only, no MikroTik)',
        data: {
          ...metroIP.toJSON(),
          is_block: true,
          block_host_count: parsed?.hostCount ?? null,
          block_label: noteText
        }
      });
    }

    const metroIP = await MetroIP.create({
      nasname,
      ipaddress,
      ports,
      user,
      tenant_id: metroTenantId,
      ip_type: ip_type || 0,
      lan_ip: lan_ip || null,
      notes: notes || null
    });

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

// Bulk create Metro IPs (expanded static/shared rows)
router.post('/metroips/bulk', async (req, res) => {
  try {
    const userTenantId = req.user?.tenantId;
    const { items, tenant_id } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'items array is required'
      });
    }

    let metroTenantId = userTenantId;
    if (userTenantId === 0 || userTenantId === null) {
      if (tenant_id && tenant_id !== 'null') {
        metroTenantId = parseInt(tenant_id, 10);
      }
    }

    const created = [];
    for (const item of items) {
      if (parseInt(item.ip_type, 10) === METRO_IP_TYPE_BLOCK) {
        continue;
      }
      const row = await MetroIP.create({
        nasname: item.nasname,
        ipaddress: item.ipaddress,
        ports: item.ports || null,
        user: item.user || null,
        tenant_id: metroTenantId,
        ip_type: item.ip_type || 0,
        lan_ip: item.lan_ip || null,
        notes: item.notes || null
      });
      created.push(row);
    }

    res.json({
      success: true,
      message: `Created ${created.length} Metro IP row(s)`,
      data: { count: created.length, items: created }
    });
  } catch (error) {
    console.error('Bulk create Metro IP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk create Metro IPs'
    });
  }
});

// Assignable static Metro IPs for user add/edit picker (empty only; no NAT/routed/primary-of-others)
router.get('/metroips/assignable-static', async (req, res) => {
  try {
    const userTenantId = req.user?.tenantId;
    const requestedTenantId =
      req.query.tenantId && req.query.tenantId !== 'null'
        ? parseInt(req.query.tenantId, 10)
        : null;
    const username = String(req.query.username || '').trim();
    const currentIp = normalizeIpAddress(String(req.query.currentIp || '').trim());
    const pickerMode = String(req.query.pickerMode || 'primary').toLowerCase();

    const tenantWhere = {};
    if (userTenantId !== null && userTenantId !== undefined && userTenantId !== 0) {
      tenantWhere.tenant_id = userTenantId;
    } else if (requestedTenantId !== null && !Number.isNaN(requestedTenantId)) {
      tenantWhere.tenant_id = requestedTenantId;
    }

    const framedWhere = { attribute: 'Framed-IP-Address' };
    if (username) {
      framedWhere.username = { [Op.ne]: username };
    }
    const framedRows = await Radreply.findAll({
      where: framedWhere,
      attributes: ['value', 'username']
    });
    const primaryIpsUsed = new Set();
    for (const row of framedRows) {
      const ip = normalizeIpAddress(row.value);
      if (ip) {
        primaryIpsUsed.add(ip);
      }
    }

    const blocks = await MetroIP.findAll({
      where: { ...tenantWhere, ip_type: METRO_IP_TYPE_BLOCK }
    });

    const metroRows = await MetroIP.findAll({
      where: {
        ...tenantWhere,
        ip_type: METRO_IP_TYPE_STATIC,
        nat_in_use: { [Op.not]: true },
        binding_type: { [Op.ne]: 'routed' },
        [Op.or]: [
          { user: { [Op.is]: null } },
          { user: '' },
          { user: '-' },
          { user: 'null' }
        ]
      },
      order: [
        ['nasname', 'ASC'],
        ['ipaddress', 'ASC']
      ]
    });

    const assignable = [];
    for (const row of metroRows) {
      const metro = row.toJSON();
      const hostIp = normalizeIpAddress(metro.ipaddress);
      if (!hostIp) {
        continue;
      }
      if (isPortSegmentedSharedMetro(metro)) {
        continue;
      }
      const ports = String(metro.ports || '').trim();
      if (pickerMode === 'extra') {
        if (ports && ports !== '-') {
          continue;
        }
      }
      if (primaryIpsUsed.has(hostIp)) {
        continue;
      }
      if (blocks.some((block) => ipInCidr(hostIp, block.ipaddress))) {
        continue;
      }

      assignable.push({
        value: hostIp,
        display: `${hostIp} — ${metro.nasname || '-'}`,
        type: 'Static',
        ip: hostIp,
        nas: metro.nasname,
        ports: metro.ports || ''
      });
    }

    if (currentIp && !assignable.some((item) => item.value === currentIp)) {
      const currentRow = await MetroIP.findOne({
        where: {
          ...tenantWhere,
          ipaddress: { [Op.like]: `${currentIp}%` }
        }
      });
      assignable.unshift({
        value: currentIp,
        display: `${currentIp} (Current)`,
        type: 'Static',
        ip: currentIp,
        nas: currentRow?.nasname || '',
        ports: currentRow?.ports || ''
      });
    }

    return res.json({
      success: true,
      data: { metroips: assignable }
    });
  } catch (error) {
    console.error('Assignable static metro IPs error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to list assignable static Metro IPs'
    });
  }
});

// Check if host IP falls inside a reserved Metro block
router.get('/metroips/check-host', async (req, res) => {
  try {
    const userTenantId = req.user?.tenantId;
    const requestedTenantId =
      req.query.tenantId && req.query.tenantId !== 'null'
        ? parseInt(req.query.tenantId, 10)
        : null;
    const host = String(req.query.ip || '').trim();

    if (!host) {
      return res.status(400).json({ success: false, message: 'ip query required' });
    }

    const where = { ip_type: METRO_IP_TYPE_BLOCK };
    if (userTenantId !== null && userTenantId !== undefined && userTenantId !== 0) {
      where.tenant_id = userTenantId;
    } else if (requestedTenantId !== null) {
      where.tenant_id = requestedTenantId;
    }

    const blocks = await MetroIP.findAll({ where });
    const hit = blocks.find((b) => ipInCidr(host, b.ipaddress));

    res.json({
      success: true,
      data: {
        reserved: Boolean(hit),
        block: hit
          ? {
              id: hit.id,
              ipaddress: hit.ipaddress,
              label: hit.user,
              notes: hit.notes
            }
          : null
      }
    });
  } catch (error) {
    console.error('Metro IP check-host error:', error);
    res.status(500).json({ success: false, message: 'Failed to check IP against blocks' });
  }
});

const NAT_SERVICE_RULE_MAP = {
  http: [{ protocol: 'tcp', port: '80' }],
  https: [{ protocol: 'tcp', port: '443' }],
  ssh: [{ protocol: 'tcp', port: '22' }],
  rdp: [{ protocol: 'tcp', port: '3389' }],
  winbox: [{ protocol: 'tcp', port: '8291' }],
  dns: [{ protocol: 'tcp', port: '53' }, { protocol: 'udp', port: '53' }],
  smtp: [{ protocol: 'tcp', port: '25' }],
  smtps: [{ protocol: 'tcp', port: '465' }],
  submission: [{ protocol: 'tcp', port: '587' }],
  pop3: [{ protocol: 'tcp', port: '110' }],
  imap: [{ protocol: 'tcp', port: '143' }],
  imaps: [{ protocol: 'tcp', port: '993' }],
  ftp: [{ protocol: 'tcp', port: '21' }]
};

function normalizeIpAddress(value) {
  return String(value || '').split('/')[0].trim();
}

function getNatRuleField(rule, ...keys) {
  for (const key of keys) {
    const value = rule?.[key];
    if (value !== undefined && value !== null && value !== '' && value !== 'N/A') {
      return value;
    }
  }
  return '';
}

function buildServicePortIndex() {
  const index = new Map();
  Object.entries(NAT_SERVICE_RULE_MAP).forEach(([serviceKey, rules]) => {
    rules.forEach((rule) => {
      index.set(`${rule.protocol}:${rule.port}`, serviceKey);
    });
  });
  return index;
}

function ruleCommentMatchesMetroIp(rule, wanIp) {
  const comment = String(rule.comment || '');
  return comment.includes(`metro-ip=${wanIp}`);
}

function sanitizeNoteForComment(note) {
  return String(note || '').trim().replace(/;/g, ',');
}

function extractCommentMeta(comment) {
  const text = String(comment || '');
  const pick = (key) => {
    const match = text.match(new RegExp(`${key}=([^\\s]+)`));
    return match ? match[1] : '';
  };
  return {
    username: pick('username'),
    natLocalIp: pick('nat-local'),
    ruleType: pick('type'),
    protocol: pick('protocol'),
    port: pick('port')
  };
}

function buildNatCommentPrefix(metroIp, username, natLocalIp) {
  const wanIp = normalizeIpAddress(metroIp.ipaddress);
  const parts = [
    `username=${username}`,
    `metro-ip=${wanIp}`,
    `nat-local=${natLocalIp}`
  ];
  const note = sanitizeNoteForComment(metroIp.notes);
  if (note) {
    parts.push(`note=${note}`);
  }
  return parts.join(' ');
}

function buildRouteCommentForMetro(metroIp, username) {
  const wanIp = normalizeIpAddress(metroIp.ipaddress);
  const parts = [
    `username=${username}`,
    `routed-ip=${metroIp.ipaddress}`,
    `metro-ip=${wanIp}`
  ];
  const note = sanitizeNoteForComment(metroIp.notes);
  if (note) {
    parts.push(`note=${note}`);
  }
  return parts.join(' ');
}

function buildNatRuleCommentFromExisting(metroIp, rule, existingComment) {
  const meta = extractCommentMeta(existingComment);
  const chain = String(rule.chain || '').toLowerCase();
  const isSrc = chain === 'srcnat';
  const wanIp = normalizeIpAddress(metroIp.ipaddress);
  const natLocalIp = meta.natLocalIp
    || (isSrc
      ? normalizeIpAddress(getNatRuleField(rule, 'src-address', 'srcAddress'))
      : normalizeIpAddress(getNatRuleField(rule, 'to-addresses', 'toAddresses')))
    || metroIp.lan_ip
    || metroIp.nat_local_ip
    || '';

  const parts = [
    `username=${meta.username || metroIp.user || 'manual'}`,
    `metro-ip=${wanIp}`
  ];

  if (natLocalIp) {
    parts.push(`nat-local=${natLocalIp}`);
  }

  const note = sanitizeNoteForComment(metroIp.notes);
  if (note) {
    parts.push(`note=${note}`);
  }

  const ruleType = meta.ruleType || (isSrc ? 'srcnat' : 'dstnat');
  parts.push(`type=${ruleType}`);

  if (meta.protocol && meta.protocol !== 'all-services') {
    parts.push(`protocol=${meta.protocol}`);
  }
  if (meta.port) {
    parts.push(`port=${meta.port}`);
  }

  return parts.join(' ');
}

function natRuleRelatesToMetroIp(rule, wanIp) {
  return isMetroDstNatRule(rule, wanIp)
    || isMetroSrcNatRule(rule, wanIp)
    || ruleCommentMatchesMetroIp(rule, wanIp);
}

async function findRouterForMetroIp(metroIp) {
  if (!metroIp?.nasname) {
    return null;
  }
  return NasDevice.findOne({
    where: {
      [Op.or]: [
        { shortname: metroIp.nasname },
        { nasname: metroIp.nasname }
      ]
    }
  });
}

async function syncMetroIpNotesToRouter(metroIp, router = null) {
  const resolvedRouter = router || await findRouterForMetroIp(metroIp);
  if (!resolvedRouter) {
    return { updatedNat: 0, updatedRoutes: 0, skipped: true };
  }

  const mikrotikHost = resolvedRouter.server || resolvedRouter.nasname;
  const mikrotikUser = resolvedRouter.ruser || resolvedRouter.username;
  const mikrotikPass = resolvedRouter.naspassword || resolvedRouter.password;

  if (!mikrotikHost || !mikrotikUser || !mikrotikPass) {
    return { updatedNat: 0, updatedRoutes: 0, skipped: true };
  }

  const wanIp = normalizeIpAddress(metroIp.ipaddress);
  const routeDestination = metroIp.ipaddress.includes('/')
    ? metroIp.ipaddress
    : `${metroIp.ipaddress}/32`;

  let updatedNat = 0;
  let updatedRoutes = 0;

  const natResult = await MikrotikService.getNatRules(mikrotikHost, mikrotikUser, mikrotikPass);
  if (natResult?.success) {
    const natRules = natResult.data?.nat_rules || natResult.data?.rules || [];
    for (const rule of natRules) {
      if (!natRuleRelatesToMetroIp(rule, wanIp)) {
        continue;
      }
      const ruleId = rule.id || rule['.id'];
      if (!ruleId) {
        continue;
      }
      const newComment = buildNatRuleCommentFromExisting(metroIp, rule, rule.comment);
      const setResult = await MikrotikService.setNatRuleComment(
        mikrotikHost,
        mikrotikUser,
        mikrotikPass,
        ruleId,
        newComment
      );
      if (setResult?.success) {
        updatedNat += 1;
      }
    }
  }

  const routesResult = await MikrotikService.getRoutes(mikrotikHost, mikrotikUser, mikrotikPass);
  if (routesResult?.success) {
    const routes = routesResult.data?.routes || [];
    for (const route of routes) {
      const dst = String(route.dstAddress || route['dst-address'] || '').trim();
      const comment = String(route.comment || '');
      const relates = dst === routeDestination
        || comment.includes(`metro-ip=${wanIp}`)
        || comment.includes(`routed-ip=${metroIp.ipaddress}`);

      if (!relates) {
        continue;
      }

      const meta = extractCommentMeta(comment);
      const routeId = route.id || route['.id'];
      if (!routeId) {
        continue;
      }

      const newComment = buildRouteCommentForMetro(metroIp, meta.username || metroIp.user || 'manual');
      const setResult = await MikrotikService.updateRoute(
        mikrotikHost,
        mikrotikUser,
        mikrotikPass,
        routeId,
        { comment: newComment }
      );
      if (setResult?.success) {
        updatedRoutes += 1;
      }
    }
  }

  return { updatedNat, updatedRoutes, skipped: false };
}

function isSrcNatFullRule(rule) {
  const dst = getNatRuleField(rule, 'dst-address', 'dstAddress');
  const dstPort = getNatRuleField(rule, 'dst-port', 'dstPort');
  const protocol = getNatRuleField(rule, 'protocol');
  const srcPort = getNatRuleField(rule, 'src-port', 'srcPort');
  return !dst && !dstPort && !protocol && !srcPort;
}

function isMetroDstNatRule(rule, wanIp) {
  const dst = normalizeIpAddress(getNatRuleField(rule, 'dst-address', 'dstAddress'));
  const chain = String(rule.chain || '').toLowerCase();
  const action = String(rule.action || '').toLowerCase();
  return chain === 'dstnat' && action === 'dst-nat' && dst === wanIp;
}

function isMetroSrcNatRule(rule, wanIp) {
  const toAddress = normalizeIpAddress(getNatRuleField(rule, 'to-addresses', 'toAddresses'));
  const chain = String(rule.chain || '').toLowerCase();
  const action = String(rule.action || '').toLowerCase();
  const isSrcAction = action === 'src-nat' || action === 'masquerade';
  return chain === 'srcnat' && isSrcAction && toAddress === wanIp;
}

function analyzeMetroIpNatRules(rules, publicIp) {
  const wanIp = normalizeIpAddress(publicIp);
  const allRules = rules || [];

  const dstRules = allRules.filter((rule) => isMetroDstNatRule(rule, wanIp) || (
    ruleCommentMatchesMetroIp(rule, wanIp) && String(rule.chain || '').toLowerCase() === 'dstnat'
  ));
  const srcRules = allRules.filter((rule) => isMetroSrcNatRule(rule, wanIp) || (
    ruleCommentMatchesMetroIp(rule, wanIp) && String(rule.chain || '').toLowerCase() === 'srcnat'
  ));

  const hasDstNat = dstRules.length > 0;
  const hasSrcNat = srcRules.length > 0;
  const srcNatFull = hasSrcNat && srcRules.some((rule) => isSrcNatFullRule(rule));
  const detectedNatType = hasSrcNat && hasDstNat ? 'both' : hasSrcNat ? 'src' : hasDstNat ? 'dst' : 'dst';

  const localIps = [...new Set([
    ...dstRules.map((rule) => normalizeIpAddress(getNatRuleField(rule, 'to-addresses', 'toAddresses'))),
    ...srcRules.map((rule) => normalizeIpAddress(getNatRuleField(rule, 'src-address', 'srcAddress')))
  ].filter(Boolean))];

  const emptyResult = {
    hasExisting: false,
    hasSrcNat: false,
    hasDstNat: false,
    srcNatFull: false,
    natLocalIp: '',
    natType: 'both',
    dstNatServiceMode: 'none',
    selectedServices: [],
    customNatRules: [],
    existingRuleCount: 0,
    srcRuleCount: 0,
    dstRuleCount: 0,
    existingPorts: [],
    summary: ''
  };

  if (!hasDstNat && !hasSrcNat) {
    return emptyResult;
  }

  const portRules = dstRules
    .map((rule) => {
      const port = String(getNatRuleField(rule, 'dst-port', 'dstPort') || '').trim();
      if (!port) {
        return null;
      }
      return {
        protocol: String(getNatRuleField(rule, 'protocol') || 'tcp').toLowerCase(),
        port
      };
    })
    .filter(Boolean);

  const buildSummary = (natType, dstMode, ports) => {
    const parts = [];
    if (hasSrcNat) {
      parts.push(srcNatFull ? 'SRC Full' : 'SRC NAT');
    }
    if (hasDstNat) {
      if (dstMode === 'all') {
        parts.push('DST Full');
      } else if (ports.length > 0) {
        parts.push(`DST (${ports.join(', ')})`);
      } else {
        parts.push('DST NAT');
      }
    }
    const local = localIps[0] ? ` → ${localIps[0]}` : '';
    return `${parts.join(' + ')}${local}`;
  };

  if (!hasDstNat && hasSrcNat) {
    return {
      hasExisting: true,
      hasSrcNat: true,
      hasDstNat: false,
      srcNatFull,
      natLocalIp: localIps[0] || '',
      natType: 'src',
      dstNatServiceMode: 'none',
      selectedServices: [],
      customNatRules: [],
      existingRuleCount: srcRules.length,
      srcRuleCount: srcRules.length,
      dstRuleCount: 0,
      existingPorts: [],
      summary: buildSummary('src', 'none', [])
    };
  }

  if (portRules.length === 0) {
    const dstMode = hasDstNat ? 'all' : 'none';
    return {
      hasExisting: true,
      hasSrcNat,
      hasDstNat,
      srcNatFull,
      natLocalIp: localIps[0] || '',
      natType: detectedNatType,
      dstNatServiceMode: dstMode,
      selectedServices: [],
      customNatRules: [],
      existingRuleCount: dstRules.length + srcRules.length,
      srcRuleCount: srcRules.length,
      dstRuleCount: dstRules.length,
      existingPorts: [],
      summary: buildSummary(detectedNatType, dstMode, [])
    };
  }

  const servicePortIndex = buildServicePortIndex();
  const selectedServices = new Set();
  const customNatRules = [];

  portRules.forEach((portRule) => {
    const serviceKey = servicePortIndex.get(`${portRule.protocol}:${portRule.port}`);
    if (serviceKey) {
      selectedServices.add(serviceKey);
    } else {
      customNatRules.push({
        protocol: portRule.protocol,
        port: portRule.port
      });
    }
  });

  const existingPorts = portRules.map((rule) => `${rule.protocol}/${rule.port}`);
  const dstMode = customNatRules.length > 0 ? 'custom' : 'selected';

  return {
    hasExisting: true,
    hasSrcNat,
    hasDstNat,
    srcNatFull,
    natLocalIp: localIps[0] || '',
    natType: detectedNatType,
    dstNatServiceMode: dstMode,
    selectedServices: [...selectedServices],
    customNatRules: dstMode === 'custom'
      ? portRules.map((rule) => ({ protocol: rule.protocol, port: rule.port }))
      : [],
    existingRuleCount: dstRules.length + srcRules.length,
    srcRuleCount: srcRules.length,
    dstRuleCount: dstRules.length,
    existingPorts,
    summary: buildSummary(detectedNatType, dstMode, existingPorts)
  };
}

function parseExistingNatRules(rules, publicIp) {
  return analyzeMetroIpNatRules(rules, publicIp);
}

async function enrichMetroIpsFromRouterNat(metroIPs, nasDevices) {
  const nasByKey = new Map();
  (nasDevices || []).forEach((nas) => {
    if (nas.shortname) {
      nasByKey.set(String(nas.shortname).trim(), nas);
    }
    if (nas.nasname) {
      nasByKey.set(String(nas.nasname).trim(), nas);
    }
  });

  const rulesCache = new Map();
  const enriched = [];

  for (const metro of metroIPs) {
    if (Number(metro.ip_type) === METRO_IP_TYPE_BLOCK) {
      enriched.push(metro);
      continue;
    }
    if (isPortSegmentedSharedMetro(metro)) {
      enriched.push({
        ...metro,
        nat_in_use: false,
        is_shared_src_pool: true
      });
      continue;
    }
    const nas = nasByKey.get(String(metro.nasname || '').trim());
    if (!nas) {
      enriched.push(metro);
      continue;
    }

    const mikrotikHost = nas.server || nas.nasname;
    const mikrotikUser = nas.ruser || nas.username;
    const mikrotikPass = nas.naspassword || nas.password;
    if (!mikrotikHost || !mikrotikUser || !mikrotikPass) {
      enriched.push(metro);
      continue;
    }

    if (!rulesCache.has(mikrotikHost)) {
      const natResult = await MikrotikService.getNatRules(mikrotikHost, mikrotikUser, mikrotikPass);
      rulesCache.set(
        mikrotikHost,
        natResult?.success ? (natResult.data?.rules || natResult.data?.nat_rules || []) : null
      );
    }

    const rules = rulesCache.get(mikrotikHost);
    if (!rules) {
      enriched.push(metro);
      continue;
    }

    const analysis = analyzeMetroIpNatRules(rules, metro.ipaddress);
    const natPayload = {
      ...metro,
      nat_in_use: analysis.hasExisting,
      nat_local_ip: analysis.natLocalIp || metro.nat_local_ip || null,
      nat_type: analysis.natType,
      nat_src_full: analysis.srcNatFull,
      nat_has_src: analysis.hasSrcNat,
      nat_has_dst: analysis.hasDstNat,
      nat_dst_ports: analysis.existingPorts,
      nat_summary: analysis.summary
    };
    if (!isPanelManagedNatMetro(natPayload)) {
      natPayload.nat_in_use = false;
    }
    enriched.push(natPayload);
  }

  return enriched;
}

async function removeExistingNatForMetroIp(router, publicIp) {
  const wanIp = normalizeIpAddress(publicIp);

  const removed = await MikrotikService.deleteNatRulesWhere(router, (rule) => {
    if (ruleCommentMatchesMetroIp(rule, wanIp)) {
      return true;
    }
    const dst = normalizeIpAddress(rule['dst-address']);
    const toAddress = normalizeIpAddress(rule['to-addresses']);
    if (rule.chain === 'dstnat' && dst === wanIp) {
      return true;
    }
    return rule.chain === 'srcnat' && toAddress === wanIp;
  });

  return {
    deleted: removed?.deleted || 0
  };
}

async function applyMetroIpNatRules(router, metroIp, username, natConfig) {
  const normalizedNatLocalIp = String(natConfig.natLocalIp || '').trim();
  const normalizedNatType = ['src', 'dst', 'both'].includes(String(natConfig.natType))
    ? String(natConfig.natType)
    : 'both';
  const normalizedServiceMode = ['all', 'selected', 'custom', 'none'].includes(String(natConfig.dstNatServiceMode))
    ? String(natConfig.dstNatServiceMode)
    : 'none';
  const selectedServices = Array.isArray(natConfig.selectedServices) ? natConfig.selectedServices : [];
  const customNatRules = Array.isArray(natConfig.customNatRules) ? natConfig.customNatRules : [];

  if (!normalizedNatLocalIp) {
    return {
      success: false,
      message: 'natLocalIp is required'
    };
  }

  const routedPublicIp = normalizeIpAddress(metroIp.ipaddress);
  const natCommentPrefix = buildNatCommentPrefix(metroIp, username, normalizedNatLocalIp);
  const shouldCreateSrcNat = normalizedNatType === 'src' || normalizedNatType === 'both';
  const shouldCreateDstNat = (normalizedNatType === 'dst' || normalizedNatType === 'both')
    && normalizedServiceMode !== 'none';
  const replaceExisting = natConfig.replaceExisting !== false;
  const createdNatRules = [];
  let removedExisting = 0;

  if (replaceExisting) {
    const removeResult = await removeExistingNatForMetroIp(router, routedPublicIp);
    removedExisting = removeResult.deleted;
  }

  if (shouldCreateSrcNat) {
    const srcNatRule = {
      chain: 'srcnat',
      action: 'src-nat',
      'src-address': normalizedNatLocalIp,
      'to-addresses': routedPublicIp,
      comment: `${natCommentPrefix} type=srcnat`
    };
    const srcResult = await MikrotikService.addNatRuleTop(router, srcNatRule);
    if (!srcResult?.success) {
      return {
        success: false,
        message: srcResult?.message || 'Failed to create srcnat rule'
      };
    }
    createdNatRules.push({
      type: 'srcnat',
      ruleId: srcResult.id || null
    });
  }

  if (shouldCreateDstNat) {
    let dstRulesToCreate = [];
    if (normalizedServiceMode === 'all') {
      dstRulesToCreate = [{ protocol: null, port: null }];
    } else if (normalizedServiceMode === 'none') {
      dstRulesToCreate = [];
    } else if (normalizedServiceMode === 'selected') {
      dstRulesToCreate = selectedServices
        .flatMap(service => NAT_SERVICE_RULE_MAP[String(service)] || [])
        .filter(rule => rule.port && rule.protocol);
      if (dstRulesToCreate.length === 0) {
        return {
          success: false,
          message: 'At least one predefined service must be selected for selected mode'
        };
      }
    } else {
      dstRulesToCreate = customNatRules
        .map(rule => ({
          protocol: String(rule?.protocol || '').toLowerCase(),
          port: String(rule?.port || '').trim()
        }))
        .filter(rule => ['tcp', 'udp'].includes(rule.protocol) && rule.port !== '');
      if (dstRulesToCreate.length === 0) {
        return {
          success: false,
          message: 'At least one custom NAT rule is required for custom mode'
        };
      }
    }

    const existingNatResult = await MikrotikService.getNatRules(
      router.server || router.nasname,
      router.ruser || router.username,
      router.naspassword || router.password
    );
    const existingRules = existingNatResult?.data?.rules || existingNatResult?.data?.nat_rules || [];

    for (const rule of dstRulesToCreate) {
      const duplicateExists = existingRules.some((existingRule) => {
        const dst = normalizeIpAddress(getNatRuleField(existingRule, 'dst-address', 'dstAddress'));
        const toAddr = normalizeIpAddress(getNatRuleField(existingRule, 'to-addresses', 'toAddresses'));
        const action = String(existingRule.action || '').toLowerCase();
        const chain = String(existingRule.chain || '').toLowerCase();
        const protocol = String(getNatRuleField(existingRule, 'protocol') || '').toLowerCase();
        const dstPort = String(getNatRuleField(existingRule, 'dst-port', 'dstPort') || '');
        const matchesPort = rule.port ? dstPort === String(rule.port) : dstPort === '';
        const matchesProtocol = rule.protocol ? protocol === String(rule.protocol).toLowerCase() : true;
        return chain === 'dstnat'
          && action === 'dst-nat'
          && dst === routedPublicIp
          && toAddr === normalizedNatLocalIp
          && matchesProtocol
          && matchesPort;
      });

      if (duplicateExists) {
        createdNatRules.push({
          type: 'dstnat',
          protocol: rule.protocol || 'all',
          port: rule.port || 'all',
          skipped: true
        });
        continue;
      }

      const dstNatRule = {
        chain: 'dstnat',
        action: 'dst-nat',
        'dst-address': routedPublicIp,
        'to-addresses': normalizedNatLocalIp,
        comment: `${natCommentPrefix} type=dstnat ${rule.protocol ? `protocol=${rule.protocol}` : 'all-services'} ${rule.port ? `port=${rule.port}` : ''}`.trim()
      };

      if (rule.protocol) {
        dstNatRule.protocol = rule.protocol;
      }
      if (rule.port) {
        dstNatRule['dst-port'] = rule.port;
        dstNatRule['to-ports'] = rule.port;
      }

      const dstResult = await MikrotikService.addNatRuleTop(router, dstNatRule);
      if (!dstResult?.success) {
        return {
          success: false,
          message: dstResult?.message || 'Failed to create dstnat rule'
        };
      }
      createdNatRules.push({
        type: 'dstnat',
        protocol: rule.protocol || 'all',
        port: rule.port || 'all',
        ruleId: dstResult.id || null
      });
    }
  }

  return {
    success: true,
    createdNatRules,
    removedExisting,
    localIp: normalizedNatLocalIp,
    natType: normalizedNatType,
    serviceMode: normalizedServiceMode
  };
}

// Read existing NAT config for a metro IP on selected router
router.get('/metroips/:id/nat', async (req, res) => {
  try {
    const metroIpId = parseInt(req.params.id);
    const routerId = parseInt(req.query.routerId);

    if (!metroIpId || !routerId) {
      return res.status(400).json({
        success: false,
        message: 'metroIp id and routerId are required'
      });
    }

    const metroIp = await MetroIP.findByPk(metroIpId);
    if (!metroIp) {
      return res.status(404).json({
        success: false,
        message: 'Metro IP not found'
      });
    }

    const router = await NasDevice.findByPk(routerId);
    if (!router) {
      return res.status(404).json({
        success: false,
        message: 'Router not found'
      });
    }

    const mikrotikHost = router.server || router.nasname;
    const mikrotikUser = router.ruser || router.username;
    const mikrotikPass = router.naspassword || router.password;

    if (!mikrotikHost || !mikrotikUser || !mikrotikPass) {
      return res.status(400).json({
        success: false,
        message: 'Selected router is missing Mikrotik credentials'
      });
    }

    const natResult = await MikrotikService.getNatRules(mikrotikHost, mikrotikUser, mikrotikPass);
    if (!natResult?.success) {
      return res.status(400).json({
        success: false,
        message: natResult?.message || 'Failed to read NAT rules from router'
      });
    }

    const rules = natResult.data?.rules || natResult.data?.nat_rules || [];
    const parsed = parseExistingNatRules(rules, metroIp.ipaddress);

    return res.json({
      success: true,
      data: {
        metroIpId: metroIp.id,
        ipaddress: metroIp.ipaddress,
        router: {
          id: router.id,
          name: router.shortname,
          host: mikrotikHost
        },
        ...parsed
      }
    });
  } catch (error) {
    console.error('Read metro IP NAT error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to read NAT configuration'
    });
  }
});

// Route a metro IP to a user on selected router (route only)
router.post('/metroips/:id/route', async (req, res) => {
  try {
    const metroIpId = parseInt(req.params.id);
    const { username, routerId, comment, notes } = req.body;

    if (!metroIpId || !username || !routerId) {
      return res.status(400).json({
        success: false,
        message: 'metroIp id, username and routerId are required'
      });
    }

    const metroIp = await MetroIP.findByPk(metroIpId);
    if (!metroIp) {
      return res.status(404).json({
        success: false,
        message: 'Metro IP not found'
      });
    }

    const primaryIpReply = await Radreply.findOne({
      where: {
        username,
        attribute: 'Framed-IP-Address'
      },
      order: [['id', 'DESC']]
    });

    if (!primaryIpReply || !primaryIpReply.value) {
      return res.status(400).json({
        success: false,
        message: `Primary IP not found for user: ${username}`
      });
    }

    const router = await NasDevice.findByPk(routerId);
    if (!router) {
      return res.status(404).json({
        success: false,
        message: 'Router not found'
      });
    }

    const mikrotikHost = router.server || router.nasname;
    const mikrotikUser = router.ruser || router.username;
    const mikrotikPass = router.naspassword || router.password;

    if (!mikrotikHost || !mikrotikUser || !mikrotikPass) {
      return res.status(400).json({
        success: false,
        message: 'Selected router is missing Mikrotik credentials'
      });
    }

    const destinationIp = metroIp.ipaddress.includes('/') ? metroIp.ipaddress : `${metroIp.ipaddress}/32`;
    const gatewayIp = primaryIpReply.value;
    const noteText =
      notes !== undefined && notes !== null && String(notes).trim() !== ''
        ? String(notes).trim()
        : metroIp.notes;
    const metroForComment = noteText ? { ...metroIp.toJSON(), notes: noteText } : metroIp.toJSON();
    const routeComment = comment || buildRouteCommentForMetro(metroForComment, username);

    const routeResult = await MikrotikService.addRoute(mikrotikHost, mikrotikUser, mikrotikPass, {
      dstAddress: destinationIp,
      gateway: gatewayIp,
      comment: routeComment,
      distance: 1
    });

    if (!routeResult?.success) {
      return res.status(400).json({
        success: false,
        message: routeResult?.message || 'Failed to write route on router'
      });
    }

    const routeUpdates = {
      user: username,
      ip_type: METRO_IP_TYPE_ROUTED,
      binding_type: 'routed'
    };
    if (notes !== undefined && notes !== null && String(notes).trim() !== '') {
      routeUpdates.notes = String(notes).trim();
    }
    await metroIp.update(routeUpdates);

    return res.json({
      success: true,
      message: 'IP routed successfully',
      data: {
        metroIpId: metroIp.id,
        ipaddress: metroIp.ipaddress,
        routedToUser: username,
        gatewayIp,
        router: {
          id: router.id,
          name: router.shortname,
          host: mikrotikHost
        }
      }
    });
  } catch (error) {
    console.error('Route metro IP error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to route metro IP'
    });
  }
});

// Clear route for routed metro IP (not allowed for assigned primary IPs)
router.delete('/metroips/:id/route', async (req, res) => {
  try {
    const metroIpId = parseInt(req.params.id);
    const routerId = parseInt(req.body?.routerId || req.query?.routerId);

    if (!metroIpId || !routerId) {
      return res.status(400).json({
        success: false,
        message: 'metroIp id and routerId are required'
      });
    }

    const metroIp = await MetroIP.findByPk(metroIpId);
    if (!metroIp) {
      return res.status(404).json({
        success: false,
        message: 'Metro IP not found'
      });
    }

    if (metroIp.binding_type !== 'routed') {
      return res.status(400).json({
        success: false,
        message: 'Route clear is only allowed for routed IPs'
      });
    }

    const router = await NasDevice.findByPk(routerId);
    if (!router) {
      return res.status(404).json({
        success: false,
        message: 'Router not found'
      });
    }

    const mikrotikHost = router.server || router.nasname;
    const mikrotikUser = router.ruser || router.username;
    const mikrotikPass = router.naspassword || router.password;

    if (!mikrotikHost || !mikrotikUser || !mikrotikPass) {
      return res.status(400).json({
        success: false,
        message: 'Selected router is missing Mikrotik credentials'
      });
    }

    const routeDestination = metroIp.ipaddress.includes('/') ? metroIp.ipaddress : `${metroIp.ipaddress}/32`;
    const routesResult = await MikrotikService.getRoutes(mikrotikHost, mikrotikUser, mikrotikPass);
    if (!routesResult?.success) {
      return res.status(400).json({
        success: false,
        message: routesResult?.message || 'Failed to read routes from router'
      });
    }

    const routes = routesResult.data?.routes || [];
    const matchingRoutes = routes.filter((route) => {
      const dst = String(route.dstAddress || route['dst-address'] || '').trim();
      return dst === routeDestination;
    });

    let deletedRoutes = 0;
    for (const route of matchingRoutes) {
      const routeId = route.id || route['.id'];
      if (!routeId) {
        continue;
      }
      const deleteResult = await MikrotikService.deleteRoute(mikrotikHost, mikrotikUser, mikrotikPass, routeId);
      if (deleteResult?.success) {
        deletedRoutes += 1;
      }
    }

    const routeClearUpdates = {
      user: null,
      ip_type: 0,
      binding_type: 'assigned'
    };
    if (!metroIp.nat_in_use) {
      routeClearUpdates.notes = null;
    }
    await metroIp.update(routeClearUpdates);

    return res.json({
      success: true,
      message: 'Route cleared successfully',
      data: {
        metroIpId: metroIp.id,
        ipaddress: metroIp.ipaddress,
        deletedRoutes
      }
    });
  } catch (error) {
    console.error('Clear metro IP route error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to clear route for metro IP'
    });
  }
});

// Apply NAT rules for a metro IP (NAT only, independent from route)
router.post('/metroips/:id/nat', async (req, res) => {
  try {
    const metroIpId = parseInt(req.params.id);
    const {
      routerId,
      username,
      natLocalIp,
      natType = 'dst',
      dstNatServiceMode = 'all',
      selectedServices = [],
      customNatRules = [],
      replaceExisting = true
    } = req.body;

    if (!metroIpId || !routerId || !natLocalIp) {
      return res.status(400).json({
        success: false,
        message: 'metroIp id, routerId and natLocalIp are required'
      });
    }

    const metroIp = await MetroIP.findByPk(metroIpId);
    if (!metroIp) {
      return res.status(404).json({
        success: false,
        message: 'Metro IP not found'
      });
    }

    const router = await NasDevice.findByPk(routerId);
    if (!router) {
      return res.status(404).json({
        success: false,
        message: 'Router not found'
      });
    }

    const mikrotikHost = router.server || router.nasname;
    const mikrotikUser = router.ruser || router.username;
    const mikrotikPass = router.naspassword || router.password;

    if (!mikrotikHost || !mikrotikUser || !mikrotikPass) {
      return res.status(400).json({
        success: false,
        message: 'Selected router is missing Mikrotik credentials'
      });
    }

    const natUsername = String(username || metroIp.user || 'manual').trim();
    const natResult = await applyMetroIpNatRules(router, metroIp, natUsername, {
      natLocalIp,
      natType,
      dstNatServiceMode,
      selectedServices,
      customNatRules,
      replaceExisting: replaceExisting !== false
    });

    if (!natResult?.success) {
      return res.status(400).json({
        success: false,
        message: natResult?.message || 'Failed to apply NAT rules'
      });
    }

    await metroIp.update({
      nat_in_use: true,
      nat_local_ip: String(natLocalIp || '').trim()
    });

    return res.json({
      success: true,
      message: 'NAT rules applied successfully',
      data: {
        metroIpId: metroIp.id,
        ipaddress: metroIp.ipaddress,
        username: natUsername,
        nat: natResult,
        router: {
          id: router.id,
          name: router.shortname,
          host: mikrotikHost
        }
      }
    });
  } catch (error) {
    console.error('Apply metro IP NAT error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to apply NAT for metro IP'
    });
  }
});

// Clear NAT rules for a metro IP and release NAT lock
router.delete('/metroips/:id/nat', async (req, res) => {
  try {
    const metroIpId = parseInt(req.params.id);
    const routerId = parseInt(req.body?.routerId || req.query?.routerId);

    if (!metroIpId || !routerId) {
      return res.status(400).json({
        success: false,
        message: 'metroIp id and routerId are required'
      });
    }

    const metroIp = await MetroIP.findByPk(metroIpId);
    if (!metroIp) {
      return res.status(404).json({
        success: false,
        message: 'Metro IP not found'
      });
    }

    const router = await NasDevice.findByPk(routerId);
    if (!router) {
      return res.status(404).json({
        success: false,
        message: 'Router not found'
      });
    }

    const removeResult = await removeExistingNatForMetroIp(router, metroIp.ipaddress);

    const natClearUpdates = {
      nat_in_use: false,
      nat_local_ip: null
    };
    const stillRouted = metroIp.binding_type === 'routed'
      && metroIp.user
      && String(metroIp.user).trim() !== ''
      && String(metroIp.user).trim() !== '-';
    if (!stillRouted) {
      natClearUpdates.notes = null;
    }
    await metroIp.update(natClearUpdates);

    return res.json({
      success: true,
      message: 'NAT rules cleared successfully',
      data: {
        metroIpId: metroIp.id,
        ipaddress: metroIp.ipaddress,
        deletedRules: removeResult?.deleted || 0
      }
    });
  } catch (error) {
    console.error('Clear metro IP NAT error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to clear NAT for metro IP'
    });
  }
});

// Update metro IP reference fields (notes, lan_ip, user label)
router.patch('/metroips/:id', async (req, res) => {
  try {
    const metroIpId = parseInt(req.params.id);
    const { notes, lan_ip, user } = req.body;

    const metroIp = await MetroIP.findByPk(metroIpId);
    if (!metroIp) {
      return res.status(404).json({
        success: false,
        message: 'Metro IP not found'
      });
    }

    const updates = {};
    if (notes !== undefined) {
      updates.notes = notes === null || String(notes).trim() === '' ? null : String(notes).trim();
    }
    if (lan_ip !== undefined) {
      updates.lan_ip = lan_ip === null || String(lan_ip).trim() === '' ? null : String(lan_ip).trim();
    }
    if (user !== undefined) {
      updates.user = user === null || String(user).trim() === '' ? null : String(user).trim();
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    await metroIp.update(updates);
    await metroIp.reload();

    let routerSync = null;
    if (notes !== undefined) {
      if (Number(metroIp.ip_type) === METRO_IP_TYPE_BLOCK) {
        routerSync = { skipped: true, reason: 'block_reserve' };
      } else {
        try {
          routerSync = await syncMetroIpNotesToRouter(metroIp.toJSON());
        } catch (syncError) {
          console.warn('Notes router sync failed:', syncError.message);
          routerSync = { error: syncError.message };
        }
      }
    }

    return res.json({
      success: true,
      message: 'Metro IP updated successfully',
      data: {
        ...metroIp.toJSON(),
        routerSync
      }
    });
  } catch (error) {
    console.error('Patch metro IP error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update metro IP'
    });
  }
});

module.exports = router;
