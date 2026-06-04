const crypto = require('crypto');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const { Op } = require('sequelize');
const {
  sequelize,
  Tenant,
  TenantBtkSettings,
  BtkLogExport,
  Radacct,
  Radcheck,
  Radreply,
  Radippool
} = require('../models');
const { RADIUS_PASSWORD_ATTR } = require('../constants/radius');
const TimeAuthority = require('./TimeAuthority');

const execFileAsync = promisify(execFile);

class BtkLogService {
  static getStorageRoot() {
    return process.env.BTK_LOG_ROOT || '/data/btk-logs';
  }

  static getSigningSecret() {
    return process.env.LOG_SIGNING_SECRET || process.env.JWT_SECRET || 'change-btk-signing-secret';
  }

  /** Tenant name → file prefix (e.g. KOU_TEKNOPARK) */
  static filePrefixFromTenantName(name) {
    return String(name || 'TENANT')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 64) || 'TENANT';
  }

  static parsePortRange(portStr) {
    if (!portStr || typeof portStr !== 'string') {
      return { privStart: '0', privEnd: '0', pubStart: '0', pubEnd: '0' };
    }
    const cleaned = portStr.trim();
    const m = cleaned.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m) {
      return { privStart: '0', privEnd: '0', pubStart: m[1], pubEnd: m[2] };
    }
    return { privStart: '0', privEnd: '0', pubStart: cleaned, pubEnd: cleaned };
  }

  static buildLine(row, settings) {
    const privateIp = row.framedipaddress || '';
    const sharedIp = row.shared_ip || '';
    const isPrivate = /^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/.test(privateIp);
    const ports = this.parsePortRange(row.port_range);

    let gercekIp = sharedIp || privateIp;
    let pubStart = ports.pubStart;
    let pubEnd = ports.pubEnd;

    if (!isPrivate) {
      gercekIp = privateIp || gercekIp;
      pubStart = '0';
      pubEnd = '0';
    }

    const stopInHour = row.acctstoptime && row.acctstoptime <= row._hour_end;
    const oDurum =
      row._force_durum != null
        ? String(row._force_durum)
        : stopInHour || row.acctstoptime
          ? '2'
          : '1';

    const endDate = row.acctstoptime || row._hour_end;

    const fields = [
      row.username || '',
      privateIp,
      ports.privStart,
      ports.privEnd,
      gercekIp,
      pubStart,
      pubEnd,
      row.start_btk || TimeAuthority.formatBtkTimestamp(row.acctstarttime),
      row.stop_btk || TimeAuthority.formatBtkTimestamp(endDate),
      String(row.acctoutputoctets ?? 0),
      String(row.acctinputoctets ?? 0),
      settings.btk_bkm_code || '1',
      oDurum,
      settings.btk_pvc_code || '0',
      row.username || '',
      settings.operator_code || '001'
    ];

    return `${fields.join('|')}\n`;
  }

  static async ensureSettings(tenant) {
    let settings = await TenantBtkSettings.findByPk(tenant.id);
    if (!settings) {
      settings = await TenantBtkSettings.create({
        tenant_id: tenant.id,
        enabled: true,
        operator_code: '001',
        btk_pvc_code: '0',
        btk_bkm_code: '1',
        timezone: 'Europe/Istanbul'
      });
    }
    return settings;
  }

  static async countTenantUsers(tenantId) {
    return Radcheck.count({
      where: { tenant_id: tenantId, attribute: RADIUS_PASSWORD_ATTR },
      distinct: true,
      col: 'username'
    });
  }

  static async nextDailySeq(tenantId, logDate) {
    const dateStr = logDate.toISOString().slice(0, 10);
    await sequelize.query(
      `INSERT INTO tenant_btk_daily_seq (tenant_id, log_date, seq) VALUES (?, ?, 1)
       ON DUPLICATE KEY UPDATE seq = seq + 1`,
      { replacements: [tenantId, dateStr] }
    );
    const [[row]] = await sequelize.query(
      'SELECT seq FROM tenant_btk_daily_seq WHERE tenant_id = ? AND log_date = ?',
      { replacements: [tenantId, dateStr] }
    );
    return row?.seq || 1;
  }

  static async fetchSessionsForHour(tenantId, hourStart, hourEnd, hourStartStr, hourEndStr) {
    const hs = hourStartStr || hourStart;
    const he = hourEndStr || hourEnd;
    const poolRows = await Radippool.findAll({
      attributes: ['username', 'nasipaddress', 'port'],
      where: { tenant_id: tenantId },
      raw: true
    });
    const poolByUser = new Map();
    for (const p of poolRows) {
      if (p.username && !poolByUser.has(p.username)) {
        poolByUser.set(p.username, p);
      }
    }

    const sessions = await Radacct.findAll({
      attributes: [
        'radacctid',
        'username',
        'framedipaddress',
        'acctstarttime',
        'acctstoptime',
        'acctinputoctets',
        'acctoutputoctets',
        [sequelize.literal("DATE_FORMAT(acctstarttime, '%Y%m%d%H%i%s')"), 'start_btk'],
        [
          sequelize.literal(
            `DATE_FORMAT(COALESCE(acctstoptime, ${sequelize.escape(hourEnd)}), '%Y%m%d%H%i%s')`
          ),
          'stop_btk'
        ]
      ],
      where: {
        [Op.and]: [
          sequelize.literal(`EXISTS (
            SELECT 1 FROM radcheck rc
            WHERE rc.username = Radacct.username
              AND rc.attribute = '${RADIUS_PASSWORD_ATTR}'
              AND rc.tenant_id = ${parseInt(tenantId, 10)}
          )`),
          sequelize.literal(`(
            (acctstarttime >= ${sequelize.escape(hs)} AND acctstarttime < ${sequelize.escape(he)})
            OR (acctstoptime >= ${sequelize.escape(hs)} AND acctstoptime < ${sequelize.escape(he)})
            OR (acctstarttime < ${sequelize.escape(he)} AND (acctstoptime IS NULL OR acctstoptime >= ${sequelize.escape(hs)}))
          )`)
        ]
      },
      order: [['radacctid', 'ASC']],
      raw: true
    });

    // NAT: export anındaki radippool (elimizde olan) — değişim geçmişi zorunlu değil
    const enriched = sessions.map((s) => {
      const pool = poolByUser.get(s.username);
      return {
        ...s,
        shared_ip: pool?.nasipaddress || null,
        port_range: pool?.port || null,
        _hour_end: hourEnd
      };
    });

    return { sessions: enriched };
  }

  /** All tenant subscribers (radcheck password row) with export-time IP/NAT from pool or radreply. */
  static async fetchTenantSubscribers(tenantId) {
    const users = await Radcheck.findAll({
      attributes: ['username'],
      where: { tenant_id: tenantId, attribute: RADIUS_PASSWORD_ATTR },
      group: ['username'],
      raw: true
    });
    const usernames = users.map((u) => u.username).filter(Boolean);
    if (usernames.length === 0) return [];

    const poolRows = await Radippool.findAll({
      attributes: ['username', 'framedipaddress', 'nasipaddress', 'port'],
      where: { tenant_id: tenantId, username: { [Op.in]: usernames } },
      raw: true
    });
    const poolByUser = new Map();
    for (const p of poolRows) {
      if (p.username && !poolByUser.has(p.username)) {
        poolByUser.set(p.username, p);
      }
    }

    const replies = await Radreply.findAll({
      attributes: ['username', 'value'],
      where: { username: { [Op.in]: usernames }, attribute: 'Framed-IP-Address' },
      raw: true
    });
    const replyByUser = new Map(replies.map((r) => [r.username, r.value]));

    return usernames.map((username) => {
      const pool = poolByUser.get(username);
      return {
        username,
        framedipaddress: pool?.framedipaddress || replyByUser.get(username) || '',
        nasipaddress: pool?.nasipaddress || null,
        port: pool?.port || null
      };
    });
  }

  static buildDownLine(subscriber, settings, hourStartStr, hourEndStr, hourEnd) {
    const startBtk = hourStartStr ? String(hourStartStr).replace(/[- :]/g, '').slice(0, 14) : '';
    const stopBtk = hourEndStr ? String(hourEndStr).replace(/[- :]/g, '').slice(0, 14) : '';
    return this.buildLine(
      {
        username: subscriber.username,
        framedipaddress: subscriber.framedipaddress || '',
        shared_ip: subscriber.nasipaddress || null,
        port_range: subscriber.port || null,
        start_btk: startBtk,
        stop_btk: stopBtk,
        acctoutputoctets: 0,
        acctinputoctets: 0,
        _hour_end: hourEnd,
        _force_durum: '2'
      },
      settings
    );
  }

  static async signFile(contentBuffer) {
    const contentSha256 = crypto.createHash('sha256').update(contentBuffer).digest('hex');
    const signature = crypto
      .createHmac('sha256', this.getSigningSecret())
      .update(contentBuffer)
      .digest('base64');

    return { contentSha256, signature, signAlgorithm: 'HMAC-SHA256' };
  }

  static async createZip(files, zipPath) {
    const dir = path.dirname(zipPath);
    await fs.mkdir(dir, { recursive: true });
    const args = ['-j', zipPath, ...files];
    try {
      await execFileAsync('zip', args);
    } catch (err) {
      if (err.code === 'ENOENT') {
        throw new Error('zip command not found — rebuild backend image (apk add zip)');
      }
      throw err;
    }
  }

  static zipAvailable(row) {
    if (row.zip_path && fsSync.existsSync(row.zip_path)) return true;
    return !!(row.log_path && fsSync.existsSync(row.log_path));
  }

  /** Create ZIP on disk if missing but log/sig/manifest exist. */
  static async ensureZipArchive(exportRow) {
    const logPath = exportRow.log_path;
    if (!logPath || !fsSync.existsSync(logPath)) {
      throw new Error('Log file not found on disk');
    }

    const zipPath =
      exportRow.zip_path || path.join(path.dirname(logPath), `${exportRow.filename}.zip`);

    if (fsSync.existsSync(zipPath)) {
      return zipPath;
    }

    const sigPath = exportRow.signature_path || `${logPath}.sig`;
    const manifestPath = path.join(path.dirname(logPath), `${exportRow.filename}.manifest.json`);
    const files = [logPath];
    for (const p of [sigPath, manifestPath]) {
      if (fsSync.existsSync(p)) files.push(p);
    }

    await this.createZip(files, zipPath);
    if (exportRow.update) {
      await exportRow.update({ zip_path: zipPath });
    }
    return zipPath;
  }

  static async getPreviousHourBounds() {
    return TimeAuthority.getPreviousHourBounds();
  }

  static async exportHourForTenant(tenant, hourStart, hourEnd, options = {}, timeContext = {}) {
    const hourStartStr = timeContext.hourStartStr;
    const hourEndStr = timeContext.hourEndStr;
    const settings = await this.ensureSettings(tenant);
    if (!settings.enabled) {
      return { skipped: true, reason: 'disabled' };
    }

    const userCount = await this.countTenantUsers(tenant.id);

    const existing = await BtkLogExport.findOne({
      where: { tenant_id: tenant.id, hour_start: hourStart }
    });
    if (existing && !options.force) {
      return { skipped: true, reason: 'already_exported', exportId: existing.id };
    }

    const { sessions } = await this.fetchSessionsForHour(
      tenant.id,
      hourStart,
      hourEnd,
      hourStartStr,
      hourEndStr
    );

    const natResolution = 'export_time_snapshot';
    const deliveryPolicy = 'mandatory_hourly';

    const prefix = this.filePrefixFromTenantName(tenant.name);
    const seq = await this.nextDailySeq(tenant.id, hourEnd);
    const ts = hourEndStr
      ? String(hourEndStr).replace(/[- :]/g, '').slice(0, 14)
      : TimeAuthority.formatBtkTimestamp(hourEnd);
    const filename = `${prefix}_NAT_IPDR_${ts}_${seq}.log`;

    const tenantDir = path.join(this.getStorageRoot(), String(tenant.id), hourStart.toISOString().slice(0, 10));
    await fs.mkdir(tenantDir, { recursive: true });

    const logPath = path.join(tenantDir, filename);
    const sigPath = `${logPath}.sig`;
    const zipPath = path.join(tenantDir, `${filename}.zip`);

    const subscribers = await this.fetchTenantSubscribers(tenant.id);
    const sessionUsernames = new Set(sessions.map((s) => s.username).filter(Boolean));

    let body = '';
    let sessionRows = 0;
    let downRows = 0;

    for (const row of sessions) {
      body += this.buildLine(row, settings);
      sessionRows += 1;
    }

    for (const sub of subscribers) {
      if (sessionUsernames.has(sub.username)) continue;
      body += this.buildDownLine(sub, settings, hourStartStr, hourEndStr, hourEnd);
      downRows += 1;
    }

    const recordCount = sessionRows + downRows;
    const contentBuffer = Buffer.from(body, 'utf8');
    await fs.writeFile(logPath, contentBuffer, 'utf8');

    const clockAtSign = await TimeAuthority.assertClockSync();
    const { contentSha256, signature, signAlgorithm } = await this.signFile(contentBuffer);
    const signedAt = clockAtSign.dbNow;
    const signedAtSig = TimeAuthority.formatSignedAtForSig(signedAt, clockAtSign.sessionOffset);

    const sigContent = [
      `algorithm=${signAlgorithm}`,
      `signed_at=${signedAtSig}`,
      `time_authority=mysql`,
      `clock_drift_ms=${clockAtSign.driftMs}`,
      `session_tz=${clockAtSign.sessionTz}`,
      `tenant_id=${tenant.id}`,
      `tenant_name=${tenant.name}`,
      `hour_start=${TimeAuthority.formatBtkTimestamp(hourStart)}`,
      `hour_end=${TimeAuthority.formatBtkTimestamp(hourEnd)}`,
      `reference_now=${TimeAuthority.formatBtkTimestamp(timeContext.referenceNow || clockAtSign.dbNow)}`,
      `record_count=${recordCount}`,
      `session_rows=${sessionRows}`,
      `down_rows=${downRows}`,
      `delivery_policy=${deliveryPolicy}`,
      `data_basis=${natResolution}`,
      `tenant_user_count=${userCount}`,
      `nat_resolution=${natResolution}`,
      `nat_fallback_count=0`,
      `nat_changes_in_hour=0`,
      `content_sha256=${contentSha256}`,
      `signature=${signature}`,
      ''
    ].join('\n');
    await fs.writeFile(sigPath, sigContent, 'utf8');

    const manifest = {
      tenant_id: tenant.id,
      tenant_name: tenant.name,
      file_prefix: prefix,
      hour_start: TimeAuthority.formatBtkTimestamp(hourStart),
      hour_end: TimeAuthority.formatBtkTimestamp(hourEnd),
      record_count: recordCount,
      session_rows: sessionRows,
      down_rows: downRows,
      delivery_policy: deliveryPolicy,
      data_basis: natResolution,
      tenant_user_count: userCount,
      content_sha256: contentSha256,
      sign_algorithm: signAlgorithm,
      signed_at: signedAt.toISOString(),
      signed_at_authority: 'mysql',
      signed_at_timezone: clockAtSign.sessionOffset,
      clock_drift_ms: clockAtSign.driftMs,
      reference_now: (timeContext.referenceNow || signedAt).toISOString(),
      filename,
      nat_resolution: natResolution,
      nat_fallback_count: 0,
      nat_changes_in_hour: 0
    };
    const manifestPath = path.join(tenantDir, `${filename}.manifest.json`);
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

    try {
      await this.createZip([logPath, sigPath, manifestPath], zipPath);
    } catch (zipErr) {
      console.warn(`[BtkLog] zip failed for tenant ${tenant.id}:`, zipErr.message);
    }

    const payload = {
      tenant_id: tenant.id,
      hour_start: hourStart,
      hour_end: hourEnd,
      filename,
      record_count: recordCount,
      session_rows: sessionRows,
      down_rows: downRows,
      content_sha256: contentSha256,
      signature,
      sign_algorithm: signAlgorithm,
      log_path: logPath,
      signature_path: sigPath,
      zip_path: zipPath,
      status: 'signed',
      signed_at: signedAt,
      signed_at_authority: 'mysql',
      signed_at_timezone: clockAtSign.sessionOffset,
      clock_drift_ms: clockAtSign.driftMs,
      reference_now: timeContext.referenceNow || signedAt,
      nat_fallback_count: 0,
      nat_changes_in_hour: 0,
      nat_resolution: natResolution,
      error_message: null
    };

    let exportRow;
    if (existing) {
      await existing.update(payload);
      exportRow = existing;
    } else {
      exportRow = await BtkLogExport.create(payload);
    }

    return {
      skipped: false,
      exportId: exportRow.id,
      filename,
      record_count: recordCount,
      session_rows: sessionRows,
      down_rows: downRows,
      log_path: logPath,
      zip_path: zipPath
    };
  }

  static async runHourlyExport(options = {}) {
    const { hourStart, hourEnd, hourStartStr, hourEndStr, referenceNow } =
      await TimeAuthority.getPreviousHourBounds();
    const tenants = await Tenant.findAll({
      where: { status: 'active' },
      order: [['id', 'ASC']]
    });

    const summary = [];
    for (const tenant of tenants) {
      try {
        const result = await this.exportHourForTenant(tenant, hourStart, hourEnd, options, {
          referenceNow,
          hourStartStr,
          hourEndStr
        });
        summary.push({ tenant_id: tenant.id, tenant_name: tenant.name, ...result });
      } catch (err) {
        console.error(`[BtkLog] tenant ${tenant.id} failed:`, err);
        summary.push({ tenant_id: tenant.id, tenant_name: tenant.name, error: err.message });
      }
    }
    return {
      hourStart,
      hourEnd,
      hourStartStr,
      hourEndStr,
      referenceNow,
      timezone: TimeAuthority.getTimezoneOffset(),
      summary
    };
  }

  static verifySignature(contentBuffer, signatureB64) {
    const expected = crypto
      .createHmac('sha256', this.getSigningSecret())
      .update(contentBuffer)
      .digest('base64');
    return expected === signatureB64;
  }
}

module.exports = BtkLogService;
