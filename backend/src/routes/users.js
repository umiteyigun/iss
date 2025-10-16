const express = require('express');
const { Op, literal } = require('sequelize');
const { Radcheck, UsersInfo, Tenant, Package, Radreply, Radippool, MetroIP, Radacct, NasDevice } = require('../models');
const MikrotikService = require('../services/MikrotikService');

const router = express.Router();

// Get all users
router.get('/', async (req, res) => {
  try {
    const userTenantId = req.user?.tenantId;
    const requestedTenantId = req.query.tenantId ? parseInt(req.query.tenantId) : null;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    let whereClause = {};
    
    // Tenant filtering
    // Super admin (tenant_id = 0 or null) can see all users or filter by specific tenant
    // Regular admin can only see their tenant users
    if (userTenantId === 0 || userTenantId === null) {
      // Super admin - use requested tenantId if provided, otherwise show all
      if (requestedTenantId !== null && requestedTenantId !== undefined) {
        whereClause.tenant_id = requestedTenantId;
      }
      // If no tenantId requested, show all (no filter)
    } else {
      // Regular admin - only show their tenant users
      whereClause.tenant_id = userTenantId;
    }

    // Search functionality
    if (search) {
      whereClause.username = {
        [require('sequelize').Op.like]: `%${search}%`
      };
    }

    console.log('🔍 Backend - userTenantId:', userTenantId);
    console.log('🔍 Backend - requestedTenantId:', requestedTenantId);
    console.log('🔍 Backend - whereClause:', whereClause);
    
    // Get unique usernames first (to avoid duplicates from multiple attributes)
    const { count, rows: radcheckUsers } = await Radcheck.findAndCountAll({
      where: {
        ...whereClause,
        attribute: 'Cleartext-Password'  // Correct capitalization
      },
      limit,
      offset,
      order: [['id', 'DESC']],
      group: ['Radcheck.username'],  // Group by username to get unique records
      distinct: true,  // Count distinct usernames
      include: [
        {
          model: UsersInfo,
          as: 'userInfo',
          required: false,
          include: [
            {
              model: Package,
              as: 'package',
              required: false,
              foreignKey: 'packet',
              sourceKey: 'packet'
            }
          ]
        },
        {
          model: Tenant,
          as: 'tenant',
          required: false
        }
      ]
    });

    console.log('🔍 Backend - Found radcheckUsers:', radcheckUsers.length);
    console.log('🔍 Backend - Total count:', count);

    // Helper function to get IP address, expiration and router info for a user
    const getUserIpAddress = async (username, tenantId) => {
      // First check Radreply for Framed-IP-Address (primary IP)
      const radreply = await Radreply.findOne({
        where: {
          username: username,
          attribute: 'Framed-IP-Address'
        },
        attributes: ['username', 'attribute', 'value']
      });
      
      if (radreply) {
        // Check if this is a private IP (dynamic mode)
        const primaryIp = radreply.value;
        const isPrivate = /^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/.test(primaryIp);
        
        // Get router info for this user
        const isStatic = !isPrivate;
        console.log(`[getUserIpAddress] Getting router for user: ${username}, isStatic: ${isStatic}`);
        const router = await getDefaultRouter(username, isStatic);
        console.log(`[getUserIpAddress] Found router:`, router ? { id: router.id, nasname: router.nasname, shortname: router.shortname } : 'null');
        
        if (isPrivate) {
          // Dynamic mode - check Radippool for full NAT info
          const ipPool = await Radippool.findOne({
            where: {
              username: username,
              tenant_id: tenantId
            }
          });
          
          return {
            ip_address: primaryIp,
            sabitip: 'No', // Dynamic IP
            private_ip: primaryIp,
            shared_public_ip: ipPool?.nasipaddress || null,
            port_range: ipPool?.port || null,
            router_id: router?.id || null,
            router_name: router?.nasname || null,
            router_shortname: router?.shortname || null
          };
        } else {
          // Static public IP
          return {
            ip_address: primaryIp,
            sabitip: 'Yes', // Static IP from Radreply
            router_id: router?.id || null,
            router_name: router?.nasname || null,
            router_shortname: router?.shortname || null
          };
        }
      }
      
      // Check in radippool for dynamic IPs (if not in Radreply)
      const ipPool = await Radippool.findOne({
        where: {
          username: username,
          tenant_id: tenantId
        }
      });
      
      if (ipPool) {
        return {
          ip_address: ipPool.framedipaddress,
          sabitip: 'No', // Dynamic IP
          private_ip: ipPool.framedipaddress,
          shared_public_ip: ipPool.nasipaddress || null,
          port_range: ipPool.port || null
        };
      }
      
      // Check in metroIP for static IPs
      const metroIP = await MetroIP.findOne({
        where: {
          user: username,
          tenant_id: tenantId
        }
      });
      
      if (metroIP) {
        // Get router info for static IP
        const router = await getDefaultRouter(username, true);
        return {
          ip_address: metroIP.ipaddress,
          sabitip: 'Yes', // Static IP
          router_id: router?.id || null,
          router_name: router?.nasname || null,
          router_shortname: router?.shortname || null
        };
      }
      
      return {
        ip_address: null,
        sabitip: null,
        router_id: null,
        router_name: null,
        router_shortname: null
      };
    };

    // Helper function to get expiration date for a user
    const getUserExpiration = async (username, tenantId) => {
      const expirationRecord = await Radcheck.findOne({
        where: {
          username: username,
          attribute: 'Expiration',
          tenant_id: tenantId
        }
      });
      
      return expirationRecord ? expirationRecord.value : null;
    };

    // Transform data to match expected format
    const users = await Promise.all(radcheckUsers.map(async (radcheck) => {
      const ipInfo = await getUserIpAddress(radcheck.username, radcheck.tenant_id);
      const expiration = await getUserExpiration(radcheck.username, radcheck.tenant_id);
      
      return {
      id: radcheck.id,
      username: radcheck.username,
      first_name: radcheck.userInfo?.name || '',
      last_name: radcheck.userInfo?.lastname || '',
      email: radcheck.userInfo?.email || '',
      phone: radcheck.userInfo?.phone || '',
      phone2: radcheck.userInfo?.phone2 || '',
      phone3: radcheck.userInfo?.phone3 || '',
      address: radcheck.userInfo?.address || '',
      kil: radcheck.userInfo?.kil || '',
      kilce: radcheck.userInfo?.kilce || '',
      mahkoy: radcheck.userInfo?.mahkoy || '',
      tcadde: radcheck.userInfo?.tcadde || '',
      tdiskapino: radcheck.userInfo?.tdiskapino || '',
      tickapino: radcheck.userInfo?.tickapino || '',
      tpostano: radcheck.userInfo?.tpostano || '',
      tadresno: radcheck.userInfo?.tadresno || '',
      tc: radcheck.userInfo?.tc || '',
      cinsiyet: radcheck.userInfo?.cinsiyet || '',
      uyruk: radcheck.userInfo?.uyruk || '',
      dogumyeri: radcheck.userInfo?.dogumyeri || '',
      dogumtarihi: radcheck.userInfo?.dogumtarihi || '',
      babaadi: radcheck.userInfo?.babaadi || '',
      anaadi: radcheck.userInfo?.anaadi || '',
      anakizliksoyadi: radcheck.userInfo?.anakizliksoyadi || '',
      unvan: radcheck.userInfo?.unvan || '',
      meslek: radcheck.userInfo?.meslek || '',
      vergino: radcheck.userInfo?.vergino || '',
      pasaportno: radcheck.userInfo?.pasaportno || '',
      ciltno: radcheck.userInfo?.ciltno || '',
      kutukno: radcheck.userInfo?.kutukno || '',
      sayfano: radcheck.userInfo?.sayfano || '',
      kserino: radcheck.userInfo?.kserino || '',
      kverildigiyer: radcheck.userInfo?.kverildigiyer || '',
      kverildigitarih: radcheck.userInfo?.kverildigitarih || '',
      ftipi: radcheck.userInfo?.ftipi || '',
      osifre: radcheck.userInfo?.osifre || '',
      adurum: radcheck.userInfo?.adurum || '',
      sabitip: ipInfo.sabitip || radcheck.userInfo?.sabitip || '',
      atipi: radcheck.userInfo?.atipi || '',
      vergidairesi: radcheck.userInfo?.vergidairesi || '',
      invoice_type: radcheck.userInfo?.invoice_type || 0,
      is_active: radcheck.userInfo?.is_active || 1,
      ip_address: ipInfo.ip_address || '',
      private_ip: ipInfo.private_ip || null,
      shared_public_ip: ipInfo.shared_public_ip || null,
      port_range: ipInfo.port_range || null,
      router_id: ipInfo.router_id || null,
      router_name: ipInfo.router_name || null,
      router_shortname: ipInfo.router_shortname || null,
      expiration: expiration || '',
      package_id: radcheck.userInfo?.package?.id || null,
      package_name: radcheck.userInfo?.packet || '',
      tenant_id: radcheck.tenant_id,
      is_active: radcheck.attribute === 'Cleartext-password',
      created_at: radcheck.created_at,
      updated_at: radcheck.updated_at,
      package: radcheck.userInfo?.package ? {
        id: radcheck.userInfo.package.id,
        name: radcheck.userInfo.package.name,
        download: radcheck.userInfo.package.download,
        upload: radcheck.userInfo.package.upload,
        price: radcheck.userInfo.package.price,
        traffic: radcheck.userInfo.package.traffic
      } : null,
      tenant: radcheck.tenant ? {
        id: radcheck.tenant.id,
        name: radcheck.tenant.name
      } : null
      };
    }));

    console.log('🔍 Backend - Transformed users:', users.length);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          total: count,
          page,
          limit,
          pages: Math.ceil(count / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;

    const whereClause = { id };
    if (tenantId !== null && tenantId !== undefined && tenantId !== 0) {
      whereClause.tenant_id = tenantId;
    }

    const radcheckUser = await Radcheck.findOne({
      where: whereClause,
      include: [
        {
          model: UsersInfo,
          as: 'userInfo',
          required: false
        },
        {
          model: Tenant,
          as: 'tenant',
          required: false
        }
      ]
    });

    if (!radcheckUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Transform data to match expected format
    const user = {
      id: radcheckUser.id,
      username: radcheckUser.username,
      first_name: radcheckUser.userInfo?.name || '',
      last_name: radcheckUser.userInfo?.lastname || '',
      email: radcheckUser.userInfo?.email || '',
      phone: radcheckUser.userInfo?.phone || '',
      package_id: null,
      tenant_id: radcheckUser.tenant_id,
      is_active: radcheckUser.attribute === 'Cleartext-password',
      created_at: radcheckUser.created_at,
      updated_at: radcheckUser.updated_at,
      package: null,
      tenant: radcheckUser.tenant ? {
        id: radcheckUser.tenant.id,
        name: radcheckUser.tenant.name
      } : null
    };

    res.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user'
    });
  }
});

