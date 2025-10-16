const express = require('express');
const router = express.Router();
const MikrotikService = require('../services/MikrotikService');

// Get all firewall rules
router.get('/rules', async (req, res) => {
  try {
    const { type = 'filter', routerId } = req.query;
    
    if (!routerId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Router ID is required' 
      });
    }

    const rules = await MikrotikService.getFirewallRules(routerId, type);
    
    res.json({
      success: true,
      data: rules,
      count: rules.length
    });
  } catch (error) {
    console.error('Error fetching firewall rules:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch firewall rules',
      error: error.message
    });
  }
});

// Get specific firewall rule
router.get('/rules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { routerId } = req.query;
    
    if (!routerId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Router ID is required' 
      });
    }

    const rule = await MikrotikService.getFirewallRule(routerId, id);
    
    if (!rule) {
      return res.status(404).json({
        success: false,
        message: 'Firewall rule not found'
      });
    }

    res.json({
      success: true,
      data: rule
    });
  } catch (error) {
    console.error('Error fetching firewall rule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch firewall rule',
      error: error.message
    });
  }
});

// Create new firewall rule
router.post('/rules', async (req, res) => {
  try {
    const { routerId, ...ruleData } = req.body;
    
    if (!routerId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Router ID is required' 
      });
    }

    const newRule = await MikrotikService.createFirewallRule(routerId, ruleData);
    
    res.status(201).json({
      success: true,
      data: newRule,
      message: 'Firewall rule created successfully'
    });
  } catch (error) {
    console.error('Error creating firewall rule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create firewall rule',
      error: error.message
    });
  }
});

// Update firewall rule
router.put('/rules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { routerId, ...ruleData } = req.body;
    
    if (!routerId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Router ID is required' 
      });
    }

    const updatedRule = await MikrotikService.updateFirewallRule(routerId, id, ruleData);
    
    res.json({
      success: true,
      data: updatedRule,
      message: 'Firewall rule updated successfully'
    });
  } catch (error) {
    console.error('Error updating firewall rule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update firewall rule',
      error: error.message
    });
  }
});

// Delete firewall rule
router.delete('/rules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { routerId } = req.query;
    
    if (!routerId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Router ID is required' 
      });
    }

    await MikrotikService.deleteFirewallRule(routerId, id);
    
    res.json({
      success: true,
      message: 'Firewall rule deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting firewall rule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete firewall rule',
      error: error.message
    });
  }
});

// Toggle firewall rule (enable/disable)
router.patch('/rules/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const { routerId } = req.body;
    
    if (!routerId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Router ID is required' 
      });
    }

    const updatedRule = await MikrotikService.toggleFirewallRule(routerId, id);
    
    res.json({
      success: true,
      data: updatedRule,
      message: 'Firewall rule toggled successfully'
    });
  } catch (error) {
    console.error('Error toggling firewall rule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle firewall rule',
      error: error.message
    });
  }
});

// Get active connections
router.get('/connections', async (req, res) => {
  try {
    const { routerId } = req.query;
    
    if (!routerId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Router ID is required' 
      });
    }

    const connections = await MikrotikService.getActiveConnections(routerId);
    
    res.json({
      success: true,
      data: connections,
      count: connections.length
    });
  } catch (error) {
    console.error('Error fetching connections:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch connections',
      error: error.message
    });
  }
});

// Close specific connection
router.delete('/connections/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { routerId } = req.query;
    
    if (!routerId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Router ID is required' 
      });
    }

    await MikrotikService.closeConnection(routerId, id);
    
    res.json({
      success: true,
      message: 'Connection closed successfully'
    });
  } catch (error) {
    console.error('Error closing connection:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to close connection',
      error: error.message
    });
  }
});

// Get firewall statistics
router.get('/stats', async (req, res) => {
  try {
    const { routerId } = req.query;
    
    if (!routerId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Router ID is required' 
      });
    }

    const stats = await MikrotikService.getFirewallStats(routerId);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching firewall stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch firewall statistics',
      error: error.message
    });
  }
});

// Export firewall rules
router.get('/export', async (req, res) => {
  try {
    const { routerId, type = 'all' } = req.query;
    
    if (!routerId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Router ID is required' 
      });
    }

    const exportData = await MikrotikService.exportFirewallRules(routerId, type);
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="firewall-rules-${routerId}-${Date.now()}.json"`);
    res.json(exportData);
  } catch (error) {
    console.error('Error exporting firewall rules:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export firewall rules',
      error: error.message
    });
  }
});

// Import firewall rules
router.post('/import', async (req, res) => {
  try {
    const { routerId, rules, replace = false } = req.body;
    
    if (!routerId || !rules) {
      return res.status(400).json({ 
        success: false, 
        message: 'Router ID and rules data are required' 
      });
    }

    const result = await MikrotikService.importFirewallRules(routerId, rules, replace);
    
    res.json({
      success: true,
      data: result,
      message: 'Firewall rules imported successfully'
    });
  } catch (error) {
    console.error('Error importing firewall rules:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to import firewall rules',
      error: error.message
    });
  }
});

// Get common service ports
router.get('/services', async (req, res) => {
  try {
    const services = [
      { name: 'SSH', port: '22', protocol: 'tcp', description: 'Secure Shell' },
      { name: 'HTTP', port: '80', protocol: 'tcp', description: 'Hypertext Transfer Protocol' },
      { name: 'HTTPS', port: '443', protocol: 'tcp', description: 'HTTP Secure' },
      { name: 'DNS', port: '53', protocol: 'udp', description: 'Domain Name System' },
      { name: 'FTP', port: '21', protocol: 'tcp', description: 'File Transfer Protocol' },
      { name: 'SMTP', port: '25', protocol: 'tcp', description: 'Simple Mail Transfer Protocol' },
      { name: 'POP3', port: '110', protocol: 'tcp', description: 'Post Office Protocol v3' },
      { name: 'IMAP', port: '143', protocol: 'tcp', description: 'Internet Message Access Protocol' },
      { name: 'SNMP', port: '161', protocol: 'udp', description: 'Simple Network Management Protocol' },
      { name: 'NTP', port: '123', protocol: 'udp', description: 'Network Time Protocol' },
      { name: 'LDAP', port: '389', protocol: 'tcp', description: 'Lightweight Directory Access Protocol' },
      { name: 'SMB', port: '445', protocol: 'tcp', description: 'Server Message Block' },
      { name: 'RDP', port: '3389', protocol: 'tcp', description: 'Remote Desktop Protocol' },
      { name: 'VNC', port: '5900', protocol: 'tcp', description: 'Virtual Network Computing' },
      { name: 'MySQL', port: '3306', protocol: 'tcp', description: 'MySQL Database' },
      { name: 'PostgreSQL', port: '5432', protocol: 'tcp', description: 'PostgreSQL Database' }
    ];

    res.json({
      success: true,
      data: services,
      count: services.length
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch services',
      error: error.message
    });
  }
});

module.exports = router;
