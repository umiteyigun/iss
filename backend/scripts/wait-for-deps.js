#!/usr/bin/env node
/**
 * Wait for MySQL and Redis before starting the API (replaces depends_on race).
 */
const net = require('net');

const MYSQL_HOST = process.env.DB_HOST || 'mysql';
const MYSQL_PORT = parseInt(process.env.DB_PORT || '3306', 10);
const REDIS_HOST = process.env.REDIS_HOST || 'redis';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const MAX_ATTEMPTS = parseInt(process.env.WAIT_MAX_ATTEMPTS || '60', 10);
const DELAY_MS = parseInt(process.env.WAIT_DELAY_MS || '2000', 10);

function waitForPort(host, port, label) {
  return new Promise((resolve, reject) => {
    let attempt = 0;

    const tryConnect = () => {
      attempt += 1;
      const socket = new net.Socket();
      socket.setTimeout(3000);

      socket.once('connect', () => {
        socket.destroy();
        console.log(`[wait-for-deps] ${label} ready (${host}:${port})`);
        resolve();
      });

      socket.once('error', () => {
        socket.destroy();
        if (attempt >= MAX_ATTEMPTS) {
          reject(new Error(`${label} not reachable at ${host}:${port} after ${MAX_ATTEMPTS} attempts`));
          return;
        }
        console.log(`[wait-for-deps] ${label} not ready (${attempt}/${MAX_ATTEMPTS}), retry in ${DELAY_MS}ms...`);
        setTimeout(tryConnect, DELAY_MS);
      });

      socket.once('timeout', () => {
        socket.destroy();
        socket.emit('error', new Error('timeout'));
      });

      socket.connect(port, host);
    };

    tryConnect();
  });
}

async function main() {
  console.log('[wait-for-deps] Waiting for dependencies...');
  await waitForPort(MYSQL_HOST, MYSQL_PORT, 'MySQL');
  await waitForPort(REDIS_HOST, REDIS_PORT, 'Redis');
  console.log('[wait-for-deps] All dependencies reachable.');
}

main().catch((err) => {
  console.error('[wait-for-deps] Failed:', err.message);
  process.exit(1);
});