// Create new user
router.post('/', async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const { 
      username, password, first_name, last_name, email, phone, package_id, tenant_id,
      // İletişim bilgileri
      phone2, phone3, address,
      // Adres bilgileri
      kil, kilce, mahkoy, tcadde, tdiskapino, tickapino, tpostano, tadresno,
      // Kimlik bilgileri
      tc, cinsiyet, uyruk, dogumyeri, dogumtarihi, musteri_tipi,
      // Aile bilgileri
      babaadi, anaadi, anakizliksoyadi,
      // İş bilgileri
      unvan, meslek, vergino, vergidairesi,
      // Kimlik belgesi bilgileri
      pasaportno, ciltno, kutukno, sayfano, kserino, kverildigiyer, kverildigitarih,
      // Teknik bilgiler
      ftipi, osifre, adurum, sabitip, atipi, invoice_type, is_active, expiration
    } = req.body;

    // Determine tenant_id for super admin
    let userTenantId = tenantId;
    if (tenantId === null || tenantId === undefined) {
      userTenantId = req.user?.tenantId;
    }

    // Get package name if package_id is provided
    let packageName = null;
    if (package_id) {
      const packageItem = await Package.findByPk(package_id);
      if (packageItem) {
        packageName = packageItem.name;
      }
    }

    // Create Radcheck entries
    await Radcheck.create({
      username,
      attribute: 'Cleartext-password',
      op: ':=',
      value: password,
      tenant_id: userTenantId
    });

    await Radcheck.create({
      username,
      attribute: 'Expiration',
      op: ':=',
      value: '1 Oct 2026 00:00',
      tenant_id: userTenantId
    });

    // Create UsersInfo entry
    const userInfo = await UsersInfo.create({
      username,
      name: first_name,
      lastname: last_name,
      email,
      phone,
      phone2,
      phone3,
      address,
      kil,
      kilce,
      mahkoy,
      tcadde,
      tdiskapino,
      tickapino,
      tpostano,
      tadresno,
      tc,
      cinsiyet,
      uyruk,
      dogumyeri,
      dogumtarihi,
      babaadi,
      anaadi,
      anakizliksoyadi,
      unvan,
      meslek,
      vergino,
      pasaportno,
      ciltno,
      kutukno,
      sayfano,
      kserino,
      kverildigiyer,
      kverildigitarih,
      ftipi,
      osifre,
      adurum,
      sabitip,
      atipi,
      vergidairesi,
      invoice_type,
      is_active,
      packet: packageName,
      tenant_id: userTenantId
    });

    // Create Radreply entries for IP address and rate limit
    // IP address will be handled separately based on sabitip value

    // Add rate limit from package
    if (packageItem) {
      const rateLimit = `${packageItem.download}M/${packageItem.upload}M`;
      await Radreply.create({
        username,
        attribute: 'Mikrotik-Rate-Limit',
        op: '=',
        value: rateLimit,
        tenant_id: userTenantId
      });
    }

    // Add Auth-Type := Reject if user is inactive
    if (is_active === 0) {
      await Radcheck.create({
        username,
        attribute: 'Auth-Type',
        op: ':=',
        value: 'Reject',
        tenant_id: userTenantId
      });
    }

    // Add Expiration date if provided
    if (expiration) {
      await Radcheck.create({
        username,
        attribute: 'Expiration',
        op: ':=',
        value: expiration,
        tenant_id: userTenantId
      });
    }

    // IP Pool/Metro IP updates will be handled by frontend when IP is selected

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { 
        user: {
          id: radcheckUser.id,
          username: radcheckUser.username,
          first_name: userInfo.name,
          last_name: userInfo.lastname,
          email: userInfo.email,
          phone: userInfo.phone,
          phone2: userInfo.phone2,
          phone3: userInfo.phone3,
          address: userInfo.address,
          kil: userInfo.kil,
          kilce: userInfo.kilce,
          mahkoy: userInfo.mahkoy,
          tcadde: userInfo.tcadde,
          tdiskapino: userInfo.tdiskapino,
          tickapino: userInfo.tickapino,
          tpostano: userInfo.tpostano,
          tadresno: userInfo.tadresno,
          tc: userInfo.tc,
          cinsiyet: userInfo.cinsiyet,
          uyruk: userInfo.uyruk,
          dogumyeri: userInfo.dogumyeri,
          dogumtarihi: userInfo.dogumtarihi,
          babaadi: userInfo.babaadi,
          anaadi: userInfo.anaadi,
          anakizliksoyadi: userInfo.anakizliksoyadi,
          unvan: userInfo.unvan,
          meslek: userInfo.meslek,
          vergino: userInfo.vergino,
          pasaportno: userInfo.pasaportno,
          ciltno: userInfo.ciltno,
          kutukno: userInfo.kutukno,
          sayfano: userInfo.sayfano,
          kserino: userInfo.kserino,
          kverildigiyer: userInfo.kverildigiyer,
          kverildigitarih: userInfo.kverildigitarih,
          ftipi: userInfo.ftipi,
          osifre: userInfo.osifre,
          adurum: userInfo.adurum,
          sabitip: userInfo.sabitip,
          atipi: userInfo.atipi,
          vergidairesi: userInfo.vergidairesi,
          package_id: package_id,
          package_name: packageName,
          tenant_id: userTenantId
        }
      }
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user'
    });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;
    const { 
      username, password, first_name, last_name, email, phone, package_id, tenant_id,
      // İletişim bilgileri
      phone2, phone3, address,
      // Adres bilgileri
      kil, kilce, mahkoy, tcadde, tdiskapino, tickapino, tpostano, tadresno,
      // Kimlik bilgileri
      tc, cinsiyet, uyruk, dogumyeri, dogumtarihi, musteri_tipi,
      // Aile bilgileri
      babaadi, anaadi, anakizliksoyadi,
      // İş bilgileri
      unvan, meslek, vergino, vergidairesi,
      // Kimlik belgesi bilgileri
      pasaportno, ciltno, kutukno, sayfano, kserino, kverildigiyer, kverildigitarih,
      // Teknik bilgiler
      ftipi, osifre, adurum, sabitip, atipi, invoice_type, is_active, expiration
    } = req.body;

    const whereClause = { id };
    if (tenantId !== null && tenantId !== undefined && tenantId !== 0) {
      whereClause.tenant_id = tenantId;
    }

    const radcheckUser = await Radcheck.findOne({ where: whereClause });

    if (!radcheckUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Determine tenant_id for super admin
    let userTenantId = tenant_id;
    if (tenant_id === null || tenant_id === undefined) {
      userTenantId = req.user?.tenantId;
    }

    // Get package name if package_id is provided
    let packageName = null;
    if (package_id) {
      const packageItem = await Package.findByPk(package_id);
      if (packageItem) {
        packageName = packageItem.name;
      }
    }

    // Update Radcheck entry
    await radcheckUser.update({
      username,
      ...(password && { value: password }),
      tenant_id: userTenantId
    });

    // Update UsersInfo entry
    const userInfo = await UsersInfo.findOne({ where: { username: radcheckUser.username } });
    if (userInfo) {
      await userInfo.update({
        name: first_name,
        lastname: last_name,
        email,
        phone,
        phone2,
        phone3,
        address,
        kil,
        kilce,
        mahkoy,
        tcadde,
        tdiskapino,
        tickapino,
        tpostano,
        tadresno,
        tc,
        cinsiyet,
        uyruk,
        dogumyeri,
        dogumtarihi,
        babaadi,
        anaadi,
        anakizliksoyadi,
        unvan,
        meslek,
        vergino,
        pasaportno,
        ciltno,
        kutukno,
        sayfano,
        kserino,
        kverildigiyer,
        kverildigitarih,
        ftipi,
        osifre,
        adurum,
        sabitip,
        atipi,
        vergidairesi,
        invoice_type,
        is_active,
        packet: packageName,
        tenant_id: userTenantId
      });
    }

    // IP address changes will be handled by frontend when IP is selected

    // Update rate limit in radreply
    if (packageItem) {
      const rateLimit = `${packageItem.download}M/${packageItem.upload}M`;
      
      // Remove old rate limit
      await Radreply.destroy({
        where: { 
          username: radcheckUser.username, 
          attribute: 'Mikrotik-Rate-Limit',
          tenant_id: userTenantId 
        }
      });

      // Add new rate limit
      await Radreply.create({
        username,
        attribute: 'Mikrotik-Rate-Limit',
        op: '=',
        value: rateLimit,
        tenant_id: userTenantId
      });
    }

    // Handle Auth-Type := Reject based on is_active status
    const existingAuthType = await Radcheck.findOne({
      where: {
        username: radcheckUser.username,
        attribute: 'Auth-Type',
        tenant_id: userTenantId
      }
    });

    if (is_active === 0 && !existingAuthType) {
      // User is inactive and no Auth-Type exists - add it
      await Radcheck.create({
        username: radcheckUser.username,
        attribute: 'Auth-Type',
        op: ':=',
        value: 'Reject',
        tenant_id: userTenantId
      });
    } else if (is_active === 1 && existingAuthType) {
      // User is active and Auth-Type exists - remove it
      await Radcheck.destroy({
        where: {
          username: radcheckUser.username,
          attribute: 'Auth-Type',
          tenant_id: userTenantId
        }
      });
    }

    // Handle Expiration date
    const existingExpiration = await Radcheck.findOne({
      where: {
        username: radcheckUser.username,
        attribute: 'Expiration',
        tenant_id: userTenantId
      }
    });

    if (expiration && !existingExpiration) {
      // Add new expiration
      await Radcheck.create({
        username: radcheckUser.username,
        attribute: 'Expiration',
        op: ':=',
        value: expiration,
        tenant_id: userTenantId
      });
    } else if (expiration && existingExpiration) {
      // Update existing expiration
      await Radcheck.update(
        { value: expiration },
        {
          where: {
            username: radcheckUser.username,
            attribute: 'Expiration',
            tenant_id: userTenantId
          }
        }
      );
    } else if (!expiration && existingExpiration) {
      // Remove expiration if not provided
      await Radcheck.destroy({
        where: {
          username: radcheckUser.username,
          attribute: 'Expiration',
          tenant_id: userTenantId
        }
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      data: { 
        user: {
          id: radcheckUser.id,
          username: radcheckUser.username,
          first_name: first_name,
          last_name: last_name,
          email: email,
          phone: phone,
          phone2: phone2,
          phone3: phone3,
          address: address,
          kil: kil,
          kilce: kilce,
          mahkoy: mahkoy,
          tcadde: tcadde,
          tdiskapino: tdiskapino,
          tickapino: tickapino,
          tpostano: tpostano,
          tadresno: tadresno,
          tc: tc,
          cinsiyet: cinsiyet,
          uyruk: uyruk,
          dogumyeri: dogumyeri,
          dogumtarihi: dogumtarihi,
          babaadi: babaadi,
          anaadi: anaadi,
          anakizliksoyadi: anakizliksoyadi,
          unvan: unvan,
          meslek: meslek,
          vergino: vergino,
          pasaportno: pasaportno,
          ciltno: ciltno,
          kutukno: kutukno,
          sayfano: sayfano,
          kserino: kserino,
          kverildigiyer: kverildigiyer,
          kverildigitarih: kverildigitarih,
          ftipi: ftipi,
          osifre: osifre,
          adurum: adurum,
          sabitip: sabitip,
          atipi: atipi,
          vergidairesi: vergidairesi,
          package_id: package_id,
          package_name: packageName,
          tenant_id: userTenantId
        }
      }
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user'
    });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;

    const whereClause = { id };
    if (tenantId !== null && tenantId !== undefined && tenantId !== 0) {
      whereClause.tenant_id = tenantId;
    }

    const radcheckUser = await Radcheck.findOne({ where: whereClause });

    if (!radcheckUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete UsersInfo entry first
    await UsersInfo.destroy({ where: { username: radcheckUser.username } });
    
    // Delete Radcheck entries
    await Radcheck.destroy({ 
      where: { 
        username: radcheckUser.username,
        tenant_id: tenantId 
      } 
    });

    // Delete Radreply entries
    await Radreply.destroy({ 
      where: { 
        username: radcheckUser.username,
        tenant_id: tenantId 
      } 
    });

    // Release IP addresses from both IP Pool and Metro IP
    await Radippool.update(
      { username: null },
      { 
        where: { 
          username: radcheckUser.username,
          tenant_id: tenantId 
        } 
      }
    );

    await MetroIP.update(
      { user: null },
      { 
        where: { 
          user: radcheckUser.username,
          tenant_id: tenantId 
        } 
      }
    );

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
});

// Utility: check if IPv4 is private (RFC1918)
function isPrivateIpv4(ip) {
  if (!ip) return false;
  const parts = ip.split('.').map(n => parseInt(n, 10));
  if (parts.length !== 4 || parts.some(n => Number.isNaN(n))) return false;
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

// Assign IP to user
router.post('/assign-ip', async (req, res) => {
  try {
    const { username, ipAddress, isStatic, sharedPublicIp, portRange, routerId } = req.body;
    const tenantId = req.user?.tenantId;

    if (!username || !ipAddress) {
      return res.status(400).json({
        success: false,
        message: 'Username and IP address are required'
      });
    }

    // Clear existing IP assignments
    await Radippool.update(
      { 
        username: null,
        nasipaddress: null,
        port: null
      },
      { 
        where: { 
          username: username,
          tenant_id: tenantId 
        } 
      }
    );

    await MetroIP.update(
      { user: null },
      { 
        where: { 
          user: username,
          tenant_id: tenantId 
        } 
      }
    );

    // Clear existing radreply IP (Radreply table doesn't have tenant_id column)
    await Radreply.destroy({
      where: { 
        username: username, 
        attribute: 'Framed-IP-Address'
      }
    });

    // Assign new IP
    if (isStatic) {
      // Static IP - update Metro IP
      await MetroIP.update(
        { user: username },
        { 
          where: { 
            ipaddress: ipAddress,
            tenant_id: tenantId 
          } 
        }
      );

      // If moving to dedicated public IP, clear any previous NAT mappings for this user
      try {
        const router = await getDefaultRouter(username, isStatic);
        if (router) {
          await MikrotikService.clearPrivateToSharedNat(router, username);
        }
      } catch (e) {
        console.warn('Warning clearing old NAT on static assignment:', e.message);
      }
    } else {
      // Dynamic IP - update IP Pool with shared public IP and port range
      await Radippool.update(
        { 
          username: username,
          nasipaddress: sharedPublicIp || null,
          port: portRange || '1-5000'
        },
        { 
          where: { 
            framedipaddress: ipAddress,
            tenant_id: tenantId 
          } 
        }
      );
    }

    // Add IP to radreply
    await Radreply.create({
      username,
      attribute: 'Framed-IP-Address',
      op: '=',
      value: ipAddress,
      tenant_id: tenantId
    });

    // NAT management for private -> shared public
    try {
      const isPrivate = isPrivateIpv4(ipAddress);
      if (isPrivate) {
        if (!sharedPublicIp) {
          return res.status(400).json({ success: false, message: 'Shared public IP is required for private IP assignments' });
        }

        // Pick router
        let router = null;
        if (routerId) {
          router = await NasDevice.findByPk(routerId);
        }
        if (!router) {
          router = await getDefaultRouter(username, isStatic);
        }
        if (!router || !(router.ruser || router.username) || !(router.naspassword || router.password)) {
          return res.status(400).json({ success: false, message: 'Router credentials not found for NAT configuration' });
        }

        const pr = portRange && typeof portRange === 'string' ? portRange : '1-5000';
        const natResp = await MikrotikService.setPrivateToSharedNat(router, username, ipAddress, sharedPublicIp, pr);
        if (natResp?.success === false) {
          return res.status(500).json({ success: false, message: natResp.message || 'Failed to configure NAT' });
        }
      } else {
        // Public/dedicated assignment: ensure any leftover NAT rules are removed
        const router = await getDefaultRouter(username, isStatic);
        if (router) {
          await MikrotikService.clearPrivateToSharedNat(router, username);
        }
      }
    } catch (natError) {
      console.error('NAT configuration error:', natError);
      // Do not fail the whole assignment if NAT fails; report warning
    }

    res.json({
      success: true,
      message: 'IP assigned successfully'
    });

  } catch (error) {
    console.error('Error assigning IP:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning IP'
    });
  }
});

// GET /api/debug/radippool/:username - Debug radippool for user
router.get('/debug/radippool/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const radippool = await Radippool.findAll({
      where: { username: username },
      attributes: ['id', 'username', 'pool_name', 'nasipaddress', 'framedipaddress']
    });
    
    res.json({
      success: true,
      data: {
        username,
        radippoolRecords: radippool
      }
    });
  } catch (error) {
    console.error('Debug radippool error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking radippool'
    });
  }
});

