const express = require('express');
const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const { BtkLogExport, Tenant, TenantBtkSettings } = require('../models');
const BtkLogService = require('../services/BtkLogService');
const TimeAuthority = require('../services/TimeAuthority');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

function resolveTenantFilter(req) {
  const userTenantId = req.user?.tenantId;
  if (userTenantId === 0 || userTenantId === null || userTenantId === undefined) {
    const q = req.query.tenantId ? parseInt(req.query.tenantId, 10) : null;
    return Number.isFinite(q) ? q : null;
  }
  return userTenantId;
}

// GET /api/btk-logs
router.get('/', authenticateToken, async (req, res) => {
  try {
    const tenantId = resolveTenantFilter(req);
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 25, 100);
    const offset = (page - 1) * limit;
    const from = req.query.from || null;
    const to = req.query.to || null;

    const where = { status: 'signed' };
    if (tenantId !== null) {
      where.tenant_id = tenantId;
    }
    if (from || to) {
      where.hour_start = {};
      if (from) where.hour_start[Op.gte] = new Date(from);
      if (to) where.hour_start[Op.lte] = new Date(to);
    }

    const { count, rows } = await BtkLogExport.findAndCountAll({
      where,
      include: [{ model: Tenant, as: 'tenant', attributes: ['id', 'name'] }],
      order: [['hour_start', 'DESC']],
      limit,
      offset
    });

    res.json({
      success: true,
      data: {
        exports: rows.map((r) => ({
          id: r.id,
          tenant_id: r.tenant_id,
          tenant_name: r.tenant?.name,
          hour_start: r.hour_start,
          hour_end: r.hour_end,
          hour_start_display: TimeAuthority.formatPanelDateTime(r.hour_start),
          hour_end_display: TimeAuthority.formatPanelDateTime(r.hour_end),
          filename: r.filename,
          record_count: r.record_count,
          content_sha256: r.content_sha256,
          sign_algorithm: r.sign_algorithm,
          signed_at: r.signed_at,
          signed_at_display: TimeAuthority.formatPanelDateTime(r.signed_at),
          signed_at_authority: r.signed_at_authority,
          signed_at_timezone: r.signed_at_timezone,
          clock_drift_ms: r.clock_drift_ms,
          reference_now: r.reference_now,
          nat_resolution: r.nat_resolution,
          has_zip: BtkLogService.zipAvailable(r),
          created_at: r.created_at
        })),
        pagination: {
          total: count,
          page,
          limit,
          pages: Math.ceil(count / limit) || 1
        }
      }
    });
  } catch (error) {
    console.error('List BTK logs error:', error);
    res.status(500).json({ success: false, message: 'Failed to list BTK logs' });
  }
});

// GET /api/btk-logs/time-status — clock sync health (before signing)
router.get('/time-status', authenticateToken, async (req, res) => {
  try {
    const clock = await TimeAuthority.assertClockSync();
    const bounds = await TimeAuthority.getPreviousHourBounds();
    res.json({
      success: true,
      data: {
        ok: true,
        db_now: clock.dbNow,
        drift_ms: clock.driftMs,
        max_drift_ms: TimeAuthority.getMaxDriftSec() * 1000,
        session_tz: clock.sessionTz,
        timezone_offset: clock.sessionOffset,
        previous_hour: bounds
      }
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: error.message,
      data: { ok: false }
    });
  }
});

// POST /api/btk-logs/run — manual trigger
router.post('/run', authenticateToken, async (req, res) => {
  try {
    const userTenantId = req.user?.tenantId;
    const { hourStart, hourEnd, force } = req.body || {};
    let bounds;
    if (hourStart && hourEnd) {
      const clock = await TimeAuthority.assertClockSync();
      bounds = {
        hourStart: new Date(hourStart),
        hourEnd: new Date(hourEnd),
        hourStartStr: hourStart.replace('T', ' ').slice(0, 19),
        hourEndStr: hourEnd.replace('T', ' ').slice(0, 19),
        referenceNow: clock.dbNow
      };
    } else {
      bounds = await TimeAuthority.getPreviousHourBounds();
    }

    const tenants = await Tenant.findAll({
      where: {
        status: 'active',
        ...(userTenantId && userTenantId !== 0 ? { id: userTenantId } : {})
      }
    });

    const summary = [];
    for (const tenant of tenants) {
      const result = await BtkLogService.exportHourForTenant(
        tenant,
        bounds.hourStart,
        bounds.hourEnd,
        { force: !!force },
        {
          referenceNow: bounds.referenceNow,
          hourStartStr: bounds.hourStartStr,
          hourEndStr: bounds.hourEndStr
        }
      );
      summary.push({ tenant_id: tenant.id, tenant_name: tenant.name, ...result });
    }

    res.json({ success: true, data: { ...bounds, summary } });
  } catch (error) {
    console.error('Run BTK export error:', error);
    res.status(500).json({ success: false, message: 'Failed to run export' });
  }
});

