const { RouterOSAPI } = require('routeros');
const { NasDevice } = require('../models');

// In-memory storage for interface traffic data
const interfaceTrafficHistory = new Map(); // Key: "deviceId:interfaceName", Value: Array of {timestamp, rxBytes, txBytes}

class MikrotikService {
  constructor() {
    this.timeout = 10000; // 10 second timeout
    this.attempts = 3; // 3 attempts
    this.delay = 2000; // 2 second delay between attempts
  }

  // Helper method to get NAS device by ID
  async getNasDeviceById(deviceId) {
    try {
      const device = await NasDevice.findByPk(deviceId);
      return device;
    } catch (error) {
      console.error('Error getting NAS device by ID:', error);
      throw error;
    }
  }

  async connectToDevice(ip, username, password, useSSL = false) {
    const api = new RouterOSAPI({
      host: ip,
      user: username,
      password: password,
      port: useSSL ? 8729 : 8728,
      timeout: this.timeout,
      keepalive: true
    });

    try {
      await api.connect();
      return api;
    } catch (error) {
      console.error(`Failed to connect to ${ip}:`, error.message);
      throw error;
    }
  }

  async getSystemResource(ip, username, password) {
    let api = null;
    try {
      api = await this.connectToDevice(ip, username, password);
      
      const resource = await api.write('/system/resource/print');
      
      if (resource && resource.length > 0) {
        const data = resource[0];
        return {
          success: true,
          data: {
            cpu: parseFloat(data['cpu-load']) || 0,
            memory: {
              total: parseInt(data['total-memory']) || 0,
              used: parseInt(data['used-memory']) || 0,
              free: parseInt(data['free-memory']) || 0
            },
            disk: {
              total: parseInt(data['total-hdd-space']) || 0,
              used: parseInt(data['used-hdd-space']) || 0,
              free: parseInt(data['free-hdd-space']) || 0
            },
            uptime: data['uptime'] || 'N/A',
            version: data['version'] || 'N/A',
            architecture: data['architecture-name'] || 'N/A',
            board_name: data['board-name'] || 'N/A'
          }
        };
      } else {
        throw new Error('No system resource data received');
      }
    } catch (error) {
      console.error('Mikrotik System Resource Error:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Failed to get system resource information'
      };
    } finally {
      if (api) {
        try {
          await api.close();
        } catch (e) {
          console.error('Error closing API connection:', e.message);
        }
      }
    }
  }

  async getPppoeActiveUsers(ip, username, password) {
    let api = null;
    try {
      api = await this.connectToDevice(ip, username, password);
      
      const activeUsers = await api.write('/ppp/active/print');
      
      const users = activeUsers.map(user => ({
        name: user.name || 'N/A',
        address: user.address || 'N/A',
        uptime: user.uptime || 'N/A',
        bytes_in: parseInt(user['bytes-in']) || 0,
        bytes_out: parseInt(user['bytes-out']) || 0,
        service: user.service || 'N/A',
        caller_id: user['caller-id'] || 'N/A',
        session_id: user['.id'] || 'N/A',
        encoding: user.encoding || 'N/A',
        radius: user.radius || 'N/A',
        dynamic: user.dynamic || 'N/A',
        running: user.running || 'N/A'
      }));

      return {
        success: true,
        data: {
          active_users: users.length,
          users: users
        }
      };
    } catch (error) {
      console.error('Mikrotik PPPoE Users Error:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Failed to get PPPoE active users'
      };
    } finally {
      if (api) {
        try {
          await api.close();
        } catch (e) {
          console.error('Error closing API connection:', e.message);
        }
      }
    }
  }

  async getInterfaceStats(ip, username, password) {
    let api = null;
    try {
      api = await this.connectToDevice(ip, username, password);
      
      const interfaces = await api.write('/interface/print');
      
      const interfaceData = interfaces.map(iface => ({
        name: iface.name || 'N/A',
        type: iface.type || 'N/A',
        running: iface.running === 'true',
        disabled: iface.disabled === 'true',
        rx_byte: parseInt(iface['rx-byte']) || 0,
        tx_byte: parseInt(iface['tx-byte']) || 0,
        rx_packet: parseInt(iface['rx-packet']) || 0,
        tx_packet: parseInt(iface['tx-packet']) || 0,
        rx_drop: parseInt(iface['rx-drop']) || 0,
        tx_drop: parseInt(iface['tx-drop']) || 0,
        rx_error: parseInt(iface['rx-error']) || 0,
        tx_error: parseInt(iface['tx-error']) || 0,
        mtu: parseInt(iface.mtu) || 0,
        mac_address: iface['mac-address'] || 'N/A',
        comment: iface.comment || ''
      }));

      return {
        success: true,
        data: {
          interfaces: interfaceData
        }
      };
    } catch (error) {
      console.error('Mikrotik Interface Stats Error:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Failed to get interface statistics'
      };
    } finally {
      if (api) {
        try {
          await api.close();
        } catch (e) {
          console.error('Error closing API connection:', e.message);
        }
      }
    }
  }

  async getPppSecrets(ip, username, password) {
    let api = null;
    try {
      api = await this.connectToDevice(ip, username, password);
      
      const secrets = await api.write('/ppp/secret/print');
      
      const secretData = secrets.map(secret => ({
        name: secret.name || 'N/A',
        service: secret.service || 'N/A',
        profile: secret.profile || 'N/A',
        local_address: secret['local-address'] || 'N/A',
        remote_address: secret['remote-address'] || 'N/A',
        disabled: secret.disabled === 'true',
        comment: secret.comment || 'N/A'
      }));

      return {
        success: true,
        data: {
          secrets: secretData
        }
      };
    } catch (error) {
      console.error('Mikrotik PPP Secrets Error:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Failed to get PPP secrets'
      };
    } finally {
      if (api) {
        try {
          await api.close();
        } catch (e) {
          console.error('Error closing API connection:', e.message);
        }
      }
    }
  }

  async getInterfaceDetails(ip, username, password, interfaceName) {
    let api = null;
    try {
      api = await this.connectToDevice(ip, username, password);
      
      // Get all interfaces and filter by name
      const allInterfaces = await api.write('/interface/print');
      const interfaces = allInterfaces.filter(iface => iface.name === interfaceName);
      
      if (!interfaces || interfaces.length === 0) {
        return {
          success: false,
          message: `Interface '${interfaceName}' not found. Available interfaces: ${allInterfaces.map(iface => iface.name).join(', ')}`
        };
      }

      const iface = interfaces[0];
      
      // Debug: Log raw interface data from Mikrotik
      console.log('🔍 RAW MIKROTIK INTERFACE DATA:', JSON.stringify(iface, null, 2));
      console.log('🔍 iface.name:', iface.name);
      console.log('🔍 iface.comment:', iface.comment);
      console.log('🔍 iface.comment === undefined:', iface.comment === undefined);
      console.log('🔍 typeof iface.comment:', typeof iface.comment);
      const interfaceData = {
        name: iface.name || 'N/A',
        type: iface.type || 'N/A',
        running: iface.running === 'true',
        disabled: iface.disabled === 'true',
        rx_byte: parseInt(iface['rx-byte']) || 0,
        tx_byte: parseInt(iface['tx-byte']) || 0,
        rx_packet: parseInt(iface['rx-packet']) || 0,
        tx_packet: parseInt(iface['tx-packet']) || 0,
        rx_drop: parseInt(iface['rx-drop']) || 0,
        tx_drop: parseInt(iface['tx-drop']) || 0,
        rx_error: parseInt(iface['rx-error']) || 0,
        tx_error: parseInt(iface['tx-error']) || 0,
        mtu: parseInt(iface.mtu) || 0,
        mac_address: iface['mac-address'] || 'N/A',
        comment: iface.comment || '',
        // Additional fields that might be present
        'mac-address': iface['mac-address'] || 'N/A',
        'rx-byte': parseInt(iface['rx-byte']) || 0,
        'tx-byte': parseInt(iface['tx-byte']) || 0,
        'rx-packet': parseInt(iface['rx-packet']) || 0,
        'tx-packet': parseInt(iface['tx-packet']) || 0,
        'rx-drop': parseInt(iface['rx-drop']) || 0,
        'tx-drop': parseInt(iface['tx-drop']) || 0,
        'rx-error': parseInt(iface['rx-error']) || 0,
        'tx-error': parseInt(iface['tx-error']) || 0
      };

      return {
        success: true,
        data: interfaceData
      };
    } catch (error) {
      console.error('Mikrotik Interface Details Error:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Failed to get interface details'
      };
    } finally {
      if (api) {
        try {
          await api.close();
        } catch (e) {
          console.error('Error closing API connection:', e.message);
        }
      }
    }
  }