// GET /api/nas - Get all NAS devices
router.get('/nas', async (req, res) => {
  try {
    const nasDevices = await NasDevice.findAll({
      attributes: ['id', 'nasname', 'shortname', 'status', 'tenant_id'],
      order: [['shortname', 'ASC']]
    });

    res.json({
      success: true,
      data: nasDevices
    });
  } catch (error) {
    console.error('Error fetching NAS devices:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching NAS devices'
    });
  }
});

module.exports = router;

// ================= Extra IPs (Routed) APIs =================

// Helper: get primary IP from Radreply
async function getPrimaryIp(username) {
  const rr = await Radreply.findOne({
    where: { username, attribute: 'Framed-IP-Address' },
    attributes: ['value']
  });
  return rr?.value || null;
}

// Helper: check if user has static IP
async function isUserStaticIp(username) {
  const metroIp = await MetroIP.findOne({
    where: { user: username },
    attributes: ['id'],
    order: [['id', 'DESC']]
  });
  return !!metroIp;
}

// Helper: get default router by latest session
async function getDefaultRouter(username, isStatic = false) {
  let nasname = null;
  
  if (isStatic) {
    // For static IP: get nasname from MetroIP table
    const metroIp = await MetroIP.findOne({
      where: { user: username },
      attributes: ['nasname'],
      order: [['id', 'DESC']]
    });
    nasname = metroIp?.nasname;
  } else {
    // For dynamic IP: get nasname from Radippool table
    console.log(`[getDefaultRouter] Looking for dynamic IP user: ${username}`);
    const radippool = await Radippool.findOne({
      where: { username: username },
      attributes: ['pool_name', 'nasipaddress'],
      order: [['id', 'DESC']]
    });
    console.log(`[getDefaultRouter] Radippool result:`, radippool);
    // Use pool_name to find router by shortname
    nasname = radippool?.pool_name;
  }
  
  // If not found in specific table, fallback to Radacct
  if (!nasname) {
    const last = await Radacct.findOne({
      where: { username },
      attributes: ['nasipaddress'],
      order: [[literal('COALESCE(acctstoptime, acctstarttime)'), 'DESC'], ['radacctid', 'DESC']]
    });
    nasname = last?.nasipaddress;
  }
  
  if (!nasname) return null;
  
  // Find router by nasname or shortname
  let router = await NasDevice.findOne({ where: { nasname: nasname } });
  if (!router) {
    // Try to find by shortname (for dynamic IP users)
    router = await NasDevice.findOne({ where: { shortname: nasname } });
  }
  return router || null;
}

