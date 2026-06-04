const { Op } = require('sequelize');

const METRO_IP_TYPE_STATIC = 0;
const METRO_IP_TYPE_SHARED = 1;
const METRO_IP_TYPE_ROUTED = 2;
const METRO_IP_TYPE_BLOCK = 3;

const METRO_SEMANTIC_FILTERS = ['available', 'in_use', 'nat'];

/** Shared IP split into port ranges (SRC pool); not panel "NAT" rows */
function isPortSegmentedSharedMetro(metro) {
  if (!metro || Number(metro.ip_type) !== METRO_IP_TYPE_SHARED) {
    return false;
  }
  const ports = String(metro.ports || '').trim();
  if (!ports || ports === '-') {
    return false;
  }
  if (ports === '1-65000' || ports === '1-65535') {
    return false;
  }
  return /^\d+-\d+$/.test(ports);
}

/** DST NAT (or SRC+DST) managed via panel — not SRC-only shared pool segments */
function isPanelManagedNatMetro(metro) {
  if (!metro || !metro.nat_in_use) {
    return false;
  }
  if (Number(metro.ip_type) === METRO_IP_TYPE_BLOCK) {
    return false;
  }
  if (isPortSegmentedSharedMetro(metro)) {
    return false;
  }
  if (metro.nat_has_dst === true) {
    return true;
  }
  if (Array.isArray(metro.nat_dst_ports) && metro.nat_dst_ports.length > 0) {
    return true;
  }
  const natType = String(metro.nat_type || '').toLowerCase();
  if (natType === 'dst' || natType === 'both') {
    return true;
  }
  if (metro.nat_src_full && !metro.nat_has_dst) {
    return false;
  }
  return Boolean(metro.nat_in_use);
}

function normalizeMetroUserValue(value) {
  if (value === null || value === undefined) {
    return null;
  }
  const normalized = String(value).trim();
  if (!normalized || normalized === '-' || normalized.toLowerCase() === 'null') {
    return null;
  }
  return normalized;
}

function isMetroIpInUseForFilter(metro) {
  if (Number(metro.ip_type) === METRO_IP_TYPE_BLOCK) {
    return true;
  }
  if (normalizeMetroUserValue(metro.user)) {
    return true;
  }
  return isPanelManagedNatMetro(metro);
}

function matchesMetroSemanticFilter(metro, filter) {
  switch (filter) {
    case 'available':
      return !isMetroIpInUseForFilter(metro);
    case 'in_use':
      return isMetroIpInUseForFilter(metro);
    case 'nat':
      return isPanelManagedNatMetro(metro);
    default:
      return true;
  }
}

function getMetroIpDbFilterCondition(filter) {
  switch (filter) {
    case 'static':
      return { ip_type: METRO_IP_TYPE_STATIC };
    case 'shared':
      return { ip_type: METRO_IP_TYPE_SHARED };
    case 'shared_src':
      return {
        ip_type: METRO_IP_TYPE_SHARED,
        ports: {
          [Op.and]: [
            { [Op.ne]: null },
            { [Op.ne]: '' },
            { [Op.notIn]: ['1-65000', '1-65535', '-'] }
          ]
        }
      };
    case 'routed':
      return { ip_type: METRO_IP_TYPE_ROUTED };
    case 'block':
      return { ip_type: METRO_IP_TYPE_BLOCK };
    default:
      return null;
  }
}

function buildMetroIpWhereClause({
  userTenantId,
  requestedTenantId,
  search,
  metroIpFilter,
  ipAddressFilter,
  nasNameFilter
}) {
  const andParts = [];

  if (userTenantId !== null && userTenantId !== undefined && userTenantId !== 0) {
    andParts.push({ tenant_id: userTenantId });
  } else if (requestedTenantId !== null) {
    andParts.push({ tenant_id: requestedTenantId });
  }

  if (search) {
    andParts.push({
      [Op.or]: [
        { nasname: { [Op.like]: `%${search}%` } },
        { ipaddress: { [Op.like]: `%${search}%` } },
        { user: { [Op.like]: `%${search}%` } },
        { ports: { [Op.like]: `%${search}%` } },
        { notes: { [Op.like]: `%${search}%` } },
        { lan_ip: { [Op.like]: `%${search}%` } }
      ]
    });
  }

  if (metroIpFilter && !METRO_SEMANTIC_FILTERS.includes(metroIpFilter)) {
    const dbFilter = getMetroIpDbFilterCondition(metroIpFilter);
    if (dbFilter) {
      andParts.push(dbFilter);
    }
  }

  if (ipAddressFilter) {
    andParts.push({ ipaddress: { [Op.like]: `%${ipAddressFilter}%` } });
  }

  if (nasNameFilter) {
    andParts.push({ nasname: { [Op.like]: `%${nasNameFilter}%` } });
  }

  if (andParts.length === 0) {
    return {};
  }
  if (andParts.length === 1) {
    return andParts[0];
  }
  return { [Op.and]: andParts };
}

module.exports = {
  METRO_IP_TYPE_STATIC,
  METRO_IP_TYPE_SHARED,
  METRO_IP_TYPE_ROUTED,
  METRO_IP_TYPE_BLOCK,
  METRO_SEMANTIC_FILTERS,
  isPortSegmentedSharedMetro,
  isPanelManagedNatMetro,
  normalizeMetroUserValue,
  matchesMetroSemanticFilter,
  getMetroIpDbFilterCondition,
  buildMetroIpWhereClause
};