  async getDeviceInfo(ip, username, password) {
    try {
      console.log(`MikrotikService: Getting device info for ${ip} with user ${username}`);
      
      const [resourceResult, pppoeResult, interfaceResult, secretsResult] = await Promise.allSettled([
        this.getSystemResource(ip, username, password),
        this.getPppoeActiveUsers(ip, username, password),
        this.getInterfaceStats(ip, username, password),
        this.getPppSecrets(ip, username, password)
      ]);

      const result = {
        success: true,
        data: {
          timestamp: new Date().toISOString(),
          ip: ip,
          system: resourceResult.status === 'fulfilled' && resourceResult.value.success ? resourceResult.value.data : null,
          pppoe: pppoeResult.status === 'fulfilled' && pppoeResult.value.success ? pppoeResult.value.data : null,
          interfaces: interfaceResult.status === 'fulfilled' && interfaceResult.value.success ? interfaceResult.value.data : null,
          ppp_secrets: secretsResult.status === 'fulfilled' && secretsResult.value.success ? secretsResult.value.data : null
        },
        warnings: []
      };

      // Check for failures and add warnings
      const failures = [
        { name: 'System Resource', result: resourceResult },
        { name: 'PPPoE Users', result: pppoeResult },
        { name: 'Interface Stats', result: interfaceResult },
        { name: 'PPP Secrets', result: secretsResult }
      ].filter(f => f.result.status === 'rejected' || (f.result.status === 'fulfilled' && !f.result.value.success));

      if (failures.length > 0) {
        result.warnings = failures.map(f => 
          f.result.status === 'rejected' 
            ? `${f.name}: ${f.result.reason.message}`
            : `${f.name}: ${f.result.value.message}`
        );
      }

      return result;
    } catch (error) {
      console.error('Mikrotik Device Info Error:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Failed to get device information'
      };
    }
  }