// GET /api/users/:username/extra-ips
router.get('/:username/extra-ips', async (req, res) => {
  try {
    const { username } = req.params;
    const primaryIp = await getPrimaryIp(username);
    
    // Determine if user has static or dynamic IP
    const isPrivate = primaryIp && /^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/.test(primaryIp);
    const isStatic = !isPrivate;
    const router = await getDefaultRouter(username, isStatic);

    let routesOnMikrotik = [];
    if (router && router.ruser && router.naspassword) {
      try {
        console.log(`[extra-ips] Getting routes for user: ${username}, router: ${router.nasname}`);
        
        // Add timeout wrapper for Mikrotik call
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Mikrotik connection timeout')), 15000); // 15 second timeout
        });
        
        const mikrotikPromise = MikrotikService.getRoutes(router.nasname, router.ruser, router.naspassword);
        
        const r = await Promise.race([mikrotikPromise, timeoutPromise]);
        
        if (r?.success) {
          const list = r.data.routes || [];
          routesOnMikrotik = list
            .filter(rt => (primaryIp && rt.gateway === primaryIp) || (rt.comment && rt.comment.includes(username)))
            .map(rt => ({
              dst: rt['dst-address'] || rt.dstAddress || '0.0.0.0/0',
              gateway: rt.gateway || '',
              comment: rt.comment || ''
            }));
        }
      } catch (mikrotikError) {
        console.error(`[extra-ips] Mikrotik error for user ${username}:`, mikrotikError.message);
        // Continue without Mikrotik routes if connection fails
      }
    } else {
      console.log(`[extra-ips] No router or credentials for user: ${username}`);
    }

    // MetroIP assignments (public focus here; UI can filter)
    const metro = await MetroIP.findAll({
      where: { user: username, ip_type: 2 },
      attributes: ['ipaddress', 'tenant_id']
    });

    res.json({
      success: true,
      data: {
        primaryIp,
        defaultRouter: router ? { id: router.id, nasname: router.nasname, shortname: router.shortname } : null,
        routesOnMikrotik,
        metroipAssigned: metro.map(m => ({ ip: m.ipaddress, tenant_id: m.tenant_id }))
      }
    });
  } catch (error) {
    console.error('List extra-ips error:', error);
    res.status(500).json({ success: false, message: 'Failed to list extra IPs' });
  }
});

