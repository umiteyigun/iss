# Database Initialization

## Overview
This directory contains the database initialization SQL script for the RADIUS Multi-Tenant Admin Panel.

## Files
- **init.sql**: Complete database schema with all tables, relationships, and initial data

## Database Structure

### Core Tables
1. **tenants** - Multi-tenant isolation
2. **members** - Admin users (panel users)
3. **roles & permissions** - RBAC system
4. **packetsInfo** - Internet packages

### RADIUS Tables
1. **radcheck** - User authentication (username/password)
2. **radreply** - User reply attributes (Framed-IP-Address, etc.)
3. **radacct** - Accounting/session records
4. **radippool** - IP pool management with NAT support
   - `framedipaddress`: Private IP
   - `nasipaddress`: Shared public IP for NAT
   - `port`: Port range for NAT mapping

### Network Management
1. **nas** - NAS devices (RADIUS clients)
2. **routers** - Mikrotik devices
3. **metroIP** - Static & shared public IP management
   - `ip_type=0`: Static/stock IPs
   - `ip_type=1`: Shared IPs with port ranges
   - `ip_type=2`: Extra routed IPs

### Extended Information
1. **usersInfo** - Extended user information

## Default Credentials

### Database
- **Host**: localhost (or mysql container)
- **Port**: 3306
- **Database**: radius
- **User**: root
- **Password**: 321321

### Admin Panel
- **Username**: `admin`
- **Password**: `admin123`
- **Role**: Super Administrator
- **Note**: Password is bcrypt hashed in database

## Usage

### With Docker Compose
The init.sql file is automatically executed when MySQL container starts for the first time:
```bash
docker-compose up -d mysql
```

### Manual Import
```bash
mysql -u root -p321321 < database/init.sql
```

## Important Notes

1. **First Run**: Database is automatically created and initialized on first startup
2. **Data Persistence**: MySQL data is stored in Docker volume `mysql_data`
3. **Character Set**: utf8mb4 for full Unicode support
4. **Collation**: utf8mb4_unicode_ci for proper sorting

## Reset Database
To completely reset the database:
```bash
docker-compose down -v  # This will remove volumes
docker-compose up -d    # This will reinitialize
```

## NAT Configuration
The `radippool` table now supports NAT configuration:
- Private IP users have a `framedipaddress` (e.g., 10.10.51.123)
- Shared public IP stored in `nasipaddress` (e.g., 212.98.241.131)
- Port ranges stored in `port` field (e.g., "62401-63700")
- NAT rules are automatically synced with Mikrotik devices

## IP Type Management
Metro IP table supports three types:
- **Type 0 (Static)**: Dedicated public IPs without port ranges
- **Type 1 (Shared)**: Public IPs with port ranges for NAT
- **Type 2 (Extra)**: Additional routed IPs for users

