/** FreeRADIUS dictionary attribute for PAP passwords (case-sensitive). */
const RADIUS_PASSWORD_ATTR = 'Cleartext-Password';

/** Legacy typo used by old PHP app and early Node create — keep for migration queries only. */
const RADIUS_PASSWORD_ATTR_LEGACY = 'Cleartext-password';

module.exports = {
  RADIUS_PASSWORD_ATTR,
  RADIUS_PASSWORD_ATTR_LEGACY
};