// POST /api/users/:username/extra-ips
// body: { ip, routerId?, gateway?, comment? }
router.post('/:username/extra-ips', async (req, res) => {
  try {
    const { username } = req.params;
    const tenantId = req.user?.tenantId;
    const { ip, routerId, gateway, comment } = req.body;

    if (!ip) return res.status(400).json({ success: false, message: 'ip is required' });

    const primaryIp = await getPrimaryIp(username);
    if (!primaryIp) return res.status(400).json({ success: false, message: 'Primary IP not found in Radreply' });

    let router = null;
    if (routerId) router = await NasDevice.findByPk(routerId);
    if (!router) router = await getDefaultRouter(username);
    if (!router || !router.ruser || !router.naspassword) {
      return res.status(400).json({ success: false, message: 'Router credentials not found' });
    }

    const dst = ip.includes('/') ? ip : `${ip}/32`;
    const gw = gateway || primaryIp;
    const cmt = comment || `username=${username} extra-ip`;

    // Mikrotik: add route
    const addResp = await MikrotikService.addRoute(router.nasname, router.ruser, router.naspassword, {
      'dst-address': dst,
      gateway: gw,
      comment: cmt
    });
    if (addResp?.success === false) {
      return res.status(500).json({ success: false, message: addResp.message || 'Failed to add route on Mikrotik' });
    }

    // MetroIP: mark assignment
    const ipOnly = ip.includes('/') ? ip.split('/')[0] : ip;
    const existing = await MetroIP.findOne({ where: { ipaddress: ipOnly } });
    if (!existing) {
      await MetroIP.create({ ipaddress: ipOnly, user: username, tenant_id: tenantId ?? 1, ip_type: 2 });
    } else {
      await existing.update({ user: username, tenant_id: tenantId ?? existing.tenant_id, ip_type: 2 });
    }

    res.json({ success: true, message: 'Extra IP routed and recorded' });
  } catch (error) {
    console.error('Add extra-ip error:', error);
    res.status(500).json({ success: false, message: 'Failed to add extra IP' });
  }
});