// GET /api/btk-logs/settings/:tenantId
router.get('/settings/:tenantId', authenticateToken, async (req, res) => {
  try {
    const userTenantId = req.user?.tenantId;
    const tid = parseInt(req.params.tenantId, 10);
    if (userTenantId && userTenantId !== 0 && userTenantId !== tid) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const tenant = await Tenant.findByPk(tid);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }
    const settings = await BtkLogService.ensureSettings(tenant);
    res.json({
      success: true,
      data: {
        tenant_id: tenant.id,
        tenant_name: tenant.name,
        file_prefix: BtkLogService.filePrefixFromTenantName(tenant.name),
        ...settings.toJSON()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load settings' });
  }
});

// PUT /api/btk-logs/settings/:tenantId
router.put('/settings/:tenantId', authenticateToken, async (req, res) => {
  try {
    const userTenantId = req.user?.tenantId;
    const tid = parseInt(req.params.tenantId, 10);
    if (userTenantId && userTenantId !== 0 && userTenantId !== tid) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const tenant = await Tenant.findByPk(tid);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }
    const settings = await BtkLogService.ensureSettings(tenant);
    const { enabled, operator_code, btk_pvc_code, btk_bkm_code } = req.body || {};
    await settings.update({
      ...(enabled !== undefined && { enabled: !!enabled }),
      ...(operator_code !== undefined && { operator_code }),
      ...(btk_pvc_code !== undefined && { btk_pvc_code }),
      ...(btk_bkm_code !== undefined && { btk_bkm_code })
    });
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update settings' });
  }
});

// GET /api/btk-logs/:id/download
router.get('/:id/download', authenticateToken, async (req, res) => {
  try {
    const tenantId = resolveTenantFilter(req);
    const row = await BtkLogExport.findByPk(req.params.id, {
      include: [{ model: Tenant, as: 'tenant', attributes: ['id', 'name'] }]
    });

    if (!row) {
      return res.status(404).json({ success: false, message: 'Export not found' });
    }
    if (tenantId !== null && row.tenant_id !== tenantId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    let zipPath;
    try {
      zipPath = await BtkLogService.ensureZipArchive(row);
    } catch (err) {
      const msg = err.message || 'ZIP archive not found';
      const status = msg.includes('zip command not found') ? 503 : 404;
      return res.status(status).json({ success: false, message: msg });
    }

    res.download(zipPath, `${row.filename}.zip`);
  } catch (error) {
    console.error('Download BTK log error:', error);
    res.status(500).json({ success: false, message: 'Failed to download' });
  }
});

// GET /api/btk-logs/:id/verify
router.get('/:id/verify', authenticateToken, async (req, res) => {
  try {
    const tenantId = resolveTenantFilter(req);
    const row = await BtkLogExport.findByPk(req.params.id);
    if (!row) {
      return res.status(404).json({ success: false, message: 'Export not found' });
    }
    if (tenantId !== null && row.tenant_id !== tenantId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const content = await fs.promises.readFile(row.log_path);
    const hash = require('crypto').createHash('sha256').update(content).digest('hex');
    const sigMatch = hash === row.content_sha256;
    const lines = (await fs.promises.readFile(row.signature_path, 'utf8')).split('\n');
    const sigLine = lines.find((l) => l.startsWith('signature='));
    const signatureB64 = sigLine ? sigLine.slice('signature='.length) : '';
    const hmacValid = BtkLogService.verifySignature(content, signatureB64);

    res.json({
      success: true,
      data: {
        valid: sigMatch && hmacValid,
        sha256_match: sigMatch,
        hmac_match: hmacValid,
        content_sha256: row.content_sha256,
        computed_sha256: hash
      }
    });
  } catch (error) {
    console.error('Verify BTK log error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify' });
  }
});

module.exports = router;
