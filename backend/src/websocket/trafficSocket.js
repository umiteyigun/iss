const WebSocket = require('ws');
const MikrotikService = require('../services/MikrotikService');

class TrafficWebSocket {
  constructor(server) {
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws/traffic'
    });
    
    this.activeConnections = new Map(); // deviceId:interfaceName -> Set of WebSocket connections
    this.monitoringInterval = null;
    this.isMonitoring = false;
    
    this.setupWebSocketServer();
  }

  setupWebSocketServer() {
    console.log('🔧 Setting up WebSocket server on path /ws/traffic');
    
    this.wss.on('error', (error) => {
      console.error('❌ WebSocket server error:', error);
    });
    
    this.wss.on('connection', (ws, req) => {
      console.log('🔌 New WebSocket connection established');
      console.log('🔍 Connection details:', req.url, req.headers);
      
      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message);
          
          switch (data.type) {
            case 'start_monitoring':
              await this.startMonitoring(ws, data.deviceId, data.interfaceName);
              break;
            case 'stop_monitoring':
              this.stopMonitoring(ws);
              break;
            case 'ping':
              ws.send(JSON.stringify({ type: 'pong' }));
              break;
          }
        } catch (error) {
          console.error('WebSocket message error:', error);
          ws.send(JSON.stringify({ 
            type: 'error', 
            message: 'Invalid message format' 
          }));
        }
      });

      ws.on('close', () => {
        console.log('🔌 WebSocket connection closed');
        this.removeConnection(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.removeConnection(ws);
      });

      // Send initial connection confirmation
      ws.send(JSON.stringify({ 
        type: 'connected',
        message: 'WebSocket connected successfully'
      }));
    });
  }

  async startMonitoring(ws, deviceId, interfaceName) {
    const key = `${deviceId}:${interfaceName}`;
    
    // Add connection to active monitoring
    if (!this.activeConnections.has(key)) {
      this.activeConnections.set(key, new Set());
    }
    this.activeConnections.get(key).add(ws);
    
    console.log(`📊 Started monitoring ${key} for ${this.activeConnections.get(key).size} clients`);
    
    // Start monitoring interval if not already running
    if (!this.isMonitoring) {
      this.startMonitoringInterval();
    }

    // Send initial data
    try {
      const trafficData = await MikrotikService.getInterfaceTraffic(deviceId, interfaceName);
      ws.send(JSON.stringify({
        type: 'traffic_data',
        data: trafficData.data
      }));
    } catch (error) {
      console.error('Error getting initial traffic data:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to get initial traffic data'
      }));
    }
  }

  stopMonitoring(ws) {
    this.removeConnection(ws);
    
    // If no more connections, stop monitoring interval
    if (this.activeConnections.size === 0) {
      this.stopMonitoringInterval();
    }
  }

  removeConnection(ws) {
    // Remove connection from all monitoring groups
    for (const [key, connections] of this.activeConnections.entries()) {
      connections.delete(ws);
      if (connections.size === 0) {
        this.activeConnections.delete(key);
        console.log(`📊 Stopped monitoring ${key}`);
      }
    }

    // If no more connections, stop monitoring interval
    if (this.activeConnections.size === 0) {
      this.stopMonitoringInterval();
    }
  }

  startMonitoringInterval() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('🔄 Started traffic monitoring interval (1 second)');
    
    this.monitoringInterval = setInterval(async () => {
      await this.broadcastTrafficData();
    }, 1000);
  }

  stopMonitoringInterval() {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    console.log('⏹️ Stopped traffic monitoring interval');
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  async broadcastTrafficData() {
    if (this.activeConnections.size === 0) return;

    const promises = [];
    
    for (const [key, connections] of this.activeConnections.entries()) {
      const [deviceId, interfaceName] = key.split(':');
      
      promises.push(
        this.getTrafficDataForInterface(deviceId, interfaceName, connections)
      );
    }

    await Promise.all(promises);
  }

  async getTrafficDataForInterface(deviceId, interfaceName, connections) {
    try {
      const trafficData = await MikrotikService.getInterfaceTraffic(deviceId, interfaceName);
      
      if (trafficData.success) {
        const message = JSON.stringify({
          type: 'traffic_data',
          data: trafficData.data,
          timestamp: new Date().toISOString()
        });

        // Send to all connections monitoring this interface
        connections.forEach(ws => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(message);
          } else {
            // Remove dead connections
            connections.delete(ws);
          }
        });
      }

    } catch (error) {
      const errorMessage = JSON.stringify({
        type: 'error',
        message: `Failed to get traffic data for ${interfaceName}`,
        timestamp: new Date().toISOString()
      });

      connections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(errorMessage);
        }
      });
    }
  }

  // Get current monitoring status
  getStatus() {
    return {
      isMonitoring: this.isMonitoring,
      activeConnections: this.activeConnections.size,
      monitoredInterfaces: Array.from(this.activeConnections.keys())
    };
  }
}

module.exports = TrafficWebSocket;
