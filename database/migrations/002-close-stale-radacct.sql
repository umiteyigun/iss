-- Close stale/open accounting rows (SQL only — does not disconnect MikroTik PPP)
-- Safe to re-run: only touches rows with acctstoptime IS NULL
USE radius;

UPDATE radacct
SET
  acctstoptime = NOW(),
  acctsessiontime = GREATEST(0, TIMESTAMPDIFF(SECOND, acctstarttime, NOW())),
  acctterminatecause = 'Admin-Reset'
WHERE acctstoptime IS NULL;