  // Test connection method
  async testConnection(ip, username, password) {
    let api = null;
    try {
      const startTime = Date.now();
      api = await this.connectToDevice(ip, username, password);
      const responseTime = Date.now() - startTime;
      
      // Test with a simple command
      await api.write('/system/identity/print');
      
      return {
        success: true,
        data: {
          reachable: true,
          response_time: responseTime,
          last_tested: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Mikrotik Connection Test Error:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Failed to connect to Mikrotik device'
      };
    } finally {
      if (api) {
        try {
          await api.close();
        } catch (e) {
          console.error('Error closing API connection:', e.message);
        }
      }
    }
  }

  // IP Addresses
  async getIpAddresses(ip, username, password) {
    let api = null;
    try {
      api = await this.connectToDevice(ip, username, password);
      const addresses = await api.write('/ip/address/print');
      
      const addressData = addresses.map(addr => ({
        id: addr['.id'] || null,
        address: addr.address || 'N/A',
        network: addr.network || 'N/A',
        interface: addr.interface || 'N/A',
        disabled: addr.disabled === 'true',
        invalid: addr.invalid === 'true',
        dynamic: addr.dynamic === 'true',
        flags: addr.flags || '',
        comment: addr.comment || ''
      }));

      return {
        success: true,
        data: { addresses: addressData }
      };
    } catch (error) {
      console.error('Mikrotik IP Addresses Error:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Failed to get IP addresses'
      };
    } finally {
      if (api) {
        try {
          await api.close();
        } catch (e) {
          console.error('Error closing API connection:', e.message);
        }
      }
    }
  }

  // Add IP Address
  async addIpAddress(ip, username, password, addressData) {
    let api = null;
    try {
      api = await this.connectToDevice(ip, username, password);
      
      const params = [
        `=address=${addressData.address}`,
        `=interface=${addressData.interface}`
      ];
      
      if (addressData.comment) {
        params.push(`=comment=${addressData.comment}`);
      }
      
      if (addressData.disabled) {
        params.push('=disabled=yes');
      }

      const result = await api.write('/ip/address/add', params);
      
      return {
        success: true,
        data: { id: result.ret },
        message: 'IP address added successfully'
      };
    } catch (error) {
      console.error('Mikrotik Add IP Address Error:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Failed to add IP address'
      };
    } finally {
      if (api) {
        try {
          await api.close();
        } catch (e) {
          console.error('Error closing API connection:', e.message);
        }
      }
    }
  }

  // Update IP Address
  async updateIpAddress(ip, username, password, addressId, addressData) {
    let api = null;
    try {
      api = await this.connectToDevice(ip, username, password);
      
      const params = [`=.id=${addressId}`];
      
      if (addressData.address) {
        params.push(`=address=${addressData.address}`);
      }
      
      if (addressData.interface) {
        params.push(`=interface=${addressData.interface}`);
      }
      
      if (addressData.comment !== undefined) {
        params.push(`=comment=${addressData.comment}`);
      }
      
      if (addressData.disabled !== undefined) {
        params.push(`=disabled=${addressData.disabled ? 'yes' : 'no'}`);
      }

      await api.write('/ip/address/set', params);
      
      return {
        success: true,
        message: 'IP address updated successfully'
      };
    } catch (error) {
      console.error('Mikrotik Update IP Address Error:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Failed to update IP address'
      };
    } finally {
      if (api) {
        try {
          await api.close();
        } catch (e) {
          console.error('Error closing API connection:', e.message);
        }
      }
    }
  }

  // Delete IP Address
  async deleteIpAddress(ip, username, password, addressId) {
    let api = null;
    try {
      api = await this.connectToDevice(ip, username, password);
      
      await api.write('/ip/address/remove', [`=.id=${addressId}`]);
      
      return {
        success: true,
        message: 'IP address deleted successfully'
      };
    } catch (error) {
      console.error('Mikrotik Delete IP Address Error:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Failed to delete IP address'
      };
    } finally {
      if (api) {
        try {
          await api.close();
        } catch (e) {
          console.error('Error closing API connection:', e.message);
        }
      }
    }
  }

  // Routes
  async getRoutes(ip, username, password) {
    let api = null;
    try {
      api = await this.connectToDevice(ip, username, password);
      const routes = await api.write('/ip/route/print');
      
      const routeData = routes.map(route => ({
        id: route['.id'] || null,
        dstAddress: route['dst-address'] || 'N/A',
        gateway: route.gateway || 'N/A',
        distance: parseInt(route.distance) || 0,
        scope: parseInt(route.scope) || 0,
        'target-scope': parseInt(route['target-scope']) || 0,
        disabled: route.disabled === 'true',
        active: route.active === 'true',
        dynamic: route.dynamic === 'true',
        connect: route.connect === 'true',
        static: route.static === 'true',
        flags: route.flags || '',
        comment: route.comment || ''
      }));

      return {
        success: true,
        data: { routes: routeData }
      };
    } catch (error) {
      console.error('Mikrotik Routes Error:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Failed to get routes'
      };
    } finally {
      if (api) {
        try {
          await api.close();
        } catch (e) {
          console.error('Error closing API connection:', e.message);
        }
      }
    }
  }

  // Firewall Rules
  async getFirewallRules(ip, username, password) {
    let api = null;
    try {
      api = await this.connectToDevice(ip, username, password);
      const rules = await api.write('/ip/firewall/filter/print');
      
      const ruleData = rules.map(rule => ({
        chain: rule.chain || 'N/A',
        action: rule.action || 'N/A',
        'src-address': rule['src-address'] || 'N/A',
        'dst-address': rule['dst-address'] || 'N/A',
        protocol: rule.protocol || 'N/A',
        'src-port': rule['src-port'] || 'N/A',
        'dst-port': rule['dst-port'] || 'N/A',
        disabled: rule.disabled === 'true',
        invalid: rule.invalid === 'true',
        dynamic: rule.dynamic === 'true',
        comment: rule.comment || ''
      }));

      return {
        success: true,
        data: { rules: ruleData }
      };
    } catch (error) {
      console.error('Mikrotik Firewall Rules Error:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Failed to get firewall rules'
      };
    } finally {
      if (api) {
        try {
          await api.close();
        } catch (e) {
          console.error('Error closing API connection:', e.message);
        }
      }
    }
  }

  // NAT Rules
  async getNatRules(ip, username, password) {
    let api = null;
    try {
      api = await this.connectToDevice(ip, username, password);
      const rules = await api.write('/ip/firewall/nat/print');
      
      const natData = rules.map(rule => ({
        chain: rule.chain || 'N/A',
        action: rule.action || 'N/A',
        'src-address': rule['src-address'] || 'N/A',
        'dst-address': rule['dst-address'] || 'N/A',
        'to-addresses': rule['to-addresses'] || 'N/A',
        'to-ports': rule['to-ports'] || 'N/A',
        protocol: rule.protocol || 'N/A',
        'src-port': rule['src-port'] || 'N/A',
        'dst-port': rule['dst-port'] || 'N/A',
        disabled: rule.disabled === 'true',
        invalid: rule.invalid === 'true',
        dynamic: rule.dynamic === 'true',
        comment: rule.comment || ''
      }));

      return {
        success: true,
        data: { nat_rules: natData }
      };
    } catch (error) {
      console.error('Mikrotik NAT Rules Error:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Failed to get NAT rules'
      };
    } finally {
      if (api) {
        try {
          await api.close();
        } catch (e) {
          console.error('Error closing API connection:', e.message);
        }
      }
    }
  }

  // Add NAT rule and move it to the top of the list
  async addNatRuleTop(router, rule) {
    // router: NasDevice instance
    let api = null;
    try {
      api = await this.connectToDevice(router.ip_address || router.nasname, router.username || router.ruser, router.password || router.naspassword, router.use_ssl);

      // Convert rule object to Mikrotik API format (array of key-value pairs)
      const mikrotikParams = [];
      for (const [key, value] of Object.entries(rule)) {
        mikrotikParams.push(`=${key}=${value}`);
      }

      console.log('addNatRuleTop - mikrotikParams:', mikrotikParams);

      // Create NAT rule
      const addResult = await api.write('/ip/firewall/nat/add', mikrotikParams);
      const newId = addResult?.ret || addResult?.[0]?.ret || addResult?.[0]?.['.id'];

      console.log('addNatRuleTop - addResult:', addResult, 'newId:', newId);

      // Move to the top (destination=0)
      if (newId) {
        try {
          await api.write('/ip/firewall/nat/move', [`=.id=${newId}`, '=destination=0']);
        } catch (moveErr) {
          console.warn('Failed to move NAT rule to top:', moveErr.message);
        }
      }

      return { success: true, id: newId };
    } catch (error) {
      console.error('addNatRuleTop error:', error.message);
      return { success: false, message: error.message };
    } finally {
      if (api) {
        try { await api.close(); } catch (_) {}
      }
    }
  }

  // Delete NAT rules matching a predicate
  async deleteNatRulesWhere(router, predicateFn) {
    let api = null;
    try {
      api = await this.connectToDevice(router.ip_address || router.nasname, router.username || router.ruser, router.password || router.naspassword, router.use_ssl);
      const rules = await api.write('/ip/firewall/nat/print');
      const toDelete = rules.filter(predicateFn);
      
      console.log('deleteNatRulesWhere - found rules to delete:', toDelete.length);
      
      for (const r of toDelete) {
        const id = r['.id'];
        if (id) {
          await api.write('/ip/firewall/nat/remove', [`=.id=${id}`]);
          console.log('deleteNatRulesWhere - deleted rule:', id);
        }
      }
      return { success: true, deleted: toDelete.length };
    } catch (error) {
      console.error('deleteNatRulesWhere error:', error.message);
      return { success: false, message: error.message };
    } finally {
      if (api) {
        try { await api.close(); } catch (_) {}
      }
    }
  }

  // High-level: set src-nat for private -> shared public for both TCP/UDP with src-port range
  async setPrivateToSharedNat(router, username, privateIp, publicIp, portRange = '1-5000') {
    // Remove existing rules for this username or private IP first
    await this.deleteNatRulesWhere(router, r => {
      const comment = r.comment || '';
      const logPrefix = r['log-prefix'] || r.logPrefix || '';
      return ((comment.includes(`username=${username}`) || logPrefix === username) || r['src-address'] === privateIp) && r.chain === 'srcnat';
    });

    const baseComment = `username=${username} src-nat private=${privateIp} -> public=${publicIp} ports=${portRange}`;

    // TCP rule
    const tcpRule = {
      chain: 'srcnat',
      protocol: 'tcp',
      'src-address': privateIp,
      'dst-port': '0-65535',
      action: 'src-nat',
      'to-addresses': publicIp,
      'to-ports': portRange,
      'log-prefix': username,
      comment: `${baseComment} proto=tcp`
    };
    const tcpRes = await this.addNatRuleTop(router, tcpRule);
    if (tcpRes?.success === false) return tcpRes;

    // UDP rule
    const udpRule = {
      chain: 'srcnat',
      protocol: 'udp',
      'src-address': privateIp,
      'dst-port': '0-65535',
      action: 'src-nat',
      'to-addresses': publicIp,
      'to-ports': portRange,
      'log-prefix': username,
      comment: `${baseComment} proto=udp`
    };
    const udpRes = await this.addNatRuleTop(router, udpRule);
    if (udpRes?.success === false) return udpRes;

    return { success: true };
  }

  async clearPrivateToSharedNat(router, username, privateIp = null) {
    // Delete rules by username and optional private IP
    return await this.deleteNatRulesWhere(router, r => {
      const comment = r.comment || '';
      const byUser = comment.includes(`username=${username}`);
      const byPrivate = privateIp ? r['src-address'] === privateIp : true;
      return r.chain === 'srcnat' && byUser && byPrivate;
    });
  }

  // DHCP Server
  async getDhcpServer(ip, username, password) {
    let api = null;
    try {
      api = await this.connectToDevice(ip, username, password);
      const servers = await api.write('/ip/dhcp-server/print');
      
      const serverData = servers.map(server => ({
        name: server.name || 'N/A',
        interface: server.interface || 'N/A',
        'address-pool': server['address-pool'] || 'N/A',
        'lease-time': server['lease-time'] || 'N/A',
        disabled: server.disabled === 'true',
        invalid: server.invalid === 'true',
        dynamic: server.dynamic === 'true',
        comment: server.comment || ''
      }));

      return {
        success: true,
        data: { dhcp_servers: serverData }
      };
    } catch (error) {
      console.error('Mikrotik DHCP Server Error:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Failed to get DHCP servers'
      };
    } finally {
      if (api) {
        try {
          await api.close();
        } catch (e) {
          console.error('Error closing API connection:', e.message);
        }
      }
    }
  }

  // Add DHCP Server
  async addDhcpServer(ip, username, password, serverData) {
    let api = null;
    try {
      api = await this.connectToDevice(ip, username, password);
      
      const command = [
        '/ip/dhcp-server/add',
        `=name=${serverData.name}`,
        `=interface=${serverData.interface}`,
        `=address-pool=${serverData['address-pool']}`,
        `=lease-time=${serverData['lease-time']}`,
        serverData.disabled ? '=disabled=yes' : '=disabled=no',
        serverData.comment ? `=comment=${serverData.comment}` : ''
      ].filter(cmd => cmd !== '');

      await api.write(command);

      return {
        success: true,
        message: 'DHCP server added successfully'
      };
    } catch (error) {
      console.error('Mikrotik Add DHCP Server Error:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Failed to add DHCP server'
      };
    } finally {
      if (api) {
        try {
          await api.close();
        } catch (e) {
          console.error('Error closing API connection:', e.message);
        }
      }
    }
  }

  // Update DHCP Server
  async updateDhcpServer(ip, username, password, serverId, serverData) {
    let api = null;
    try {
      api = await this.connectToDevice(ip, username, password);
      
      const command = [
        `/ip/dhcp-server/set`,
        `=.id=${serverId}`,
        `=name=${serverData.name}`,
        `=interface=${serverData.interface}`,
        `=address-pool=${serverData['address-pool']}`,
        `=lease-time=${serverData['lease-time']}`,
        serverData.disabled ? '=disabled=yes' : '=disabled=no',
        serverData.comment ? `=comment=${serverData.comment}` : ''
      ].filter(cmd => cmd !== '');

      await api.write(command);

      return {
        success: true,
        message: 'DHCP server updated successfully'
      };
    } catch (error) {
      console.error('Mikrotik Update DHCP Server Error:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Failed to update DHCP server'
      };
    } finally {
      if (api) {
        try {
          await api.close();
        } catch (e) {
          console.error('Error closing API connection:', e.message);
        }
      }
    }
  }

  // Delete DHCP Server
  async deleteDhcpServer(ip, username, password, serverId) {
    let api = null;
    try {
      api = await this.connectToDevice(ip, username, password);
      
      await api.write(['/ip/dhcp-server/remove', `=.id=${serverId}`]);

      return {
        success: true,
        message: 'DHCP server deleted successfully'
      };
    } catch (error) {
      console.error('Mikrotik Delete DHCP Server Error:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Failed to delete DHCP server'
      };
    } finally {
      if (api) {
        try {
          await api.close();
        } catch (e) {
          console.error('Error closing API connection:', e.message);
        }
      }
    }
  }

  // DHCP Server Leases
  async getDhcpServerLeases(ip, username, password) {
    let api = null;
    try {
      api = await this.connectToDevice(ip, username, password);
      const leases = await api.write('/ip/dhcp-server/lease/print');
      
      const leaseData = leases.map(lease => ({
        id: lease['.id'] || null,
        address: lease.address || 'N/A',
        'mac-address': lease['mac-address'] || 'N/A',
        'host-name': lease['host-name'] || 'N/A',
        server: lease.server || 'N/A',
        status: lease.status || 'N/A',
        'last-seen': lease['last-seen'] || 'N/A',
        dynamic: lease.dynamic === 'true',
        disabled: lease.disabled === 'true',
        invalid: lease.invalid === 'true',
        comment: lease.comment || ''
      }));

      return {
        success: true,
        data: { dhcp_server_leases: leaseData }
      };
    } catch (error) {
      console.error('Mikrotik DHCP Server Leases Error:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Failed to get DHCP server leases'
      };
    } finally {
      if (api) {
        try {
          await api.close();
        } catch (e) {
          console.error('Error closing API connection:', e.message);
        }
      }
    }
  }

  // DHCP Client
  async getDhcpClient(ip, username, password) {
    let api = null;
    try {
      api = await this.connectToDevice(ip, username, password);
      const clients = await api.write('/ip/dhcp-client/print');
      
      const clientData = clients.map(client => ({
        interface: client.interface || 'N/A',
        status: client.status || 'N/A',
        address: client.address || 'N/A',
        gateway: client.gateway || 'N/A',
        'dhcp-server': client['dhcp-server'] || 'N/A',
        disabled: client.disabled === 'true',
        invalid: client.invalid === 'true',
        dynamic: client.dynamic === 'true',
        comment: client.comment || ''
      }));

      return {
        success: true,
        data: { dhcp_clients: clientData }
      };
    } catch (error) {
      console.error('Mikrotik DHCP Client Error:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Failed to get DHCP clients'
      };
    } finally {
      if (api) {
        try {
          await api.close();
        } catch (e) {
          console.error('Error closing API connection:', e.message);
        }
      }
    }
  }

  // DNS
  async getDns(ip, username, password) {
    let api = null;
    try {
      api = await this.connectToDevice(ip, username, password);
      const dns = await api.write('/ip/dns/print');
      
      const dnsData = dns.map(d => ({
        servers: d.servers || 'N/A',
        'allow-remote-requests': d['allow-remote-requests'] === 'true',
        'cache-size': parseInt(d['cache-size']) || 0,
        'cache-max-ttl': d['cache-max-ttl'] || 'N/A',
        'query-server-timeout': d['query-server-timeout'] || 'N/A',
        'query-total-timeout': d['query-total-timeout'] || 'N/A'
      }));

      return {
        success: true,
        data: { dns_settings: dnsData }
      };
    } catch (error) {
      console.error('Mikrotik DNS Error:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Failed to get DNS settings'
      };
    } finally {
      if (api) {
        try {
          await api.close();
        } catch (e) {
          console.error('Error closing API connection:', e.message);
        }
      }
    }
  }

  // ARP
  async getArp(ip, username, password) {
    let api = null;
    try {
      api = await this.connectToDevice(ip, username, password);
      const arp = await api.write('/ip/arp/print');
      
      const arpData = arp.map(entry => ({
        address: entry.address || 'N/A',
        'mac-address': entry['mac-address'] || 'N/A',
        interface: entry.interface || 'N/A',
        published: entry.published === 'true',
        invalid: entry.invalid === 'true',
        DHCP: entry.DHCP === 'true',
        dynamic: entry.dynamic === 'true',
        complete: entry.complete === 'true',
        disabled: entry.disabled === 'true',
        comment: entry.comment || ''
      }));

      return {
        success: true,
        data: { arp_entries: arpData }
      };
    } catch (error) {
      console.error('Mikrotik ARP Error:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Failed to get ARP entries'
      };
    } finally {
      if (api) {
        try {
          await api.close();
        } catch (e) {
          console.error('Error closing API connection:', e.message);
        }
      }
    }
  }

  // Routes CRUD Operations
  async addRoute(ip, username, password, routeData) {
    let api = null;
    try {
      api = await this.connectToDevice(ip, username, password);
      
      const routeParams = {
        'dst-address': routeData.dstAddress || routeData['dst-address'],
        'gateway': routeData.gateway
      };

      // Add optional parameters if provided
      if (routeData.distance !== undefined) routeParams.distance = routeData.distance.toString();
      if (routeData.scope !== undefined) routeParams.scope = routeData.scope.toString();
      if (routeData.comment) routeParams.comment = routeData.comment;
      if (routeData.disabled !== undefined) routeParams.disabled = routeData.disabled ? 'yes' : 'no';

      await api.write('/ip/route/add', routeParams);

      return {
        success: true,
        message: 'Route added successfully'
      };
    } catch (error) {
      console.error('Mikrotik Add Route Error:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Failed to add route'
      };
    } finally {
      if (api) {
        try {
          await api.close();
        } catch (e) {
          console.error('Error closing API connection:', e.message);
        }
      }
    }
  }

  async updateRoute(ip, username, password, routeId, routeData) {
    let api = null;
    try {
      api = await this.connectToDevice(ip, username, password);
      
      const routeParams = {
        '.id': routeId
      };

      // Add parameters to update
      if (routeData.dstAddress || routeData['dst-address']) {
        routeParams['dst-address'] = routeData.dstAddress || routeData['dst-address'];
      }
      if (routeData.gateway) routeParams.gateway = routeData.gateway;
      if (routeData.distance !== undefined) routeParams.distance = routeData.distance.toString();
      if (routeData.scope !== undefined) routeParams.scope = routeData.scope.toString();
      if (routeData.comment !== undefined) routeParams.comment = routeData.comment;
      if (routeData.disabled !== undefined) routeParams.disabled = routeData.disabled ? 'yes' : 'no';

      await api.write('/ip/route/set', routeParams);

      return {
        success: true,
        message: 'Route updated successfully'
      };
    } catch (error) {
      console.error('Mikrotik Update Route Error:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Failed to update route'
      };
    } finally {
      if (api) {
        try {
          await api.close();
        } catch (e) {
          console.error('Error closing API connection:', e.message);
        }
      }
    }
  }

  async deleteRoute(ip, username, password, routeId) {
    let api = null;
    try {
      api = await this.connectToDevice(ip, username, password);
      
      await api.write('/ip/route/remove', {
        '.id': routeId
      });

      return {
        success: true,
        message: 'Route deleted successfully'
      };
    } catch (error) {
      console.error('Mikrotik Delete Route Error:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Failed to delete route'
      };
    } finally {
      if (api) {
        try {
          await api.close();
        } catch (e) {
          console.error('Error closing API connection:', e.message);
        }
      }
    }
  }

  // Device Info Methods
  async getDeviceInfo(ip, username, password) {
    try {
      const api = await this.connectToDevice(ip, username, password);
      
      const [systemResource, systemIdentity, systemClock] = await Promise.all([
        api.write('/system/resource/print'),
        api.write('/system/identity/print'),
        api.write('/system/clock/print')
      ]);
      
      await api.close();

      const resource = systemResource[0] || {};
      const identity = systemIdentity[0] || {};
      const clock = systemClock[0] || {};

      return {
        identity: identity.name || 'Unknown',
        version: resource.version || 'Unknown',
        architecture: resource['architecture-name'] || 'Unknown',
        board: resource['board-name'] || 'Unknown',
        uptime: resource.uptime || '0s',
        cpu: parseFloat(resource['cpu-load']) || 0,
        memory: {
          total: parseInt(resource['total-memory']) || 0,
          used: parseInt(resource['used-memory']) || 0,
          free: parseInt(resource['free-memory']) || 0
        },
        disk: {
          total: parseInt(resource['total-hdd-space']) || 0,
          used: parseInt(resource['used-hdd-space']) || 0,
          free: parseInt(resource['free-hdd-space']) || 0
        },
        clock: clock.time || new Date().toISOString(),
        date: clock.date || new Date().toISOString().split('T')[0]
      };
    } catch (error) {
      console.error('Error getting device info:', error);
      throw error;
    }
  }

  // Routes Methods
  async getRoutes(ip, username, password) {
    try {
      const api = await this.connectToDevice(ip, username, password);
      
      const routes = await api.write('/ip/route/print');
      
      await api.close();

      const routeData = routes.map(route => ({
        id: route['.id'],
        dstAddress: route['dst-address'] || '0.0.0.0/0',
        gateway: route.gateway || '',
        distance: route.distance || '1',
        scope: route.scope || '',
        targetScope: route['target-scope'] || '',
        routingTable: route['routing-table'] || 'main',
        active: route.active === 'true',
        disabled: route.disabled === 'true',
        comment: route.comment || '',
        ...route
      }));

      return {
        success: true,
        data: { routes: routeData }
      };
    } catch (error) {
      console.error('Error getting routes:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to get routes'
      };
    }
  }

  // DNS Methods
  async getDns(ip, username, password) {
    try {
      const api = await this.connectToDevice(ip, username, password);
      
      // Get DNS settings using /ip/dns/print
      const dnsSettings = await api.write('/ip/dns/print');
      
      await api.close();

      // Format DNS data according to the provided structure
      const dnsData = {
        servers: dnsSettings[0]?.servers || '',
        dynamicServers: dnsSettings[0]?.['dynamic-servers'] || '',
        useDohServer: dnsSettings[0]?.['use-doh-server'] || '',
        verifyDohCert: dnsSettings[0]?.['verify-doh-cert'] === 'yes',
        dohMaxServerConnections: parseInt(dnsSettings[0]?.['doh-max-server-connections']) || 5,
        dohMaxConcurrentQueries: parseInt(dnsSettings[0]?.['doh-max-concurrent-queries']) || 50,
        dohTimeout: dnsSettings[0]?.['doh-timeout'] || '5s',
        allowRemoteRequests: dnsSettings[0]?.['allow-remote-requests'] === 'yes',
        maxUdpPacketSize: parseInt(dnsSettings[0]?.['max-udp-packet-size']) || 4096,
        queryServerTimeout: dnsSettings[0]?.['query-server-timeout'] || '2s',
        queryTotalTimeout: dnsSettings[0]?.['query-total-timeout'] || '10s',
        maxConcurrentQueries: parseInt(dnsSettings[0]?.['max-concurrent-queries']) || 100,
        maxConcurrentTcpSessions: parseInt(dnsSettings[0]?.['max-concurrent-tcp-sessions']) || 20,
        cacheSize: dnsSettings[0]?.['cache-size'] || '2048KiB',
        cacheMaxTtl: dnsSettings[0]?.['cache-max-ttl'] || '1w',
        addressListExtraTime: dnsSettings[0]?.['address-list-extra-time'] || '0s',
        vrf: dnsSettings[0]?.vrf || 'main',
        mdnsRepeatIfaces: dnsSettings[0]?.['mdns-repeat-ifaces'] || '',
        cacheUsed: dnsSettings[0]?.['cache-used'] || ''
      };

      return {
        success: true,
        data: { dns_settings: dnsData }
      };
    } catch (error) {
      console.error('Error getting DNS:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to get DNS settings'
      };
    }
  }

  // Get DNS Static Records
  async getDnsStatic(ip, username, password) {
    try {
      const api = await this.connectToDevice(ip, username, password);
      
      // Get DNS static records using /ip/dns/static/print
      const dnsStatic = await api.write('/ip/dns/static/print');
      
      await api.close();

      // Format DNS static data
      const dnsStaticData = dnsStatic.map((record, index) => ({
        id: index,
        name: record.name || 'N/A',
        address: record.address || 'N/A',
        ttl: record.ttl || 'N/A'
      }));

      return {
        success: true,
        data: { dns_static: dnsStaticData }
      };
    } catch (error) {
      console.error('Error getting DNS static records:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to get DNS static records'
      };
    }
  }

  // DNS Static Records CRUD Methods
  async addDnsStaticRecord(ip, username, password, record) {
    try {
      const api = await this.connectToDevice(ip, username, password);
      
      const command = ['/ip/dns/static/add'];
      if (record.name) command.push(`name=${record.name}`);
      if (record.address) command.push(`address=${record.address}`);
      if (record.ttl) command.push(`ttl=${record.ttl}`);
      if (record.comment) command.push(`comment=${record.comment}`);
      
      await api.write(command);
      await api.close();
      
      return {
        success: true,
        message: 'DNS static record added successfully'
      };
    } catch (error) {
      console.error('Error adding DNS static record:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to add DNS static record'
      };
    }
  }

  async updateDnsStaticRecord(ip, username, password, recordId, record) {
    try {
      const api = await this.connectToDevice(ip, username, password);
      
      const command = ['/ip/dns/static/set', `.id=${recordId}`];
      if (record.name) command.push(`name=${record.name}`);
      if (record.address) command.push(`address=${record.address}`);
      if (record.ttl) command.push(`ttl=${record.ttl}`);
      if (record.comment) command.push(`comment=${record.comment}`);
      
      await api.write(command);
      await api.close();
      
      return {
        success: true,
        message: 'DNS static record updated successfully'
      };
    } catch (error) {
      console.error('Error updating DNS static record:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to update DNS static record'
      };
    }
  }

  async deleteDnsStaticRecord(ip, username, password, recordId) {
    try {
      const api = await this.connectToDevice(ip, username, password);
      
      await api.write(['/ip/dns/static/remove', `.id=${recordId}`]);
      await api.close();
      
      return {
        success: true,
        message: 'DNS static record deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting DNS static record:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to delete DNS static record'
      };
    }
  }

  // DNS Update Method
  async updateDns(ip, username, password, dnsSettings) {
    try {
      const api = await this.connectToDevice(ip, username, password);
      
      // Update DNS settings
      const commands = [];
      
      if (dnsSettings.servers !== undefined) {
        commands.push(['/ip/dns/set', `servers=${dnsSettings.servers}`]);
      }
      
      if (dnsSettings.allowRemoteRequests !== undefined) {
        commands.push(['/ip/dns/set', `allow-remote-requests=${dnsSettings.allowRemoteRequests ? 'yes' : 'no'}`]);
      }
      
      if (dnsSettings.verifyDohCert !== undefined) {
        commands.push(['/ip/dns/set', `verify-doh-cert=${dnsSettings.verifyDohCert ? 'yes' : 'no'}`]);
      }
      
      if (dnsSettings.cacheSize !== undefined) {
        commands.push(['/ip/dns/set', `cache-size=${dnsSettings.cacheSize}`]);
      }
      
      if (dnsSettings.queryServerTimeout !== undefined) {
        commands.push(['/ip/dns/set', `query-server-timeout=${dnsSettings.queryServerTimeout}`]);
      }
      
      if (dnsSettings.queryTotalTimeout !== undefined) {
        commands.push(['/ip/dns/set', `query-total-timeout=${dnsSettings.queryTotalTimeout}`]);
      }
      
      if (dnsSettings.maxConcurrentQueries !== undefined) {
        commands.push(['/ip/dns/set', `max-concurrent-queries=${dnsSettings.maxConcurrentQueries}`]);
      }
      
      if (dnsSettings.maxConcurrentTcpSessions !== undefined) {
        commands.push(['/ip/dns/set', `max-concurrent-tcp-sessions=${dnsSettings.maxConcurrentTcpSessions}`]);
      }
      
      // Execute all commands
      for (const command of commands) {
        await api.write(command);
      }
      
      await api.close();
      
      return {
        success: true,
        message: 'DNS settings updated successfully'
      };
    } catch (error) {
      console.error('Error updating DNS:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to update DNS settings'
      };
    }
  }

  // DHCP Client Methods
  async getDhcpClient(ip, username, password) {
    try {
      const api = await this.connectToDevice(ip, username, password);
      
      const dhcpClients = await api.write('/ip/dhcp-client/print');
      
      await api.close();

      const clientData = dhcpClients.map(client => ({
        id: client['.id'],
        interface: client.interface || '',
        disabled: client.disabled === 'true',
        addDefaultRoute: client['add-default-route'] === 'true',
        defaultRouteDistance: client['default-route-distance'] || '1',
        usePeerDns: client['use-peer-dns'] === 'true',
        usePeerNtp: client['use-peer-ntp'] === 'true',
        comment: client.comment || '',
        ...client
      }));

      return {
        success: true,
        data: { dhcp_clients: clientData }
      };
    } catch (error) {
      console.error('Error getting DHCP client:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to get DHCP clients'
      };
    }
  }

  async getIpAddresses(ip, username, password) {
    try {
      const api = await this.connectToDevice(ip, username, password);
      
      const addresses = await api.write('/ip/address/print');
      
      await api.close();

      const addressData = addresses.map(addr => ({
        id: addr['.id'],
        address: addr.address || '',
        interface: addr.interface || '',
        network: addr.network || '',
        comment: addr.comment || '',
        disabled: addr.disabled === 'true',
        ...addr
      }));

      return {
        success: true,
        data: { addresses: addressData }
      };
    } catch (error) {
      console.error('Error getting IP addresses:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to get IP addresses'
      };
    }
  }

  async addIpAddress(ip, username, password, addressData) {
    try {
      const api = await this.connectToDevice(ip, username, password);
      
      const result = await api.write('/ip/address/add', addressData);
      await api.close();

      return result;
    } catch (error) {
      console.error('Error adding IP address:', error);
      throw error;
    }
  }

  async updateIpAddress(ip, username, password, addressId, addressData) {
    try {
      const api = await this.connectToDevice(ip, username, password);
      
      const result = await api.write('/ip/address/set', [addressId, addressData]);
      await api.close();

      return result;
    } catch (error) {
      console.error('Error updating IP address:', error);
      throw error;
    }
  }

  async deleteIpAddress(ip, username, password, addressId) {
    try {
      const api = await this.connectToDevice(ip, username, password);
      
      const result = await api.write('/ip/address/remove', [addressId]);
      await api.close();

      return result;
    } catch (error) {
      console.error('Error deleting IP address:', error);
      throw error;
    }
  }

  // Firewall Methods
  async getFirewallRules(ip, username, password, type = 'filter') {
    try {
      const api = await this.connectToDevice(ip, username, password);

      const path = `/ip/firewall/${type}/print`;
      const rules = await api.write(path);

      await api.close();

      const ruleData = rules.map((rule, index) => ({
        id: rule['.id'],
        name: rule.comment || `Rule ${index + 1}`,
        action: rule.action || 'accept',
        chain: rule.chain || 'input',
        protocol: rule.protocol || '',
        srcAddress: rule['src-address'] || '',
        dstAddress: rule['dst-address'] || '',
        srcPort: rule['src-port'] || '',
        dstPort: rule['dst-port'] || '',
        comment: rule.comment || '',
        disabled: rule.disabled === 'true',
        log: rule.log === 'true',
        ...rule
      }));

      return {
        success: true,
        data: { rules: ruleData }
      };
    } catch (error) {
      console.error('Error getting firewall rules:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to get firewall rules'
      };
    }
  }

  async getNatRules(ip, username, password) {
    try {
      const api = await this.connectToDevice(ip, username, password);

      const path = '/ip/firewall/nat/print';
      const rules = await api.write(path);

      await api.close();

      const ruleData = rules.map((rule, index) => ({
        id: rule['.id'],
        name: rule.comment || `NAT Rule ${index + 1}`,
        action: rule.action || 'accept',
        chain: rule.chain || 'srcnat',
        protocol: rule.protocol || '',
        srcAddress: rule['src-address'] || '',
        dstAddress: rule['dst-address'] || '',
        srcPort: rule['src-port'] || '',
        dstPort: rule['dst-port'] || '',
        comment: rule.comment || '',
        disabled: rule.disabled === 'true',
        log: rule.log === 'true',
        ...rule
      }));

      return {
        success: true,
        data: { rules: ruleData }
      };
    } catch (error) {
      console.error('Error getting NAT rules:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to get NAT rules'
      };
    }
  }

  async getFirewallRule(routerId, ruleId) {
    try {
      const router = await this.getNasDeviceById(routerId);
      if (!router) {
        throw new Error('Router not found');
      }

      const api = await this.connectToDevice(router.ip_address, router.username, router.password, router.use_ssl);

      // Try to find rule in all firewall types
      const types = ['filter', 'nat', 'mangle', 'raw'];
      for (const type of types) {
        try {
          const path = `/ip/firewall/${type}/print`;
          const rules = await api.write(path);
          const rule = rules.find(r => r['.id'] === ruleId);
          if (rule) {
            await api.close();
            return {
              id: rule['.id'],
              type: type,
              name: rule.comment || `Rule ${rule['.id']}`,
              action: rule.action || 'accept',
              chain: rule.chain || 'input',
              protocol: rule.protocol || '',
              srcAddress: rule['src-address'] || '',
              dstAddress: rule['dst-address'] || '',
              srcPort: rule['src-port'] || '',
              dstPort: rule['dst-port'] || '',
              comment: rule.comment || '',
              disabled: rule.disabled === 'true',
              log: rule.log === 'true',
              ...rule
            };
          }
        } catch (typeError) {
          console.warn(`Error checking ${type} rules:`, typeError.message);
        }
      }

      await api.close();
      return null;
    } catch (error) {
      console.error('Error getting firewall rule:', error);
      throw error;
    }
  }

  async createFirewallRule(routerId, ruleData) {
    try {
      const router = await this.getNasDeviceById(routerId);
      if (!router) {
        throw new Error('Router not found');
      }

      const api = await this.connectToDevice(router.ip_address, router.username, router.password, router.use_ssl);

      const { type = 'filter', ...rule } = ruleData;
      const path = `/ip/firewall/${type}/add`;
      
      const result = await api.write(path, rule);
      await api.close();

      return result;
    } catch (error) {
      console.error('Error creating firewall rule:', error);
      throw error;
    }
  }

  async updateFirewallRule(routerId, ruleId, ruleData) {
    try {
      const router = await this.getNasDeviceById(routerId);
      if (!router) {
        throw new Error('Router not found');
      }

      const api = await this.connectToDevice(router.ip_address, router.username, router.password, router.use_ssl);

      // Find the rule type first
      const types = ['filter', 'nat', 'mangle', 'raw'];
      let ruleType = null;
      
      for (const type of types) {
        try {
          const path = `/ip/firewall/${type}/print`;
          const rules = await api.write(path);
          const rule = rules.find(r => r['.id'] === ruleId);
          if (rule) {
            ruleType = type;
            break;
          }
        } catch (typeError) {
          console.warn(`Error checking ${type} rules:`, typeError.message);
        }
      }

      if (!ruleType) {
        throw new Error('Rule not found');
      }

      const path = `/ip/firewall/${ruleType}/set`;
      const result = await api.write(path, [ruleId, ruleData]);
      await api.close();

      return result;
    } catch (error) {
      console.error('Error updating firewall rule:', error);
      throw error;
    }
  }

  async deleteFirewallRule(routerId, ruleId) {
    try {
      const router = await this.getNasDeviceById(routerId);
      if (!router) {
        throw new Error('Router not found');
      }

      const api = await this.connectToDevice(router.ip_address, router.username, router.password, router.use_ssl);

      // Find the rule type first
      const types = ['filter', 'nat', 'mangle', 'raw'];
      let ruleType = null;
      
      for (const type of types) {
        try {
          const path = `/ip/firewall/${type}/print`;
          const rules = await api.write(path);
          const rule = rules.find(r => r['.id'] === ruleId);
          if (rule) {
            ruleType = type;
            break;
          }
        } catch (typeError) {
          console.warn(`Error checking ${type} rules:`, typeError.message);
        }
      }

      if (!ruleType) {
        throw new Error('Rule not found');
      }

      const path = `/ip/firewall/${ruleType}/remove`;
      const result = await api.write(path, [ruleId]);
      await api.close();

      return result;
    } catch (error) {
      console.error('Error deleting firewall rule:', error);
      throw error;
    }
  }

  async toggleFirewallRule(routerId, ruleId) {
    try {
      const router = await this.getNasDeviceById(routerId);
      if (!router) {
        throw new Error('Router not found');
      }

      const api = await this.connectToDevice(router.ip_address, router.username, router.password, router.use_ssl);

      // Find the rule type first
      const types = ['filter', 'nat', 'mangle', 'raw'];
      let ruleType = null;
      let currentRule = null;
      
      for (const type of types) {
        try {
          const path = `/ip/firewall/${type}/print`;
          const rules = await api.write(path);
          const rule = rules.find(r => r['.id'] === ruleId);
          if (rule) {
            ruleType = type;
            currentRule = rule;
            break;
          }
        } catch (typeError) {
          console.warn(`Error checking ${type} rules:`, typeError.message);
        }
      }

      if (!ruleType || !currentRule) {
        throw new Error('Rule not found');
      }

      const newDisabled = currentRule.disabled === 'true' ? 'false' : 'true';
      const path = `/ip/firewall/${ruleType}/set`;
      const result = await api.write(path, [ruleId, { disabled: newDisabled }]);
      await api.close();

      return {
        id: ruleId,
        type: ruleType,
        disabled: newDisabled === 'true',
        ...result
      };
    } catch (error) {
      console.error('Error toggling firewall rule:', error);
      throw error;
    }
  }

  async getActiveConnections(routerId) {
    try {
      const router = await this.getNasDeviceById(routerId);
      if (!router) {
        throw new Error('Router not found');
      }

      const api = await this.connectToDevice(router.ip_address, router.username, router.password, router.use_ssl);

      const connections = await api.write('/ip/firewall/connection/print');
      await api.close();

      return connections.map(conn => ({
        id: conn['.id'],
        protocol: conn.protocol || '',
        srcAddress: conn['src-address'] || '',
        srcPort: conn['src-port'] || '',
        dstAddress: conn['dst-address'] || '',
        dstPort: conn['dst-port'] || '',
        state: conn.state || '',
        timeout: conn.timeout || '',
        bytes: conn.bytes || '0',
        packets: conn.packets || '0',
        ...conn
      }));
    } catch (error) {
      console.error('Error getting active connections:', error);
      throw error;
    }
  }

  async closeConnection(routerId, connectionId) {
    try {
      const router = await this.getNasDeviceById(routerId);
      if (!router) {
        throw new Error('Router not found');
      }

      const api = await this.connectToDevice(router.ip_address, router.username, router.password, router.use_ssl);

      const result = await api.write('/ip/firewall/connection/remove', [connectionId]);
      await api.close();

      return result;
    } catch (error) {
      console.error('Error closing connection:', error);
      throw error;
    }
  }

  async getFirewallStats(routerId) {
    try {
      const router = await this.getNasDeviceById(routerId);
      if (!router) {
        throw new Error('Router not found');
      }

      const api = await this.connectToDevice(router.ip_address, router.username, router.password, router.use_ssl);

      // Get stats for all firewall types
      const stats = {};
      const types = ['filter', 'nat', 'mangle', 'raw'];

      for (const type of types) {
        try {
          const rules = await api.write(`/ip/firewall/${type}/print`);
          stats[type] = {
            total: rules.length,
            enabled: rules.filter(r => r.disabled !== 'true').length,
            disabled: rules.filter(r => r.disabled === 'true').length
          };
        } catch (typeError) {
          console.warn(`Error getting ${type} stats:`, typeError.message);
          stats[type] = { total: 0, enabled: 0, disabled: 0 };
        }
      }

      // Get connection stats
      try {
        const connections = await api.write('/ip/firewall/connection/print');
        stats.connections = {
          total: connections.length,
          established: connections.filter(c => c.state === 'established').length,
          new: connections.filter(c => c.state === 'new').length,
          related: connections.filter(c => c.state === 'related').length
        };
      } catch (connError) {
        console.warn('Error getting connection stats:', connError.message);
        stats.connections = { total: 0, established: 0, new: 0, related: 0 };
      }

      await api.close();
      return stats;
    } catch (error) {
      console.error('Error getting firewall stats:', error);
      throw error;
    }
  }

  async exportFirewallRules(routerId, type = 'all') {
    try {
      const router = await this.getNasDeviceById(routerId);
      if (!router) {
        throw new Error('Router not found');
      }

      const api = await this.connectToDevice(router.ip_address, router.username, router.password, router.use_ssl);

      const exportData = {
        router: {
          id: routerId,
          name: router.name,
          ip_address: router.ip_address
        },
        exported_at: new Date().toISOString(),
        rules: {}
      };

      const types = type === 'all' ? ['filter', 'nat', 'mangle', 'raw'] : [type];

      for (const ruleType of types) {
        try {
          const rules = await api.write(`/ip/firewall/${ruleType}/print`);
          exportData.rules[ruleType] = rules;
        } catch (typeError) {
          console.warn(`Error exporting ${ruleType} rules:`, typeError.message);
          exportData.rules[ruleType] = [];
        }
      }

      await api.close();
      return exportData;
    } catch (error) {
      console.error('Error exporting firewall rules:', error);
      throw error;
    }
  }

  async importFirewallRules(routerId, rules, replace = false) {
    try {
      const router = await this.getNasDeviceById(routerId);
      if (!router) {
        throw new Error('Router not found');
      }

      const api = await this.connectToDevice(router.ip_address, router.username, router.password, router.use_ssl);

      const results = {
        imported: 0,
        failed: 0,
        errors: []
      };

      // If replace is true, clear existing rules first
      if (replace) {
        const types = ['filter', 'nat', 'mangle', 'raw'];
        for (const type of types) {
          try {
            const existingRules = await api.write(`/ip/firewall/${type}/print`);
            for (const rule of existingRules) {
              await api.write(`/ip/firewall/${type}/remove`, [rule['.id']]);
            }
          } catch (clearError) {
            console.warn(`Error clearing ${type} rules:`, clearError.message);
          }
        }
      }

      // Import rules
      for (const [ruleType, ruleList] of Object.entries(rules)) {
        if (Array.isArray(ruleList)) {
          for (const rule of ruleList) {
            try {
              // Remove .id field as it will be auto-generated
              const { '.id': id, ...ruleData } = rule;
              await api.write(`/ip/firewall/${ruleType}/add`, ruleData);
              results.imported++;
            } catch (ruleError) {
              results.failed++;
              results.errors.push({
                type: ruleType,
                rule: rule,
                error: ruleError.message
              });
            }
          }
        }
      }

      await api.close();
      return results;
    } catch (error) {
      console.error('Error importing firewall rules:', error);
      throw error;
    }
  }

  // Get Mikrotik Info (interfaces, system info, etc.)
  async getMikrotikInfo(ip, username, password) {
    try {
      const api = await this.connectToDevice(ip, username, password);
      
      // Get interfaces
      const interfaces = await api.write('/interface/print');
      
          // Get system info
          const systemResource = await api.write('/system/resource/print');
          const systemIdentity = await api.write('/system/identity/print');
          const systemClock = await api.write('/system/clock/print');
      
      await api.close();

      // Format interfaces data
      const interfacesData = interfaces.map(iface => ({
        id: iface['.id'],
        name: iface.name || '',
        type: iface.type || '',
        mtu: iface.mtu || '',
        macAddress: iface['mac-address'] || '',
        comment: iface.comment || '',
        disabled: iface.disabled === 'true',
        running: iface.running === 'true',
        ...iface
      }));

      // Format system info
      const systemInfo = {
        resource: systemResource[0] || {},
        identity: systemIdentity[0] || {},
        clock: systemClock[0] || {},
        memory: {
          total: parseInt(systemResource[0]?.['total-memory']) || 0,
          used: parseInt(systemResource[0]?.['total-memory']) - parseInt(systemResource[0]?.['free-memory']) || 0,
          free: parseInt(systemResource[0]?.['free-memory']) || 0
        },
        disk: {
          total: parseInt(systemResource[0]?.['total-hdd-space']) || 0,
          used: parseInt(systemResource[0]?.['total-hdd-space']) - parseInt(systemResource[0]?.['free-hdd-space']) || 0,
          free: parseInt(systemResource[0]?.['free-hdd-space']) || 0
        }
      };

      return {
        success: true,
        data: {
          interfaces: {
            interfaces: interfacesData
          },
          system: systemInfo,
          pppoe: {
            active_users: interfacesData.filter(iface => iface.type === 'pppoe-in' && iface.running === 'true').length,
            total_users: interfacesData.filter(iface => iface.type === 'pppoe-in').length
          }
        }
      };
    } catch (error) {
      console.error('Error getting Mikrotik info:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to get Mikrotik info'
      };
    }
  }

  // Get interface traffic data for charts - Real-time timeline
  async getInterfaceTraffic(deviceId, interfaceName = null) {
    try {
      // Get device credentials
      const device = await this.getNasDeviceById(deviceId);
      if (!device) {
        throw new Error('Device not found');
      }

      const api = await this.connectToDevice(device.nasname, device.ruser, device.naspassword);
      
      // Get interface statistics
      const interfaces = await api.write('/interface/print');
      
      await api.close();

      let filteredInterfaces = interfaces;
      
      // If specific interface requested, filter for that interface
      if (interfaceName) {
        filteredInterfaces = interfaces.filter(iface => iface.name === interfaceName);
        if (filteredInterfaces.length === 0) {
          throw new Error(`Interface '${interfaceName}' not found`);
        }
      }

      const now = new Date();
      const currentTrafficData = [];

      filteredInterfaces.forEach(iface => {
        const rxBytes = parseInt(iface['rx-byte'] || 0);
        const txBytes = parseInt(iface['tx-byte'] || 0);
        
        currentTrafficData.push({
          name: iface.name || 'Unknown',
          rxBytes: rxBytes,
          txBytes: txBytes,
          rxPackets: parseInt(iface['rx-packet'] || 0),
          txPackets: parseInt(iface['tx-packet'] || 0)
        });

        // Store traffic data with timestamp for timeline
        if (interfaceName) {
          const key = `${deviceId}:${interfaceName}`;
          if (!interfaceTrafficHistory.has(key)) {
            interfaceTrafficHistory.set(key, []);
          }
          
          const history = interfaceTrafficHistory.get(key);
          
          // Calculate byte difference from previous measurement
          let rxDiff = 0;
          let txDiff = 0;
          
          if (history.length > 0) {
            const lastEntry = history[history.length - 1];
            const timeDiff = (now - lastEntry.timestamp) / 1000; // seconds
            
            // Calculate bytes per second
            rxDiff = Math.max(0, (rxBytes - lastEntry.rxBytes) / timeDiff);
            txDiff = Math.max(0, (txBytes - lastEntry.txBytes) / timeDiff);
          }
          
          history.push({
            timestamp: now,
            rxBytes: rxBytes,
            txBytes: txBytes,
            totalBytes: rxBytes + txBytes,
            rxBytesPerSec: rxDiff,
            txBytesPerSec: txDiff
          });

          // Keep only last 72 data points (6 minutes with 5-second intervals)
          if (history.length > 72) {
            history.shift();
          }
        }
      });

      // Generate real-time timeline data
      const timelineData = this.generateRealtimeTimeline(deviceId, interfaceName);

      return {
        success: true,
        data: {
          timelineData: timelineData,
          currentTraffic: currentTrafficData,
          totalTraffic: {
            rx: currentTrafficData.reduce((sum, iface) => sum + iface.rxBytes, 0),
            tx: currentTrafficData.reduce((sum, iface) => sum + iface.txBytes, 0)
          }
        }
      };
    } catch (error) {
      console.error('Error getting interface traffic:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to get interface traffic data'
      };
    }
  }

  // Get interfaces for a specific NAS device
  async getInterfaces(ip, username, password) {
    try {
      const api = await this.connectToDevice(ip, username, password);
      
      // Get interface list
      const interfaces = await api.write('/interface/print');
      
      await api.close();

      return interfaces.map(iface => ({
        name: iface.name || 'Unknown',
        type: iface.type || '',
        mtu: iface.mtu || '',
        macAddress: iface['mac-address'] || '',
        running: iface.running || false,
        disabled: iface.disabled || false
      }));
    } catch (error) {
      console.error('Error getting interfaces:', error);
      throw error;
    }
  }

  // Generate realistic hourly traffic data
  generateHourlyTrafficData(baseTraffic) {
    const hours = [];
    const traffic = [];
    
    for (let i = 0; i < 24; i++) {
      hours.push(`${i.toString().padStart(2, '0')}:00`);
      
      // Generate realistic traffic pattern
      let trafficValue;
      if (i >= 22 || i <= 6) {
        // Night time - low traffic
        trafficValue = baseTraffic * 0.1 + Math.random() * 20;
      } else if (i >= 8 && i <= 18) {
        // Business hours - high traffic
        trafficValue = baseTraffic * 0.8 + Math.random() * 100;
      } else {
        // Evening - medium traffic
        trafficValue = baseTraffic * 0.4 + Math.random() * 50;
      }
      
      traffic.push(Math.round(trafficValue));
    }
    
    return { hours, traffic };
  }

  // Generate real-time timeline data from stored traffic history
  generateRealtimeTimeline(deviceId, interfaceName) {
    const key = `${deviceId}:${interfaceName}`;
    const history = interfaceTrafficHistory.get(key) || [];
    
    if (history.length === 0) {
      // Return empty timeline if no data
      return {
        labels: [],
        rxData: [],
        txData: [],
        totalData: []
      };
    }

    const labels = [];
    const rxData = [];
    const txData = [];
    const totalData = [];

    history.forEach((entry, index) => {
      // Format timestamp as HH:MM:SS
      const time = entry.timestamp.toLocaleTimeString('tr-TR', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      
      labels.push(time);
      
      // Convert bytes per second to Mbps for better visualization
      const rxMbps = (entry.rxBytesPerSec * 8) / (1024 * 1024); // Convert bytes/sec to Mbps
      const txMbps = (entry.txBytesPerSec * 8) / (1024 * 1024);
      const totalMbps = rxMbps + txMbps;
      
      rxData.push(Math.round(rxMbps * 100) / 100); // Round to 2 decimal places
      txData.push(Math.round(txMbps * 100) / 100);
      totalData.push(Math.round(totalMbps * 100) / 100);
    });

    return {
      labels,
      rxData,
      txData,
      totalData
    };
  }

  // PPP Methods
  async getPppoeSecrets(deviceId) {
    try {
      const device = await this.getNasDeviceById(deviceId);
      if (!device) {
        return {
          success: false,
          error: 'NAS device not found',
          message: 'NAS device not found'
        };
      }

      const api = await this.connectToDevice(device.nasname, device.ruser, device.naspassword);
      
      const secrets = await api.write('/ppp/secret/print');
      
      await api.close();

      const secretsData = secrets.map(secret => ({
        id: secret['.id'],
        name: secret.name || '',
        password: secret.password || '',
        service: secret.service || 'any',
        profile: secret.profile || '',
        localAddress: secret['local-address'] || '',
        remoteAddress: secret['remote-address'] || '',
        routes: secret.routes || '',
        comment: secret.comment || '',
        disabled: secret.disabled,
        ...secret
      }));

      return {
        success: true,
        data: { secrets: secretsData }
      };
    } catch (error) {
      console.error('Error getting PPPoE secrets:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to get PPPoE secrets'
      };
    }
  }

  async createPppoeSecret(deviceId, secretData) {
    try {
      const device = await this.getNasDeviceById(deviceId);
      if (!device) {
        return {
          success: false,
          error: 'NAS device not found',
          message: 'NAS device not found'
        };
      }

      const api = await this.connectToDevice(device.nasname, device.ruser, device.naspassword);
      
      const command = ['/ppp/secret/add'];
      if (secretData.name) command.push(`=name=${secretData.name}`);
      if (secretData.password) command.push(`=password=${secretData.password}`);
      if (secretData.service) command.push(`=service=${secretData.service}`);
      if (secretData.profile) command.push(`=profile=${secretData.profile}`);
      if (secretData.localAddress) command.push(`=local-address=${secretData.localAddress}`);
      if (secretData.remoteAddress) command.push(`=remote-address=${secretData.remoteAddress}`);
      if (secretData.routes) command.push(`=routes=${secretData.routes}`);
      if (secretData.comment) command.push(`=comment=${secretData.comment}`);
      if (secretData.disabled !== undefined) command.push(`=disabled=${secretData.disabled ? 'yes' : 'no'}`);
      
      const result = await api.write(command.join(' '));
      
      await api.close();

      return {
        success: true,
        data: { secret: result },
        message: 'PPPoE secret created successfully'
      };
    } catch (error) {
      console.error('Error creating PPPoE secret:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to create PPPoE secret'
      };
    }
  }

  async updatePppoeSecret(deviceId, secretId, secretData) {
    try {
      const device = await this.getNasDeviceById(deviceId);
      if (!device) {
        return {
          success: false,
          error: 'NAS device not found',
          message: 'NAS device not found'
        };
      }

      const api = await this.connectToDevice(device.nasname, device.ruser, device.naspassword);
      
      const command = [`/ppp/secret/set`, `=.id=${secretId}`];
      if (secretData.name !== undefined) command.push(`=name=${secretData.name}`);
      if (secretData.password !== undefined) command.push(`=password=${secretData.password}`);
      if (secretData.service !== undefined) command.push(`=service=${secretData.service}`);
      if (secretData.profile !== undefined) command.push(`=profile=${secretData.profile}`);
      if (secretData.localAddress !== undefined) command.push(`=local-address=${secretData.localAddress}`);
      if (secretData.remoteAddress !== undefined) command.push(`=remote-address=${secretData.remoteAddress}`);
      if (secretData.routes !== undefined) command.push(`=routes=${secretData.routes}`);
      if (secretData.comment !== undefined) command.push(`=comment=${secretData.comment}`);
      if (secretData.disabled !== undefined) command.push(`=disabled=${secretData.disabled ? 'yes' : 'no'}`);
      
      const result = await api.write(command.join(' '));
      
      await api.close();

      return {
        success: true,
        data: { secret: result },
        message: 'PPPoE secret updated successfully'
      };
    } catch (error) {
      console.error('Error updating PPPoE secret:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to update PPPoE secret'
      };
    }
  }

  async deletePppoeSecret(deviceId, secretId) {
    try {
      const device = await this.getNasDeviceById(deviceId);
      if (!device) {
        return {
          success: false,
          error: 'NAS device not found',
          message: 'NAS device not found'
        };
      }

      const api = await this.connectToDevice(device.nasname, device.ruser, device.naspassword);
      
      const result = await api.write(`/ppp/secret/remove =.id=${secretId}`);
      
      await api.close();

      return {
        success: true,
        data: { result },
        message: 'PPPoE secret deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting PPPoE secret:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to delete PPPoE secret'
      };
    }
  }

  async togglePppoeSecret(deviceId, secretId, disabled) {
    try {
      const device = await this.getNasDeviceById(deviceId);
      if (!device) {
        return {
          success: false,
          error: 'NAS device not found',
          message: 'NAS device not found'
        };
      }

      const api = await this.connectToDevice(device.nasname, device.ruser, device.naspassword);
      
      const result = await api.write(`/ppp/secret/set =.id=${secretId} =disabled=${disabled ? 'yes' : 'no'}`);
      
      await api.close();

      return {
        success: true,
        data: { result },
        message: `PPPoE secret ${disabled ? 'disabled' : 'enabled'} successfully`
      };
    } catch (error) {
      console.error('Error toggling PPPoE secret:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to toggle PPPoE secret'
      };
    }
  }

  async getPppProfiles(deviceId) {
    try {
      const device = await this.getNasDeviceById(deviceId);
      if (!device) {
        return {
          success: false,
          error: 'NAS device not found',
          message: 'NAS device not found'
        };
      }

      const api = await this.connectToDevice(device.nasname, device.ruser, device.naspassword);
      
      const profiles = await api.write('/ppp/profile/print');
      
      await api.close();

      const profilesData = profiles.map(profile => ({
        id: profile['.id'],
        name: profile.name || '',
        localAddress: profile['local-address'] || '',
        remoteAddress: profile['remote-address'] || '',
        dnsServer: profile['dns-server'] || '',
        useEncryption: profile['use-encryption'] === 'yes',
        useCompression: profile['use-compression'] === 'yes',
        useVjCompression: profile['use-vj-compression'] === 'yes',
        onlyOne: profile['only-one'] === 'yes',
        changeTcpMss: profile['change-tcp-mss'] === 'yes',
        useUpnp: profile['use-upnp'] === 'yes',
        addressList: profile['address-list'] || '',
        comment: profile.comment || '',
        ...profile
      }));

      return {
        success: true,
        data: { pppProfiles: profilesData }
      };
    } catch (error) {
      console.error('Error getting PPP profiles:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to get PPP profiles'
      };
    }
  }

  async getActivePppSessions(deviceId) {
    try {
      const device = await this.getNasDeviceById(deviceId);
      if (!device) {
        return {
          success: false,
          error: 'NAS device not found',
          message: 'NAS device not found'
        };
      }

      const api = await this.connectToDevice(device.nasname, device.ruser, device.naspassword);
      
      const sessions = await api.write('/ppp/active/print');
      
      await api.close();

      const sessionsData = sessions.map(session => ({
        id: session['.id'],
        name: session.name || '',
        address: session.address || '',
        uptime: session.uptime || '',
        encoding: session.encoding || '',
        sessionId: session['session-id'] || '',
        service: session.service || '',
        profile: session.proment || '',
        ...session
      }));

      return {
        success: true,
        data: { activePppSessions: sessionsData }
      };
    } catch (error) {
      console.error('Error getting active PPP sessions:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to get active PPP sessions'
      };
    }
  }

  async getNeighborEntries(deviceId) {
    try {
      const device = await this.getNasDeviceById(deviceId);
      if (!device) {
        return {
          success: false,
          error: 'NAS device not found',
          message: 'NAS device not found'
        };
      }

      const api = await this.connectToDevice(device.nasname, device.ruser, device.naspassword);
      
      const neighbors = await api.write('/ip/neighbor/print');
      
      await api.close();
      
      return {
        success: true,
        data: {
          neighbor_entries: neighbors || []
        }
      };
    } catch (error) {
      console.error('Error getting neighbor entries:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to get neighbor entries'
      };
    }
  }
}

module.exports = new MikrotikService();
