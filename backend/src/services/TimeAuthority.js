const { sequelize } = require('../models');

/**
 * Authoritative time for BTK log signing — MySQL NOW(), not Node Date.
 * Refuses to sign if Node clock drifts too far from DB (NTP desync guard).
 */
class TimeAuthority {
  static getTimezoneOffset() {
    return process.env.BTK_TIMEZONE_OFFSET || '+03:00';
  }

  static getIanaTimezone() {
    return process.env.BTK_IANA_TIMEZONE || 'Europe/Istanbul';
  }

  /** MySQL session datetime string → Date (always BTK offset, never server local). */
  static parseSessionDateTime(str) {
    if (!str) return null;
    const raw = String(str).trim().replace(' ', 'T');
    const offset = this.getTimezoneOffset();
    const withOffset = /[zZ]|[+-]\d{2}:\d{2}$/.test(raw) ? raw : `${raw}${offset}`;
    const d = new Date(withOffset);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  /** Panel / API: Turkey wall clock + explicit offset label */
  static formatPanelDateTime(value) {
    if (!value) return '-';
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return '-';
    const tz = this.getIanaTimezone();
    const offset = this.getTimezoneOffset();
    const parts = new Intl.DateTimeFormat('tr-TR', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).formatToParts(d);
    const pick = (type) => parts.find((p) => p.type === type)?.value || '';
    return `${pick('day')}.${pick('month')}.${pick('year')} ${pick('hour')}:${pick('minute')}:${pick('second')} ${offset}`;
  }

  static getMaxDriftSec() {
    const v = parseFloat(process.env.BTK_MAX_CLOCK_DRIFT_SEC || '5', 10);
    return Number.isFinite(v) && v > 0 ? v : 5;
  }

  /** Ensure MySQL session uses Turkey offset for hour boundaries */
  static async ensureSessionTimezone() {
    const offset = this.getTimezoneOffset();
    await sequelize.query(`SET time_zone = ?`, { replacements: [offset] });
    return offset;
  }

  /**
   * @returns {{ dbNow: Date, driftMs: number, systemTz: string, sessionOffset: string }}
   */
  static async assertClockSync() {
    await this.ensureSessionTimezone();

    const [[row]] = await sequelize.query(`
      SELECT
        NOW(6) AS db_now,
        UTC_TIMESTAMP(6) AS utc_now,
        UNIX_TIMESTAMP(NOW(6)) AS db_unix,
        @@session.time_zone AS session_tz,
        @@system_time_zone AS system_tz
    `);

    const dbUnix = Number(row.db_unix);
    const nodeUnix = Date.now() / 1000;
    const driftSec = Math.abs(nodeUnix - dbUnix);
    const maxDrift = this.getMaxDriftSec();

    if (!Number.isFinite(dbUnix) || driftSec > maxDrift) {
      throw new Error(
        `[TimeAuthority] Saat uyumsuz: uygulama ile MySQL arasında ${driftSec.toFixed(3)}s fark ` +
          `(izin verilen en fazla ${maxDrift}s). NTP/chrony ve container saatini kontrol edin.`
      );
    }

    return {
      dbNow: new Date(row.db_now),
      utcNow: new Date(row.utc_now),
      driftMs: Math.round(driftSec * 1000),
      sessionTz: row.session_tz,
      systemTz: row.system_tz,
      sessionOffset: this.getTimezoneOffset()
    };
  }

  /**
   * Previous closed hour [start, end) in DB session timezone (e.g. 13:00–14:00 when now is 14:xx).
   */
  static async getPreviousHourBounds() {
    await this.assertClockSync();

    const [[bounds]] = await sequelize.query(`
      SELECT
        DATE_SUB(DATE_FORMAT(NOW(6), '%Y-%m-%d %H:00:00'), INTERVAL 1 HOUR) AS hour_start,
        DATE_FORMAT(NOW(6), '%Y-%m-%d %H:00:00') AS hour_end,
        NOW(6) AS reference_now
    `);

    const hourStartStr = bounds.hour_start;
    const hourEndStr = bounds.hour_end;

    return {
      hourStartStr,
      hourEndStr,
      hourStart: this.parseSessionDateTime(hourStartStr),
      hourEnd: this.parseSessionDateTime(hourEndStr),
      referenceNow: this.parseSessionDateTime(bounds.reference_now)
    };
  }

  /** Format date for BTK filename/timestamp fields using DB session TZ */
  static formatBtkTimestamp(value) {
    if (!value) return '';
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
  }

  /** ISO string with explicit offset label for signature sidecar */
  static formatSignedAtForSig(dbNow, sessionOffset) {
    const iso = dbNow.toISOString();
    return `${iso}|tz=${sessionOffset}|source=mysql_now`;
  }
}

module.exports = TimeAuthority;
