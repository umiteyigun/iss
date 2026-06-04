const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

/**
 * Trigger FreeRADIUS reload after NAS CRUD.
 * Primary path: dynamic_clients reads NAS from MySQL on first packet (no reload required).
 * Reload (HUP) flushes cached dynamic clients immediately after secret/IP changes.
 */
class RadiusService {
  static isReloadEnabled() {
    return process.env.RADIUS_RELOAD_ENABLED !== 'false';
  }

  static getContainerName() {
    return process.env.RADIUS_CONTAINER_NAME || 'radius_freeradius';
  }

  static async reloadNasClients(reason = 'nas-change') {
    if (!this.isReloadEnabled()) {
      return { success: true, skipped: true, reason: 'disabled' };
    }

    const container = this.getContainerName();

    try {
      if (process.env.RADIUS_RELOAD_MODE === 'dockerode') {
        return await this.reloadViaDockerode(container, reason);
      }
      return await this.reloadViaDockerExec(container, reason);
    } catch (error) {
      console.warn(`[RadiusService] Reload failed (${reason}):`, error.message);
      return {
        success: false,
        skipped: false,
        reason,
        message: error.message,
        hint: 'New NAS may still work via dynamic_clients SQL lookup on first RADIUS packet.'
      };
    }
  }

  static async reloadViaDockerExec(container, reason) {
    await execFileAsync('docker', ['exec', container, '/usr/local/bin/reload-radius.sh'], {
      timeout: 15000
    });
    console.log(`[RadiusService] Reload OK via docker exec (${reason})`);
    return { success: true, method: 'docker-exec-hup', reason };
  }

  static async reloadViaDockerode(containerName, reason) {
    let Docker;
    try {
      Docker = require('dockerode');
    } catch (_) {
      return this.reloadViaDockerExec(containerName, reason);
    }

    const docker = new Docker({ socketPath: process.env.DOCKER_HOST || '/var/run/docker.sock' });
    const listed = await docker.listContainers({
      all: false,
      filters: { name: [containerName] }
    });

    const match = listed.find((item) =>
      (item.Names || []).some((name) => name.replace(/^\//, '') === containerName || name.includes(containerName))
    );

    if (!match) {
      throw new Error(`Container not found: ${containerName}`);
    }

    const container = docker.getContainer(match.Id);
    const execInstance = await container.exec({
      Cmd: ['/usr/local/bin/reload-radius.sh'],
      AttachStdout: true,
      AttachStderr: true
    });

    const stream = await execInstance.start({ hijack: true, stdin: false });
    await new Promise((resolve, reject) => {
      stream.on('end', resolve);
      stream.on('error', reject);
      setTimeout(resolve, 3000);
    });

    console.log(`[RadiusService] Reload OK via dockerode (${reason})`);
    return { success: true, method: 'dockerode-hup', reason };
  }
}

module.exports = RadiusService;