// DELETE /api/users/:username/extra-ips/:ip
router.delete('/:username/extra-ips/:ip', async (req, res) => {
  try {
    const { username, ip } = req.params;
    const tenantId = req.user?.tenantId;

    const router = await getDefaultRouter(username);
    if (!router || !router.ruser || !router.naspassword) {
      return res.status(400).json({ success: false, message: 'Router credentials not found' });
    }

    // Find route ID(s) on Mikrotik by dst-address
    const r = await MikrotikService.getRoutes(router.nasname, router.ruser, router.naspassword);
    if (r?.success) {
      const dst = ip.includes('/') ? ip : `${ip}/32`;
      const routes = r.data.routes || [];
      const matches = routes.filter(rt => (rt['dst-address'] || rt.dstAddress) === dst && (rt.comment?.includes(username) || true));
      for (const m of matches) {
        if (m.id || m['.id']) {
          await MikrotikService.deleteRoute(router.nasname, router.ruser, router.naspassword, m.id || m['.id']);
        }
      }
    }

    // MetroIP: clear assignment
    const ipOnly = ip.includes('/') ? ip.split('/')[0] : ip;
    await MetroIP.update({ user: null, ip_type: 0 }, { where: { ipaddress: ipOnly, user: username, tenant_id: tenantId } });

    res.json({ success: true, message: 'Extra IP removed' });
  } catch (error) {
    console.error('Delete extra-ip error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove extra IP' });
  }
});

