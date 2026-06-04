const { sequelize } = require('../models');
const TimeAuthority = require('./TimeAuthority');

function mappingKey(row) {
  return [row?.framedipaddress || '', row?.nasipaddress || '', row?.port || ''].join('|');
}

class NatMappingHistoryService {
  static async now() {
    const clock = await TimeAuthority.assertClockSync();
    return clock.dbNow;
  }

  /**
   * Record NAT mapping change (closes open row, opens new). No-op if unchanged.
   */
  static async recordChange({
    tenantId,
    username,
    framedipaddress = null,
    nasipaddress = null,
    port = null,
    source = 'unknown',
    changedAt = null
  }) {
    if (!tenantId || !username) return null;

    const at = changedAt || (await this.now());
    const next = { framedipaddress, nasipaddress, port };

    const [[open]] = await sequelize.query(
      `SELECT id, framedipaddress, nasipaddress, port
       FROM nat_mapping_history
       WHERE tenant_id = ? AND username = ? AND valid_to IS NULL
       ORDER BY valid_from DESC LIMIT 1`,
      { replacements: [tenantId, username] }
    );

    if (open && mappingKey(open) === mappingKey(next)) {
      return { skipped: true, reason: 'unchanged', id: open.id };
    }

    if (open) {
      await sequelize.query(
        `UPDATE nat_mapping_history SET valid_to = ? WHERE id = ?`,
        { replacements: [at, open.id] }
      );
    }

    const [, meta] = await sequelize.query(
      `INSERT INTO nat_mapping_history
        (tenant_id, username, framedipaddress, nasipaddress, port, valid_from, valid_to, change_source)
       VALUES (?, ?, ?, ?, ?, ?, NULL, ?)`,
      {
        replacements: [
          tenantId,
          username,
          framedipaddress,
          nasipaddress,
          port,
          at,
          source
        ]
      }
    );

    return { id: meta?.insertId, valid_from: at, previous_id: open?.id || null };
  }

  /** Mapping valid at a point in time (session start for BTK). */
  static async getMappingAt(tenantId, username, asOf) {
    if (!tenantId || !username || !asOf) return null;

    const [[row]] = await sequelize.query(
      `SELECT framedipaddress, nasipaddress, port, valid_from, change_source
       FROM nat_mapping_history
       WHERE tenant_id = ? AND username = ?
         AND valid_from <= ?
         AND (valid_to IS NULL OR valid_to > ?)
       ORDER BY valid_from DESC
       LIMIT 1`,
      { replacements: [tenantId, username, asOf, asOf] }
    );

    return row || null;
  }

  /** NAT rows that started during [hourStart, hourEnd) — export warning. */
  static async recordFromRadippool(poolEntry, source = 'radippool') {
    if (!poolEntry?.username || poolEntry.tenant_id == null) return null;
    return this.recordChange({
      tenantId: poolEntry.tenant_id,
      username: poolEntry.username,
      framedipaddress: poolEntry.framedipaddress,
      nasipaddress: poolEntry.nasipaddress,
      port: poolEntry.port,
      source
    });
  }

  static async countChangesInHour(tenantId, hourStart, hourEnd) {
    const [[row]] = await sequelize.query(
      `SELECT COUNT(*) AS cnt FROM nat_mapping_history
       WHERE tenant_id = ?
         AND valid_from >= ? AND valid_from < ?`,
      { replacements: [tenantId, hourStart, hourEnd] }
    );
    return Number(row?.cnt || 0);
  }
}

module.exports = NatMappingHistoryService;
