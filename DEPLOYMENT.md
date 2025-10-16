# RADIUS Multi-Tenant Admin Panel - Deployment Guide

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose installed
- Ports available: 80, 443, 3000, 3306, 4200, 6379

### Start All Services
```bash
# Clean start (recommended for first time)
docker-compose down -v
docker-compose up -d

# Or incremental start
docker-compose up -d
```

### Stop All Services
```bash
docker-compose down
```

### Restart Specific Service
```bash
docker-compose restart backend
docker-compose restart frontend
docker-compose restart mysql
```

## 📦 Services Overview

| Service | Container Name | Port | Description |
|---------|---------------|------|-------------|
| MySQL 8.0 | radius_mysql | 3306 | Database with auto-init |
| Redis | radius_redis | 6379 | Session storage |
| Backend (Node.js) | radius_backend | 3000 | API server |
| Frontend (Angular) | radius_frontend | 4200 | Web UI |
| Nginx | radius_nginx | 80, 443 | Reverse proxy |

## 🔐 Default Credentials

### Admin Panel
- **URL**: http://localhost or http://localhost:4200
- **Username**: `admin`
- **Password**: `admin123`
- **Role**: Super Administrator
- **Note**: Password is bcrypt hashed (cost factor: 12)

⚠️ **IMPORTANT**: Change the default admin password immediately after first login!

### Database
- **Host**: localhost (or mysql in Docker network)
- **Port**: 3306
- **Database**: radius
- **User**: root
- **Password**: 321321

## 🗄️ Database

### Automatic Initialization
The database is automatically created and initialized when MySQL container starts for the first time using `/database/init.sql`.

### Tables Created
1. **Core Tables**
   - `tenants` - Multi-tenant isolation
   - `members` - Admin users
   - `roles`, `permissions`, `role_permissions`, `member_roles` - RBAC system
   - `packetsInfo` - Internet packages

2. **RADIUS Tables**
   - `radcheck` - Authentication
   - `radreply` - Reply attributes (Framed-IP)
   - `radacct` - Accounting records
   - `radippool` - IP pool with NAT support

3. **Network Management**
   - `nas` - NAS devices
   - `routers` - Mikrotik devices
   - `metroIP` - Static & shared public IPs

4. **Extended Info**
   - `usersInfo` - Extended user information

### Reset Database
```bash
docker-compose down -v  # Removes all volumes
docker-compose up -d    # Reinitializes everything
```

### Manual Database Access
```bash
# Connect to MySQL
docker exec -it radius_mysql mysql -uroot -p321321 radius

# View tables
docker exec radius_mysql mysql -uroot -p321321 -e "USE radius; SHOW TABLES;"

# Import SQL manually
docker exec -i radius_mysql mysql -uroot -p321321 radius < /path/to/script.sql
```

## 🔧 Configuration

### Backend Configuration
Edit `docker-compose.yml` backend environment variables:
- `DB_HOST`: MySQL host (default: mysql)
- `DB_PORT`: MySQL port (default: 3306)
- `DB_NAME`: Database name (default: radius)
- `DB_USER`: Database user (default: root)
- `DB_PASSWORD`: Database password (default: 321321)
- `JWT_SECRET`: JWT secret key
- `CORS_ORIGIN`: Allowed CORS origin

### Using External MySQL
To use an external MySQL server instead of Docker:
1. Comment out the `mysql` service in `docker-compose.yml`
2. Update backend `DB_HOST` to your MySQL server IP
3. Ensure the database exists and is initialized
4. Run: `docker-compose up -d`

## 📊 NAT Configuration Feature

### Overview
The system supports NAT (Network Address Translation) configuration for users with private IPs.

### How It Works
1. **Dynamic IP Assignment**
   - User gets a private IP (e.g., 10.10.51.123) from `radippool`
   - User gets a shared public IP (e.g., 212.98.241.131) with port range
   - NAT mapping is stored in `radippool` table

2. **Data Storage**
   - `radippool.framedipaddress`: Private IP
   - `radippool.nasipaddress`: Shared public IP
   - `radippool.port`: Port range (e.g., "62401-63700")

3. **NAT Status UI**
   - Edit user → Technical tab
   - If dynamic IP, NAT status is checked automatically
   - If NAT not configured on router, "Write NAT Rule" button appears
   - Click button to sync NAT rule to Mikrotik