// GET /api/users/:username/nat-mapping
// Returns detected NAT mapping for a user: { privateIp, sharedPublicIp }
router.get('/:username/nat-mapping', async (req, res) => {
  try {
    const { username } = req.params;
    const tenantId = req.user?.tenantId;

    // First check radippool for private IP + shared public (nasipaddress) mapping
    const poolEntry = await Radippool.findOne({
      where: { username, tenant_id: tenantId }
    });

    if (poolEntry && poolEntry.framedipaddress && poolEntry.nasipaddress) {
      // radippool has the mapping: framedipaddress=private, nasipaddress=public shared
      return res.json({
        success: true,
        data: {
          privateIp: poolEntry.framedipaddress,
          sharedPublicIp: poolEntry.nasipaddress
        }
      });
    }

    // Fallback: try NAT rules if radippool doesn't have it
    const router = await getDefaultRouter(username);
    if (router && router.ruser && router.naspassword) {
      const primaryIp = await getPrimaryIp(username);
      const natResp = await MikrotikService.getNatRules(router.nasname, router.ruser, router.naspassword);
      if (natResp?.success) {
        const rules = (natResp.data?.rules || natResp.data?.nat_rules || []).filter(r => r.chain === 'srcnat');
        let match = null;
        if (primaryIp) {
          match = rules.find(r => (r.comment || '').includes(`username=${username}`) && (r['src-address'] === primaryIp || r.srcAddress === primaryIp));
        }
        if (!match) {
          match = rules.find(r => (r.comment || '').includes(`username=${username}`));
        }
        const sharedPublicIp = match ? (match['to-addresses'] || match.toAddresses || '') : '';
        const privateIp = primaryIp || (match ? (match['src-address'] || match.srcAddress || '') : '');
        return res.json({ success: true, data: { privateIp, sharedPublicIp } });
      }
    }

    // No data found
    return res.json({ success: true, data: { privateIp: '', sharedPublicIp: '' } });
  } catch (error) {
    console.error('Get NAT mapping error:', error);
    return res.status(500).json({ success: false, message: 'Failed to get NAT mapping' });
  }
});

// GET /api/users/:username/nat-status
router.get('/:username/nat-status', async (req, res) => {
  try {
    const { username } = req.params;
    const { routerId } = req.query;
    const adminTenantId = req.user?.tenantId;

    // Find user's actual tenant_id
    const userRadcheck = await Radcheck.findOne({
      where: { username, attribute: 'Cleartext-Password' }
    });

    const userTenantId = userRadcheck?.tenant_id || adminTenantId;

    console.log(`[NAT Status] Checking for user: ${username}`, { adminTenantId, userTenantId });

    // 1. Get user's primary IP from Radreply to determine if private
    const primaryIp = await getPrimaryIp(username);
    const isPrivateIp = primaryIp && /^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/.test(primaryIp);
    
    console.log(`[NAT Status] Primary IP: ${primaryIp}, Is Private: ${isPrivateIp}`);

    // If not private IP, no NAT needed
    if (!isPrivateIp) {
      console.log(`[NAT Status] Public IP - no NAT needed`);
      return res.json({
        success: true,
        data: {
          hasNat: false,
          isPrivateIp: false,
          needsNatConfig: false,
          natDetails: null
        }
      });
    }

    // 2. Check Mikrotik for actual NAT rule (SINGLE SOURCE OF TRUTH)
    let natDetails = null;
    let hasNatOnRouter = false;

    try {
      let router = null;
      
      if (routerId) {
        // Use provided routerId
        router = await NasDevice.findByPk(routerId);
        console.log(`[NAT Status] Using provided routerId: ${routerId}`, router ? { id: router.id, nasname: router.nasname, hasCredentials: !!(router.ruser && router.naspassword) } : 'not found');
      } else {
        // Determine if user has static or dynamic IP
        const isStatic = await isUserStaticIp(username);
        console.log(`[NAT Status] User isStatic: ${isStatic}`);
        router = await getDefaultRouter(username, isStatic);
        console.log(`[NAT Status] Found router:`, router ? { id: router.id, nasname: router.nasname, hasCredentials: !!(router.ruser && router.naspassword) } : 'null');
      }
      
      if (router && router.ruser && router.naspassword) {
        console.log(`[NAT Status] Checking Mikrotik router: ${router.nasname}`);
        
        const rulesResp = await MikrotikService.getNatRules(router.nasname, router.ruser, router.naspassword);
        console.log(`[NAT Status] Mikrotik response:`, rulesResp);
        const rules = rulesResp?.data?.nat_rules || rulesResp?.data?.rules || [];
        console.log(`[NAT Status] Found ${rules.length} NAT rules`);
        
        if (rules && rules.length > 0) {
          // Find NAT rule for this user (check both comment and log-prefix for compatibility)
          const match = rules.find(r => 
            (r.comment || '').includes(`username=${username}`) ||
            (r['log-prefix'] || r.logPrefix || '') === username
          );
          
          if (match) {
            hasNatOnRouter = true;
            const srcAddress = match['src-address'] || match.srcAddress || '';
            const toAddresses = match['to-addresses'] || match.toAddresses || '';
            // IMPORTANT: to-ports is the port range we want (not dst-port which is 0-65535)
            const portRange = match['to-ports'] || match.toPorts || match['to-port'] || match.toPort || '1-5000';
            
            natDetails = {
              privateIp: srcAddress,
              sharedPublicIp: toAddresses,
              portRange: portRange
            };
            
            console.log(`[NAT Status] Found NAT on Mikrotik:`, natDetails);
            
            // 3. Sync Radippool with Mikrotik (keep DB updated)
            try {
              const poolEntry = await Radippool.findOne({
                where: { username, tenant_id: userTenantId }
              });
              
              if (poolEntry) {
                await poolEntry.update({
                  nasipaddress: toAddresses,
                  port: portRange
                });
                console.log(`[NAT Status] Radippool synced with Mikrotik`);
              }
            } catch (syncError) {
              console.warn(`[NAT Status] Failed to sync Radippool:`, syncError.message);
            }
          } else {
            console.log(`[NAT Status] No NAT rule found on Mikrotik for user`);
          }
        }
      }
    } catch (e) {
      console.error('[NAT Status] Error checking Mikrotik:', e.message);
    }

    // 4. Return Mikrotik status (truth) + whether NAT needs to be configured
    return res.json({
      success: true,
      data: {
        hasNat: hasNatOnRouter,
        isPrivateIp: true,
        needsNatConfig: !hasNatOnRouter, // If no NAT on router, needs config
        natDetails: natDetails || {
          privateIp: primaryIp,
          sharedPublicIp: null,
          portRange: null
        }
      }
    });
  } catch (error) {
    console.error('[NAT Status] Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to get NAT status' });
  }
});

