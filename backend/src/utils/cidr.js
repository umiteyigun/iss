'use strict';

function parseIpv4(ip) {
  const parts = String(ip || '').trim().split('.').map((p) => parseInt(p, 10));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
    return null;
  }
  return parts;
}

function ipv4ToInt(parts) {
  return (
    ((parts[0] << 24) >>> 0) +
    ((parts[1] << 16) >>> 0) +
    ((parts[2] << 8) >>> 0) +
    (parts[3] >>> 0)
  ) >>> 0;
}

function intToIpv4(num) {
  return [
    (num >>> 24) & 255,
    (num >>> 16) & 255,
    (num >>> 8) & 255,
    num & 255
  ].join('.');
}

/** @returns {{ base: string, prefix: number, network: number, broadcast: number, hostCount: number } | null} */
function parseCidr(cidr) {
  const raw = String(cidr || '').trim();
  const m = raw.match(/^(\d{1,3}(?:\.\d{1,3}){3})\/(\d{1,2})$/);
  if (!m) return null;

  const prefix = parseInt(m[2], 10);
  if (prefix < 0 || prefix > 32) return null;

  const baseParts = parseIpv4(m[1]);
  if (!baseParts) return null;

  const baseInt = ipv4ToInt(baseParts);
  if (prefix === 0) {
    return {
      base: m[1],
      prefix,
      network: 0,
      broadcast: 0xffffffff,
      hostCount: 0xffffffff
    };
  }

  const mask = prefix === 32 ? 0xffffffff : (~((1 << (32 - prefix)) - 1) >>> 0);
  const network = (baseInt & mask) >>> 0;
  const broadcast = (network | (~mask >>> 0)) >>> 0;
  const hostCount = prefix === 32 ? 1 : Math.max(0, broadcast - network - 1);

  return {
    base: intToIpv4(network),
    prefix,
    network,
    broadcast,
    hostCount
  };
}

function normalizeCidr(cidr) {
  const parsed = parseCidr(cidr);
  if (!parsed) return null;
  return `${parsed.base}/${parsed.prefix}`;
}

function ipInCidr(ip, cidr) {
  const ipParts = parseIpv4(String(ip || '').split('/')[0].trim());
  const block = parseCidr(cidr);
  if (!ipParts || !block) return false;
  const n = ipv4ToInt(ipParts);
  return n >= block.network && n <= block.broadcast;
}

function cidrsOverlap(a, b) {
  const pa = parseCidr(a);
  const pb = parseCidr(b);
  if (!pa || !pb) return false;
  return pa.network <= pb.broadcast && pb.network <= pa.broadcast;
}

module.exports = {
  parseCidr,
  normalizeCidr,
  ipInCidr,
  cidrsOverlap,
  intToIpv4
};
