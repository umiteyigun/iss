-- Metro IP block reserve: ip_type=3, ipaddress stores CIDR (e.g. 212.15.1.160/27) as single row
USE radius;

-- No schema change required; document ip_type values:
-- 0 = static host, 1 = shared with ports, 2 = extra routed, 3 = block reserved (CIDR, no MikroTik)