// POST /api/users/:username/write-nat
router.post('/:username/write-nat', async (req, res) => {
  try {
    const { username } = req.params;
    const { sharedPublicIp: bodySharedPublicIp, portRange: bodyPortRange, routerId } = req.body || {};
    const adminTenantId = req.user?.tenantId;

    // Find user's actual tenant_id from Radcheck
    const userRadcheck = await Radcheck.findOne({
      where: { username, attribute: 'Cleartext-Password' }
    });

    if (!userRadcheck) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userTenantId = userRadcheck.tenant_id;

    console.log(`[Write NAT] Request for user: ${username}`, { 
      bodySharedPublicIp, 
      bodyPortRange, 
      routerId,
      adminTenantId, 
      userTenantId 
    });

    // Get user's primary IP (private IP)
    const primaryIp = await getPrimaryIp(username);
    if (!primaryIp) {
      console.log(`[Write NAT] ERROR: No primary IP found for user`);
      return res.status(400).json({
        success: false,
        message: 'User has no IP address assigned'
      });
    }

    // Verify it's a private IP
    const isPrivate = /^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/.test(primaryIp);
    if (!isPrivate) {
      console.log(`[Write NAT] ERROR: User has public IP, NAT not needed`);
      return res.status(400).json({
        success: false,
        message: 'User has a public IP address, NAT is not required'
      });
    }

    console.log(`[Write NAT] Private IP found: ${primaryIp}`);

    const privateIp = primaryIp;
    
    // Shared public IP must be provided in request body
    const sharedPublicIp = bodySharedPublicIp;
    const portRange = bodyPortRange || '1-5000';

    if (!sharedPublicIp) {
      console.log(`[Write NAT] ERROR: No shared public IP provided`);
      return res.status(400).json({
        success: false,
        message: 'Shared Public IP is required. Please select a Shared Public IP first.'
      });
    }

    console.log(`[Write NAT] NAT details:`, { privateIp, sharedPublicIp, portRange });

    // Get router
    let router = null;
    if (routerId) {
      router = await NasDevice.findByPk(routerId);
      if (!router) {
        return res.status(400).json({ success: false, message: 'Router not found for provided routerId' });
      }
    } else {
      // Determine if user has static or dynamic IP
      const isStatic = await isUserStaticIp(username);
      router = await getDefaultRouter(username, isStatic);
      
      // If still no router found, return error
      if (!router) {
        return res.status(400).json({
          success: false,
          message: 'Router not found for user. Please select a router manually.'
        });
      }
    }
    if (!router || !(router.ruser || router.username) || !(router.naspassword || router.password)) {
      return res.status(400).json({
        success: false,
        message: 'Router credentials not found'
      });
    }

    const routerUser = router.ruser || router.username;
    const routerPassword = router.naspassword || router.password;

    // Write NAT rule to Mikrotik
    await MikrotikService.setPrivateToSharedNat(
      router,
      username,
      privateIp,
      sharedPublicIp,
      portRange
    );

    console.log(`[Write NAT] NAT rule written to Mikrotik successfully`);

    // Update or create Radippool entry with NAT configuration
    try {
      // Use user's actual tenant_id (not admin's tenant_id)
      const poolEntry = await Radippool.findOne({
        where: { username, tenant_id: userTenantId }
      });

      if (poolEntry) {
        // Update existing entry
        await poolEntry.update({
          nasipaddress: sharedPublicIp,
          port: portRange
        });
        console.log(`[Write NAT] Radippool updated with NAT configuration`);
      } else {
        // Create new entry if user is not in pool yet
        // First, find an available IP pool entry with this private IP
        const availablePoolEntry = await Radippool.findOne({
          where: { 
            framedipaddress: privateIp,
            tenant_id: userTenantId,
            username: null
          }
        });

        if (availablePoolEntry) {
          await availablePoolEntry.update({
            username: username,
            nasipaddress: sharedPublicIp,
            port: portRange
          });
          console.log(`[Write NAT] Available pool entry assigned to user with NAT config`);
        } else {
          console.warn(`[Write NAT] No pool entry found for private IP ${privateIp}`);
        }
      }
    } catch (updateError) {
      console.warn(`[Write NAT] Failed to update Radippool:`, updateError.message);
    }

    return res.json({
      success: true,
      message: 'NAT rule written to router successfully',
      data: {
        privateIp,
        sharedPublicIp,
        portRange
      }
    });
  } catch (error) {
    console.error('Write NAT error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to write NAT rule to router'
    });
  }
});