## 🔄 IP Type Management

### MetroIP Types
- **Type 0 (Static)**: Dedicated public IPs without port ranges
- **Type 1 (Shared)**: Public IPs with port ranges for NAT
- **Type 2 (Extra)**: Additional routed IPs for users

### IP Assignment Flow
1. **Static IP**
   - Select "Static IP: Yes"
   - Choose from available static public IPs (Type 0)
   - IP assigned directly to user

2. **Dynamic IP**
   - Select "Static IP: No"
   - Choose private IP from pool
   - Choose shared public IP with port range
   - NAT rule written to Mikrotik

## 📝 Logs

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f mysql
docker-compose logs -f frontend

# Last N lines
docker logs radius_backend --tail 50
```

## 🔑 Change Admin Password

### Method 1: From Admin Panel
1. Login as admin
2. Go to Members section
3. Edit admin user
4. Change password
5. Save

### Method 2: From Database (if locked out)
```bash
# Generate new password hash
docker exec radius_backend node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('YOUR_NEW_PASSWORD', 12).then(hash => console.log(hash));"

# Update password in database (replace HASH with output from above)
docker exec radius_mysql mysql -uroot -p321321 -e "USE radius; UPDATE members SET password = 'HASH' WHERE username = 'admin';"

# Restart backend
docker-compose restart backend
```

### Method 3: Reset to Default
```bash
# Reset to admin123
docker exec radius_mysql mysql -uroot -p321321 -e "USE radius; UPDATE members SET password = '\$2a\$12\$/0nzrtVpNXLndpLpkaOEUeNVsvhqo7Jib3/1nJuqavOYo.1GjJiJu' WHERE username = 'admin';"
docker-compose restart backend
```

## 🛠️ Development

### Backend Development
```bash
cd backend
npm install
npm run dev
```

### Frontend Development
```bash
cd frontend
npm install
npm start
```

### Build for Production
```bash
# Build all
docker-compose build --no-cache

# Build specific service
docker-compose build --no-cache backend
docker-compose build --no-cache frontend
```

## 🔍 Troubleshooting

### Backend not connecting to MySQL
```bash
# Check if MySQL is ready
docker logs radius_mysql | grep "ready for connections"

# Check backend logs
docker logs radius_backend

# Restart backend
docker-compose restart backend
```

### Frontend showing API errors
```bash
# Check if backend is running
curl http://localhost:3000/api/health

# Check backend logs
docker logs radius_backend
```

### Database connection errors
```bash
# Test MySQL connection
docker exec radius_mysql mysql -uroot -p321321 -e "SELECT 1;"

# Check database exists
docker exec radius_mysql mysql -uroot -p321321 -e "SHOW DATABASES;"
```

## 📦 Data Persistence

### Volumes
- `mysql_data`: MySQL database files
- `redis_data`: Redis persistence

### Backup Database
```bash
# Backup
docker exec radius_mysql mysqldump -uroot -p321321 radius > backup_$(date +%Y%m%d).sql

# Restore
docker exec -i radius_mysql mysql -uroot -p321321 radius < backup_20251016.sql
```

## 🌐 Production Deployment

### Using External MySQL
1. Create database on your MySQL server
2. Import `database/init.sql`
3. Update `docker-compose.yml` backend environment
4. Remove or comment out mysql service
5. Deploy: `docker-compose up -d`

### SSL/HTTPS Configuration
1. Add SSL certificates to `/ssl` directory
2. Update `nginx.conf` with SSL configuration
3. Restart nginx: `docker-compose restart nginx`

## 📞 Support

For issues or questions, check:
- Backend logs: `docker logs radius_backend`
- MySQL logs: `docker logs radius_mysql`
- Frontend build: `docker logs radius_frontend`

## 🎯 Summary

✅ **Database**: Fully initialized with init.sql  
✅ **Admin User**: Created (admin/admin123)  
✅ **NAT Support**: Radippool + MetroIP with NAT tracking  
✅ **Multi-Tenant**: Full tenant isolation  
✅ **RBAC**: Role-based access control  
✅ **Docker**: All services containerized  

Start with: `docker-compose up -d`  
Access at: `http://localhost`

