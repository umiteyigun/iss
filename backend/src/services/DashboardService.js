const { Radcheck, Radacct, UsersInfo, NasDevice, Member, Tenant } = require('../models');
const { Op } = require('sequelize');

class DashboardService {
  /**
   * Get dashboard statistics for a specific tenant
   * @param {number} tenantId - Tenant ID (null for super admin)
   * @returns {Object} Dashboard statistics
   */
  async getDashboardStats(tenantId) {
    try {
      const stats = {};
      // Get user statistics
      const userStats = await this.getUserStats(tenantId);
      stats.totalUsers = userStats.total;
      stats.activeUsers = userStats.active;
      stats.expiredUsers = userStats.expired;
      stats.onlineUsers = userStats.online;


      // Get NAS statistics
      const nasStats = await this.getNasStats(tenantId);
      stats.totalNas = nasStats.total;
      stats.onlineNas = nasStats.online;

      // Get member statistics
      const memberStats = await this.getMemberStats(tenantId);
      stats.totalMembers = memberStats.total;

      // Get tenant statistics (for super admin)
      if (!tenantId) {
        const tenantStats = await this.getTenantStats();
        stats.totalTenants = tenantStats.total;
        stats.activeTenants = tenantStats.active;
      }

      return stats;
    } catch (error) {
      console.error('Dashboard stats error:', error);
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(tenantId) {
    try {
      const whereClause = tenantId ? { tenant_id: tenantId } : {};

      // Total users (from radcheck with Cleartext-Password)
      const totalUsers = await Radcheck.count({
        where: { 
          attribute: 'Cleartext-Password',
          ...whereClause
        }
      });

      // Online users (from radacct where acctstoptime is null)
      // We need to join with radcheck to filter by tenant
      const onlineUsersQuery = `
        SELECT COUNT(DISTINCT ra.username) as count
        FROM radacct ra
        INNER JOIN radcheck rc ON ra.username = rc.username
        WHERE ra.acctstoptime IS NULL 
        AND rc.attribute = 'Cleartext-password'
        ${tenantId ? 'AND rc.tenant_id = :tenantId' : ''}
      `;
      
      const onlineUsersResult = await Radcheck.sequelize.query(onlineUsersQuery, {
        replacements: tenantId ? { tenantId } : {},
        type: Radcheck.sequelize.QueryTypes.SELECT
      });
      const onlineUsers = onlineUsersResult[0]?.count || 0;

      // Active users (with valid expiration)
      const activeUsers = await Radcheck.count({
        where: {
          attribute: 'Expiration',
          value: {
            [Op.gt]: new Date()
          },
          ...whereClause
        },
        distinct: true,
        col: 'username'
      });

      // Expired users
      const expiredUsers = await Radcheck.count({
        where: {
          attribute: 'Expiration',
          value: {
            [Op.lte]: new Date()
          },
          ...whereClause
        },
        distinct: true,
        col: 'username'
      });

      return {
        total: totalUsers,
        active: activeUsers,
        expired: expiredUsers,
        online: onlineUsers
      };
    } catch (error) {
      console.error('User stats error:', error);
      return { total: 0, active: 0, expired: 0, online: 0 };
    }
  }

  /**
   * Get user status for charts (tenant-based)
   */
  async getUserStatus(tenantId) {
    try {
      const whereClause = tenantId ? { tenant_id: tenantId } : {};

      // Get total users count
      const totalUsers = await Radcheck.count({
        where: {
          attribute: 'Cleartext-password',
          ...whereClause
        }
      });

      // Get online users count (from active sessions)
      const onlineUsersQuery = `
        SELECT COUNT(DISTINCT ra.username) as count
        FROM radacct ra
        INNER JOIN radcheck rc ON ra.username = rc.username
        WHERE ra.acctstoptime IS NULL 
        AND rc.attribute = 'Cleartext-password'
        ${tenantId ? 'AND rc.tenant_id = :tenantId' : ''}
      `;
      
      const onlineUsersResult = await Radcheck.sequelize.query(onlineUsersQuery, {
        replacements: tenantId ? { tenantId } : {},
        type: Radcheck.sequelize.QueryTypes.SELECT
      });
      const onlineUsers = onlineUsersResult[0]?.count || 0;

      // Calculate offline users
      const offlineUsers = Math.max(0, totalUsers - onlineUsers);

      return {
        online: onlineUsers,
        offline: offlineUsers,
        total: totalUsers
      };
    } catch (error) {
      console.error('User status error:', error);
      throw error;
    }
  }


  /**
   * Get NAS statistics
   */
  async getNasStats(tenantId) {
    try {
      const whereClause = tenantId ? { tenant_id: tenantId } : {};

      const totalNas = await NasDevice.count({ where: whereClause });
      const onlineNas = await NasDevice.count({
        where: { ...whereClause, status: 'active' }
      });

      return {
        total: totalNas,
        online: onlineNas
      };
    } catch (error) {
      console.error('NAS stats error:', error);
      return { total: 0, online: 0 };
    }
  }

  /**
   * Get member statistics
   */
  async getMemberStats(tenantId) {
    try {
      const whereClause = tenantId ? { tenant_id: tenantId } : {};

      const totalMembers = await Member.count({ where: whereClause });

      return {
        total: totalMembers
      };
    } catch (error) {
      console.error('Member stats error:', error);
      return { total: 0 };
    }
  }

  /**
   * Get tenant statistics (super admin only)
   */
  async getTenantStats() {
    try {
      const totalTenants = await Tenant.count();
      const activeTenants = await Tenant.count({
        where: { status: 'active' }
      });

      return {
        total: totalTenants,
        active: activeTenants
      };
    } catch (error) {
      console.error('Tenant stats error:', error);
      return { total: 0, active: 0 };
    }
  }



  /**
   * Get network traffic data for charts
   */
  async getNetworkTraffic(tenantId, nasDeviceId = null, interfaceName = null) {
    try {
      // If specific NAS device and interface are requested
      if (nasDeviceId && interfaceName) {
        const nasDevice = await NasDevice.findByPk(nasDeviceId);
        if (!nasDevice) {
          throw new Error('NAS device not found');
        }

        const MikrotikService = require('./MikrotikService');
        const mikrotikService = MikrotikService;
        
        const trafficData = await mikrotikService.getInterfaceTraffic(
          nasDeviceId,
          interfaceName
        );

        return trafficData;
      }

      // Default behavior: get all NAS devices for the tenant
      const whereClause = tenantId ? { tenant_id: tenantId } : {};
      const nasDevices = await NasDevice.findAll({
        where: whereClause,
        attributes: ['id', 'nasname', 'ruser', 'naspassword', 'status']
      });

      // Filter active devices or use all if no status field
      const activeDevices = nasDevices.filter(d => d.status === 'active' || !d.status);
      
      if (activeDevices.length === 0) {
        return {
          success: true,
          data: {
            hourlyTraffic: this.generateMockTrafficData(),
            interfaceStats: []
          }
        };
      }

      // Get traffic data from first active NAS device
      const nasDevice = activeDevices[0];
      
      const MikrotikService = require('./MikrotikService');
      const mikrotikService = MikrotikService;
      
      const trafficData = await mikrotikService.getInterfaceTraffic(
        nasDevice.id
      );

      return trafficData;
    } catch (error) {
      console.error('Network traffic error:', error);
      // Return mock data if real data fails
      return {
        success: true,
        data: {
          hourlyTraffic: this.generateMockTrafficData(),
          interfaceStats: []
        }
      };
    }
  }

  /**
   * Generate mock traffic data for demo
   */
  generateMockTrafficData() {
    const hours = [];
    const traffic = [];
    
    for (let i = 0; i < 24; i++) {
      hours.push(`${i.toString().padStart(2, '0')}:00`);
      // Generate realistic traffic pattern (higher during business hours)
      const baseTraffic = 50;
      const businessHoursMultiplier = (i >= 8 && i <= 18) ? 1.5 : 0.7;
      const randomVariation = Math.random() * 30;
      traffic.push(Math.round(baseTraffic * businessHoursMultiplier + randomVariation));
    }
    
    return { hours, traffic };
  }

  /**
   * Get system health status
   */
  async getSystemHealth(tenantId) {
    try {
      const whereClause = tenantId ? { tenant_id: tenantId } : {};


      // Get NAS status
      const nasDevices = await NasDevice.findAll({
        where: whereClause,
        attributes: ['id', 'nasname', 'status'],
        order: [['updated_at', 'DESC']]
      });

      return {
        nasDevices: nasDevices
      };
    } catch (error) {
      console.error('System health error:', error);
      return { nasDevices: [] };
    }
  }
}

module.exports = DashboardService;
